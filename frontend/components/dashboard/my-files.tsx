"use client"

import { API_BASE } from "@/lib/api"
import { getIcon, getIconClassName, formatBytes, formatDate } from "@/lib/utils/file-utils"
import { useMemo, useState, useEffect, Suspense } from "react"
import { useAppDialog } from "@/hooks/use-app-dialog"
import { useRouter, useSearchParams } from "next/navigation"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
  FileCode2,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FilePreviewContent, isTextDecodable } from "@/components/dashboard/file-preview-content"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileListItem,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import { NewDropdownMenu } from "@/components/dashboard/new-dropdown-menu"
import { ShareDialog } from "@/components/dashboard/share-dialog"
import { PrivateKeyDialog } from "@/components/dashboard/private-key-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  importAESKey,
  decryptAESKey,
  decryptData,
  loadPrivateKey,
} from "@/lib/crypto"
import axios from "axios"
import { Loader2 } from "lucide-react"


function formatContentsItem(item: any) {
  const isFolder = item.type === "folder"
  const metaText = isFolder
    ? `Folder • ${item.items_count || 0} items`
    : formatBytes(item.size)
  return {
    id: item.id,
    name: item.name,
    meta: metaText,
    updatedAt: formatDate(item.updated_at),
    owner: "You",
    size: isFolder ? formatBytes(item.total_size || 0) : formatBytes(item.size),
    sizeBytes: isFolder ? item.total_size || 0 : item.size || 0,
    icon: getIcon(item.mime_type || "", isFolder, item.name),
    iconClassName: getIconClassName(item.mime_type || "", isFolder, item.name),
    isFolder,
    isStarred: item.is_starred,
    parentId: isFolder ? item.parent_id : item.folder_id,
    tags: isFolder ? [] : (item.tags || []).map((t: any) => t.name as string),
  }
}

export function MyFilesSection() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <MyFilesContent />
    </Suspense>
  )
}

