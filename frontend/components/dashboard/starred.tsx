"use client"

import { API_BASE } from "@/lib/api"
import {
  getIcon,
  getIconClassName,
  formatBytes,
  formatDate,
} from "@/lib/utils/file-utils"
import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
  FileCode2,
} from "lucide-react"
import axios from "axios"
import {
  FilePreviewContent,
  isTextDecodable,
} from "@/components/dashboard/file-preview-content"

import { PrivateKeyDialog } from "@/components/dashboard/private-key-dialog"
import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
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

function formatStarredItem(item: any) {
  const isFolder = item.type === "folder"
  const metaText = isFolder
    ? `Folder • ${item.items_count || 0} items`
    : formatBytes(item.size || 0)
  return {
    id: item.id,
    name: item.name,
    meta: metaText,
    updatedAt: formatDate(item.updated_at),
    owner: "You",
    size: isFolder
      ? formatBytes(item.total_size || 0)
      : formatBytes(item.size || 0),
    sizeBytes: isFolder ? item.total_size || 0 : item.size || 0,
    location: isFolder
      ? item.parent?.name || "Root"
      : item.folder?.name || "Root",
    icon: getIcon(item.mime_type || "", isFolder, item.name),
    iconClassName: getIconClassName(item.mime_type || "", isFolder, item.name),
    isFolder,
    isStarred: true,
    tags: isFolder ? [] : (item.tags || []).map((t: any) => t.name as string),
  }
}

export function StarredSection() {
  const router = useRouter()
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [renameItem, setRenameConfirm] = useState<{
    id: string
    name: string
    isFolder: boolean
  } | null>(null)
  const [newName, setNewName] = useState("")
  const [previewItem, setPreviewItem] = useState<{
    name: string
    url: string
    mimeType: string
    content?: string
  } | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState<{
    id: string
    name: string
  } | null>(null)
  const [pendingDownload, setPendingDownload] = useState<{
    id: string
    name: string
  } | null>(null)

  const fetchStarred = async () => {
    const cached = localStorage.getItem("zipher_cache_starred")
    if (cached) {
      try {
        setItems((JSON.parse(cached) as any[]).map(formatStarredItem))
        setIsLoading(false)
      } catch {}
    } else {
      setIsLoading(true)
    }

    const token = localStorage.getItem("zipher_token")
    if (!token) return

    try {
      const response = await axios.get(`${API_BASE}/api/v1/files/starred`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = response.data
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data.map(formatStarredItem))
        localStorage.setItem("zipher_cache_starred", JSON.stringify(data.data))
      } else {
        setItems([])
      }
    } catch (error) {
      console.error("Failed to fetch starred items:", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStarred()

    const handleUpdate = () => fetchStarred()
    window.addEventListener("contents-updated", handleUpdate)
    return () => window.removeEventListener("contents-updated", handleUpdate)
  }, [])

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

    return items
  }, [fileFilter, items])

  const handleDelete = async (id: string, isFolder: boolean) => {
    const token = localStorage.getItem("zipher_token")
    const endpoint = isFolder ? `folders/${id}` : `files/${id}`

    try {
      await axios.delete(`${API_BASE}/api/v1/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      window.dispatchEvent(new Event("contents-updated"))
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
      await axios.post(
        `${API_BASE}/api/v1/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      window.dispatchEvent(new Event("contents-updated"))
    } catch (error) {
      console.error("Failed to toggle star:", error)
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

  const handleOpen = async (id: string, name: string, isFolder: boolean) => {
    if (isFolder) {
      router.push(`/dashboard?folder=${id}`)
      return
    }

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
            const aesKeyStr = await decryptAESKey(
              data.aes_key_encrypted,
              privateKey
            )
            const aesKey = await importAESKey(aesKeyStr)

            const encryptedBuffer = Uint8Array.from(
              atob(data.encrypted_data),
              (c) => c.charCodeAt(0)
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
            })
            return
          } catch (err) {
            console.error("Decryption failed for preview:", err)
          }
        }

        setPreviewItem({
          name: data.name,
          mimeType: data.mime_type,
          url: `data:${data.mime_type};base64,${data.encrypted_data}`,
        })
      }
    } catch (error) {
      console.error("Failed to open file:", error)
    } finally {
      setIsOpening(false)
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
            const aesKeyStr = await decryptAESKey(
              data.aes_key_encrypted,
              privateKey
            )
            const aesKey = await importAESKey(aesKeyStr)

            const encryptedBuffer = Uint8Array.from(
              atob(data.encrypted_data),
              (c) => c.charCodeAt(0)
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

        const link = document.createElement("a")
        link.href = `data:${data.mime_type};base64,${data.encrypted_data}`
        link.download = data.name
        link.click()
      }
    } catch (error) {
      console.error("Failed to download file:", error)
    }
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
      await axios.patch(
        `${API_BASE}/api/v1/${endpoint}`,
        { name: finalName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      window.dispatchEvent(new Event("contents-updated"))
      setRenameConfirm(null)
    } catch (error) {
      console.error("Failed to rename:", error)
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
            <p className="text-sm text-muted-foreground">
              File dan folder favorit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Tidak ada item berbintang</p>
        </div>
      ) : isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          showTrashActions={false}
          showStarredView={true}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onOpen={handleOpen}
          onDownload={handleDownload}
          onRename={handleRenameClick}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              id={file.id}
              name={file.name}
              meta={file.meta}
              updatedAt={file.updatedAt}
              icon={file.icon}
              iconClassName={file.iconClassName}
              tags={file.tags}
              layout="grid"
              isFolder={file.isFolder}
              isStarred={file.isStarred}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onOpen={handleOpen}
              onDownload={handleDownload}
              onRename={handleRenameClick}
            />
          ))}
        </div>
      )}

      <PrivateKeyDialog
        open={privateKeyDialogOpen}
        onOpenChange={setPrivateKeyDialogOpen}
        onConfirm={handleKeyConfirm}
      />

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
                Masukkan nama baru untuk item ini.
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

      {isOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-sm font-medium">Mendekripsi file...</p>
        </div>
      )}

      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open && previewItem) {
            URL.revokeObjectURL(previewItem.url)
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