function MyFilesContent() {
  const { showAlert } = useAppDialog()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFolderId = searchParams.get("folder")
  const searchQuery = searchParams.get("q")

  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("User")
  const [folderStack, setFolderStack] = useState<
    { id: string; name: string }[]
  >([])

  const [renameItem, setRenameConfirm] = useState<{
    id: string
    name: string
    isFolder: boolean
  } | null>(null)
  const [newName, setNewName] = useState("")

  const [moveItem, setMoveItem] = useState<{
    id: string
    name: string
    isFolder: boolean
  } | null>(null)
  const [moveTargetFolders, setMoveTargetFolders] = useState<any[]>([])
  const [moveCurrentFolderId, setMoveCurrentFolderId] = useState<string | null>(
    null
  )
  const [moveFolderStack, setMoveFolderStack] = useState<
    { id: string; name: string }[]
  >([])
  const [isMoving, setIsMoving] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  const [previewItem, setPreviewItem] = useState<{
    name: string
    url: string
    mimeType: string
    content?: string
    tags?: any[]
  } | null>(null)
  const [shareItem, setShareItem] = useState<{ id: string; name: string } | null>(null)
  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState<{ id: string; name: string } | null>(null)
  const [pendingDownload, setPendingDownload] = useState<{ id: string; name: string } | null>(null)

  const fetchContents = async () => {
    const token = localStorage.getItem("zipher_token")
    if (!token) return

    const q = searchParams.get("q")
    const cacheKey = q ? null : `zipher_cache_contents_${currentFolderId ?? "root"}`
    let hasCachedData = false

    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const raw = JSON.parse(cached)
          setItems(raw.data.map(formatContentsItem))
          if (raw.breadcrumbs) setFolderStack(raw.breadcrumbs)
          setIsLoading(false)
          hasCachedData = true
        } catch {}
      }
    }

    if (!hasCachedData) setIsLoading(true)

    try {
      const url = q
        ? `${API_BASE}/api/v1/search?q=${encodeURIComponent(q)}`
        : currentFolderId
          ? `${API_BASE}/api/v1/contents?folder_id=${currentFolderId}`
          : `${API_BASE}/api/v1/contents`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        if (data.breadcrumbs) {
          setFolderStack(data.breadcrumbs)
        } else if (!currentFolderId) {
          setFolderStack([])
        }
        setItems(data.data.map(formatContentsItem))
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify({ data: data.data, breadcrumbs: data.breadcrumbs }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch contents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("zipher_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.username || "User")
    }

    fetchContents()

    const handleUpdate = () => fetchContents()
    window.addEventListener("contents-updated", handleUpdate)
    return () => window.removeEventListener("contents-updated", handleUpdate)
  }, [currentFolderId, searchParams])

  useEffect(() => {
    if (!moveItem) return

    const fetchMoveTargetFolders = async () => {
      const token = localStorage.getItem("zipher_token")
      try {
        const url = moveCurrentFolderId
          ? `${API_BASE}/api/v1/folders?parent_id=${moveCurrentFolderId}`
          : `${API_BASE}/api/v1/folders`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        if (data.success) {
          setMoveTargetFolders(
            data.data.filter((f: any) => f.id !== moveItem.id)
          )
        }
      } catch (error) {
        console.error("Failed to fetch target folders:", error)
      }
    }

    fetchMoveTargetFolders()
  }, [moveItem, moveCurrentFolderId])

  const handleMoveSubmit = async () => {
    if (!moveItem) return
    setIsMoving(true)

    const token = localStorage.getItem("zipher_token")
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/contents/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            file_ids: moveItem.isFolder ? [] : [moveItem.id],
            folder_ids: moveItem.isFolder ? [moveItem.id] : [],
            target_folder_id: moveCurrentFolderId,
          }),
        }
      )

      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
        setMoveItem(null)
        setMoveCurrentFolderId(null)
        setMoveFolderStack([])
      } else {
        const err = await response.json()
        showAlert("Gagal", err.message || "Gagal memindahkan item")
      }
    } catch (error) {
      console.error("Failed to move item:", error)
    } finally {
      setIsMoving(false)
    }
  }

  const filteredFiles = useMemo(() => {
    const next = [...items]

    if (fileFilter === "smallest") {
      next.sort((a, b) => a.sizeBytes - b.sizeBytes)
      return next
    }

    if (fileFilter === "largest") {
      next.sort((a, b) => b.sizeBytes - a.sizeBytes)
      return next
    }

    if (fileFilter === "folder-first") {
      next.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name)
        return a.isFolder ? -1 : 1
      })
      return next
    }

    return items
  }, [fileFilter, items])

  const handleDelete = async (id: string, isFolder: boolean) => {
    const token = localStorage.getItem("zipher_token")
    const endpoint = isFolder ? `folders/${id}` : `files/${id}`

    try {
      const response = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const handleToggleStar = async (id: string) => {
    const token = localStorage.getItem("zipher_token")
    const item = items.find((i) => i.id === id)
    if (!item) return

    const endpoint = item.isFolder ? `folders/${id}/star` : `files/${id}/star`

    try {
      const response = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
      }
    } catch (error) {
      console.error("Failed to toggle star:", error)
    }
  }

  const handleFolderClick = (id: string, name: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("folder", id)
    params.delete("q")
    router.push(`/dashboard?${params.toString()}`)
  }

  const handleBreadcrumbClick = (index: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (index === -1) {
      params.delete("folder")
    } else {
      params.set("folder", folderStack[index].id)
    }
    params.delete("q")
    router.push(`/dashboard?${params.toString()}`)
  }

  const handleRenameClick = (
    id: string,
    currentName: string,
    isFolder: boolean
  ) => {
    const nameOnly = isFolder
      ? currentName
      : currentName.replace(/\.[^/.]+$/, "")
    setRenameConfirm({ id, name: currentName, isFolder })
    setNewName(nameOnly)
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameItem || !newName.trim()) return

    const token = localStorage.getItem("zipher_token")
    const endpoint = renameItem.isFolder
      ? `folders/${renameItem.id}`
      : `files/${renameItem.id}`

    let finalName = newName.trim()
    if (!renameItem.isFolder) {
      const extension = renameItem.name.split(".").pop()
      finalName = extension ? `${finalName}.${extension}` : finalName
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ name: finalName }),
      })

      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
        setRenameConfirm(null)
      } else {
        const data = await response.json()
        showAlert("Gagal", data.message || "Gagal mengubah nama")
      }
    } catch (error) {
      console.error("Failed to rename:", error)
    }
  }

  const handleKeyConfirm = async () => {
    const key = await loadPrivateKey()
    if (!key) return
    if (pendingOpen) {
      const { id, name } = pendingOpen
      setPendingOpen(null)
      handleOpen(id, name, false)
    } else if (pendingDownload) {
      const { id, name } = pendingDownload
      setPendingDownload(null)
      handleDownload(id, name)
    }
  }

  const handleDownload = async (id: string, name: string) => {
    const token = localStorage.getItem("zipher_token")
    const privateKey = await loadPrivateKey()
    if (!privateKey) {
      setPendingDownload({ id, name })
      setPrivateKeyDialogOpen(true)
      return
    }

    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/files/${id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      const data = response.data

      if (data.encrypted_data && data.aes_key_encrypted) {
        if (privateKey) {
          try {
            const aesKeyStr = await decryptAESKey(data.aes_key_encrypted, privateKey)
            const aesKey = await importAESKey(aesKeyStr)

            const encryptedBuffer = Uint8Array.from(atob(data.encrypted_data), (c) =>
              c.charCodeAt(0)
            ).buffer
            const decryptedBuffer = await decryptData(encryptedBuffer, aesKey)

            const blob = new Blob([decryptedBuffer], { type: data.mime_type })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = data.name
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 100)
            return
          } catch (err) {
            console.error("Decryption failed for download:", err)
          }
        }

        // Fallback: download raw (might be old file or missing key)
        const link = document.createElement("a")
        link.href = `data:${data.mime_type};base64,${data.encrypted_data}`
        link.download = data.name
        link.click()
      }
    } catch (error) {
      console.error("Failed to download file:", error)
    }
  }

  const handleOpen = async (id: string, name: string, isFolder: boolean) => {
    if (isFolder) {
      handleFolderClick(id, name)
    } else {
      setIsOpening(true)
      const token = localStorage.getItem("zipher_token")
      const privateKey = await loadPrivateKey()
      if (!privateKey) {
        setIsOpening(false)
        setPendingOpen({ id, name })
        setPrivateKeyDialogOpen(true)
        return
      }

      try {
        const response = await axios.get(
          `${API_BASE}/api/v1/files/${id}/download?intent=preview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        )
        const data = response.data

        if (data.encrypted_data && data.aes_key_encrypted) {
          if (privateKey) {
            try {
              const aesKeyStr = await decryptAESKey(data.aes_key_encrypted, privateKey)
              const aesKey = await importAESKey(aesKeyStr)

              const encryptedBuffer = Uint8Array.from(atob(data.encrypted_data), (c) =>
                c.charCodeAt(0)
              ).buffer
              const decryptedBuffer = await decryptData(encryptedBuffer, aesKey)

              const blob = new Blob([decryptedBuffer], { type: data.mime_type })
              const url = URL.createObjectURL(blob)
              const content = isTextDecodable(data.mime_type, data.name)
                ? new TextDecoder().decode(decryptedBuffer)
                : undefined

              setPreviewItem({
                name: data.name,
                mimeType: data.mime_type,
                url,
                content,
                tags: data.tags,
              })
              return
            } catch (err) {
              console.error("Decryption failed for preview:", err)
            }
          }

          // Fallback: show raw
          setPreviewItem({
            name: data.name,
            mimeType: data.mime_type,
            url: `data:${data.mime_type};base64,${data.encrypted_data}`,
            tags: data.tags,
          })
        }
      } catch (error) {
        console.error("Failed to open file:", error)
      } finally {
        setIsOpening(false)
      }
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <nav className="no-scrollbar flex items-center overflow-x-auto text-sm font-medium whitespace-nowrap">
              <button
                onClick={() => handleBreadcrumbClick(-1)}
                className={`rounded p-1 transition-colors hover:text-foreground ${currentFolderId ? "text-muted-foreground" : "text-xl font-semibold tracking-tight text-foreground"}`}
              >
                My Files
              </button>

              {folderStack.map((folder, index) => (
                <div key={folder.id} className="flex items-center">
                  <span className="mx-2 text-muted-foreground">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`max-w-[150px] truncate rounded p-1 transition-colors hover:text-foreground ${index === folderStack.length - 1 ? "text-xl font-semibold tracking-tight text-foreground" : "text-muted-foreground"}`}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Suspense
              fallback={
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              }
            >
              <FileLayoutSwitch
                isList={isListView}
                onCheckedChange={setIsListView}
              />
            </Suspense>
            <NewDropdownMenu currentFolderId={currentFolderId} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <p className="text-muted-foreground">
            {searchParams.get("q")
              ? "Tidak ada hasil ditemukan"
              : "Folder ini kosong"}
          </p>
          {searchParams.get("q") && (
            <Button
              variant="link"
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.delete("q")
                window.history.pushState({}, "", url.toString())
                fetchContents()
              }}
            >
              Hapus pencarian
            </Button>
          )}
        </div>
      ) : isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onFolderClick={handleFolderClick}
          onRename={handleRenameClick}
          onMove={(id, name, isFolder) => setMoveItem({ id, name, isFolder })}
          onShare={(id, name) => setShareItem({ id, name })}
          onOpen={handleOpen}
          onDownload={handleDownload}
        />
      ) : (
        <div className="grid gap-4 pt-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              id={file.id}
              name={file.name}
              meta={file.kind === "folder" ? "Folder" : "File"}
              updatedAt={file.updatedAt}
              icon={file.icon}
              iconClassName={file.iconClassName}
              tags={file.tags}
              layout="grid"
              isFolder={file.isFolder}
              isStarred={file.isStarred}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onFolderClick={
                file.isFolder
                  ? () => handleFolderClick(file.id, file.name)
                  : undefined
              }
              onRename={handleRenameClick}
              onMove={(id, name, isFolder) =>
                setMoveItem({ id, name, isFolder })
              }
              onShare={(id, name) => setShareItem({ id, name })}
              onOpen={handleOpen}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {shareItem && (
        <ShareDialog
          open={!!shareItem}
          onOpenChange={(open) => !open && setShareItem(null)}
          fileId={shareItem.id}
          fileName={shareItem.name}
        />
      )}

      <Dialog
        open={!!renameItem}
        onOpenChange={(open) => !open && setRenameConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>
                Ubah Nama {renameItem?.isFolder ? "Folder" : "File"}
              </DialogTitle>
              <DialogDescription>
                Masukkan nama baru untuk item ini.{" "}
                {renameItem?.isFolder
                  ? ""
                  : "Ekstensi file akan tetap dipertahankan."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="rename">Nama Baru</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rename"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  {!renameItem?.isFolder && (
                    <span className="rounded border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                      .{renameItem?.name.split(".").pop()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameConfirm(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!newName.trim()}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!moveItem}
        onOpenChange={(open) => {
          if (!open) {
            setMoveItem(null)
            setMoveCurrentFolderId(null)
            setMoveFolderStack([])
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Pindahkan {moveItem?.isFolder ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Pilih folder tujuan untuk <strong>{moveItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-md border border-border">
            <div className="flex items-center gap-2 border-b bg-muted/30 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  setMoveCurrentFolderId(null)
                  setMoveFolderStack([])
                }}
              >
                <Home className="mr-1 size-4" />
                My Files
              </Button>
              {moveFolderStack.map((f, i) => (
                <div key={f.id} className="flex items-center">
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 max-w-[100px] truncate px-2"
                    onClick={() => {
                      const newStack = moveFolderStack.slice(0, i + 1)
                      setMoveFolderStack(newStack)
                      setMoveCurrentFolderId(f.id)
                    }}
                  >
                    {f.name}
                  </Button>
                </div>
              ))}
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {moveTargetFolders.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ada folder di sini
                </p>
              ) : (
                moveTargetFolders.map((f) => (
                  <button
                    key={f.id}
                    className="flex w-full items-center gap-2 rounded-sm p-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMoveCurrentFolderId(f.id)
                      setMoveFolderStack([
                        ...moveFolderStack,
                        { id: f.id, name: f.name },
                      ])
                    }}
                  >
                    <Folder className="size-4 text-blue-500" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveItem(null)}
            >
              Batal
            </Button>
            <Button
              onClick={handleMoveSubmit}
              disabled={
                isMoving ||
                moveCurrentFolderId ===
                  (items.find((i) => i.id === moveItem?.id)?.parentId || null)
              }
            >
              Pindahkan ke Sini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrivateKeyDialog
        open={privateKeyDialogOpen}
        onOpenChange={setPrivateKeyDialogOpen}
        onConfirm={handleKeyConfirm}
      />

      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) {
            if (previewItem?.url?.startsWith("blob:")) URL.revokeObjectURL(previewItem.url)
            setPreviewItem(null)
          }
        }}
      >
        <DialogContent className="flex h-[90vh] flex-col overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="flex flex-none flex-row items-center justify-between space-y-0 border-b p-4">
            <div>
              <DialogTitle className="max-w-[300px] truncate md:max-w-md">
                {previewItem?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {previewItem?.mimeType}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/20 p-4">
            {previewItem && <FilePreviewContent previewItem={previewItem} />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
