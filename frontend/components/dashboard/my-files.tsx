"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileListItem,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import { NewDropdownMenu } from "@/components/dashboard/new-dropdown-menu"
import {
  type AuthUser,
  createFolder,
  deleteFile,
  deleteFolder,
  downloadFile,
  type FileRecord,
  type FolderRecord,
  formatBytes,
  formatDateTime,
  getUserPublicKey,
  listFiles,
  listFolders,
  searchUsers,
  shareFile,
  updateFile,
  updateFolder,
  uploadFile,
} from "@/lib/api"
import { useAuth } from "@/lib/auth"
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

type DisplayItem = FileListItem & {
  sizeBytes: number
  meta: string
  rawFile?: FileRecord
}

const ROOT_FOLDER_VALUE = "__root__"

function fileVisual(file: FileRecord): {
  icon: LucideIcon
  iconClassName: string
  meta: string
} {
  const mime = file.mime_type.toLowerCase()

  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) {
    return {
      icon: FileSpreadsheet,
      iconClassName: "bg-emerald-100 text-emerald-700",
      meta: `Spreadsheet • ${formatBytes(file.size)}`,
    }
  }

  if (mime.includes("image")) {
    return {
      icon: FileImage,
      iconClassName: "bg-violet-100 text-violet-700",
      meta: `Image • ${formatBytes(file.size)}`,
    }
  }

  if (mime.includes("presentation") || mime.includes("powerpoint")) {
    return {
      icon: Presentation,
      iconClassName: "bg-rose-100 text-rose-700",
      meta: `Presentation • ${formatBytes(file.size)}`,
    }
  }

  return {
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
    meta: `${file.mime_type || "File"} • ${formatBytes(file.size)}`,
  }
}

function decodeBase64ToBlob(base64Text: string, mimeType: string) {
  const binaryText = window.atob(base64Text)
  const bytes = new Uint8Array(binaryText.length)

  for (let index = 0; index < binaryText.length; index += 1) {
    bytes[index] = binaryText.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType || "application/octet-stream" })
}

function buildFolderPath(folderId: string, folderMap: Map<string, FolderRecord>) {
  const names: string[] = []
  const visited = new Set<string>()
  let pointer = folderMap.get(folderId)

  while (pointer && !visited.has(pointer.id)) {
    visited.add(pointer.id)
    names.unshift(pointer.name)
    pointer = pointer.parent_id ? folderMap.get(pointer.parent_id) : undefined
  }

  return names.join(" / ")
}

export function MyFilesSection() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { token, user } = useAuth()

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [isListView, setIsListView] = useState(false)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [allFolders, setAllFolders] = useState<FolderRecord[]>([])

  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<DisplayItem | null>(null)
  const [shareQuery, setShareQuery] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [shareCandidates, setShareCandidates] = useState<AuthUser[]>([])
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null)

  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState<DisplayItem | null>(null)
  const [destinationFolderId, setDestinationFolderId] = useState<string | null>(null)

  const loadAllFolders = useCallback(async (activeToken: string) => {
    const queue: Array<string | null> = [null]
    const visited = new Set<string>()
    const collected: FolderRecord[] = []

    while (queue.length > 0) {
      const parentId = queue.shift() ?? null
      const nestedFolders = await listFolders(activeToken, parentId)

      for (const folder of nestedFolders) {
        if (visited.has(folder.id)) {
          continue
        }

        visited.add(folder.id)
        collected.push(folder)
        queue.push(folder.id)
      }
    }

    return collected
  }, [])

  const loadItems = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [nextFolders, nextFiles, nextAllFolders] = await Promise.all([
        listFolders(token, currentFolderId),
        listFiles(token, currentFolderId),
        loadAllFolders(token),
      ])

      setFolders(nextFolders)
      setFiles(nextFiles)
      setAllFolders(nextAllFolders)

      if (currentFolderId && !nextAllFolders.some((folder) => folder.id === currentFolderId)) {
        setCurrentFolderId(null)
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat daftar file"
      )
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, loadAllFolders, token])

  const refreshItems = useCallback(async () => {
    await loadItems()
  }, [loadItems])

  useEffect(() => {
    void refreshItems()
  }, [refreshItems])

  const folderMap = useMemo(() => {
    const map = new Map<string, FolderRecord>()

    for (const folder of allFolders) {
      map.set(folder.id, folder)
    }

    return map
  }, [allFolders])

  const breadcrumbs = useMemo<FolderRecord[]>(() => {
    if (!currentFolderId) {
      return []
    }

    const path: FolderRecord[] = []
    const visited = new Set<string>()
    let pointer = folderMap.get(currentFolderId)

    while (pointer && !visited.has(pointer.id)) {
      visited.add(pointer.id)
      path.unshift(pointer)
      pointer = pointer.parent_id ? folderMap.get(pointer.parent_id) : undefined
    }

    return path
  }, [currentFolderId, folderMap])

  const displayItems = useMemo<DisplayItem[]>(() => {
    const folderItems: DisplayItem[] = folders.map((folder) => ({
      id: folder.id,
      kind: "folder",
      name: folder.name,
      owner: user?.username ?? "You",
      updatedAt: formatDateTime(folder.updated_at),
      size: "-",
      sizeBytes: 0,
      meta: "Folder",
      icon: Folder,
      iconClassName: "bg-blue-100 text-blue-700",
    }))

    const fileItems: DisplayItem[] = files.map((file) => {
      const visual = fileVisual(file)

      return {
        id: file.id,
        kind: "file",
        name: file.name,
        owner: user?.username ?? "You",
        updatedAt: formatDateTime(file.updated_at),
        size: formatBytes(file.size),
        sizeBytes: file.size,
        meta: visual.meta,
        icon: visual.icon,
        iconClassName: visual.iconClassName,
        rawFile: file,
      }
    })

    return [...folderItems, ...fileItems]
  }, [files, folders, user?.username])

  const filteredFiles = useMemo(() => {
    const next = [...displayItems]

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
        const aIsFolder = a.kind === "folder"
        const bIsFolder = b.kind === "folder"

        if (aIsFolder === bIsFolder) return a.name.localeCompare(b.name)
        return aIsFolder ? -1 : 1
      })
      return next
    }

    return displayItems
  }, [displayItems, fileFilter])

  const blockedDestinationIds = useMemo(() => {
    const blocked = new Set<string>()

    if (!moveTarget || moveTarget.kind !== "folder" || !moveTarget.id) {
      return blocked
    }

    blocked.add(moveTarget.id)
    const queue = [moveTarget.id]

    while (queue.length > 0) {
      const parentId = queue.shift()

      if (!parentId) {
        continue
      }

      for (const folder of allFolders) {
        if (folder.parent_id === parentId && !blocked.has(folder.id)) {
          blocked.add(folder.id)
          queue.push(folder.id)
        }
      }
    }

    return blocked
  }, [allFolders, moveTarget])

  const moveFolderOptions = useMemo(() => {
    const nestedFolders = allFolders
      .filter((folder) => !blockedDestinationIds.has(folder.id))
      .map((folder) => ({
        id: folder.id,
        label: buildFolderPath(folder.id, folderMap),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return [{ id: null, label: "My Files (Root)" }, ...nestedFolders]
  }, [allFolders, blockedDestinationIds, folderMap])

  const selectedReceiver = useMemo(
    () => shareCandidates.find((candidate) => candidate.id === selectedReceiverId),
    [selectedReceiverId, shareCandidates]
  )

  const getParentFolderId = useCallback(
    (item: FileListItem) => {
      if (item.kind === "folder" && item.id) {
        return folderMap.get(item.id)?.parent_id ?? null
      }

      if (item.kind === "file" && item.id) {
        const ownFile = files.find((file) => file.id === item.id)
        return ownFile?.folder_id ?? null
      }

      return null
    },
    [files, folderMap]
  )

  const searchShareCandidates = useCallback(
    async (query: string) => {
      if (!token) {
        return
      }

      setSearchingUsers(true)

      try {
        const nextCandidates = await searchUsers(token, query)
        setShareCandidates(nextCandidates)

        if (!nextCandidates.some((candidate) => candidate.id === selectedReceiverId)) {
          setSelectedReceiverId(null)
        }
      } catch (searchError) {
        setError(
          searchError instanceof Error
            ? searchError.message
            : "Gagal mencari user"
        )
      } finally {
        setSearchingUsers(false)
      }
    },
    [selectedReceiverId, token]
  )

  function resetShareDialog() {
    setShareDialogOpen(false)
    setShareTarget(null)
    setShareQuery("")
    setShareCandidates([])
    setSelectedReceiverId(null)
  }

  function resetMoveDialog() {
    setMoveDialogOpen(false)
    setMoveTarget(null)
    setDestinationFolderId(null)
  }

  async function handleCreateFolder() {
    if (!token) {
      return
    }

    const folderName = window.prompt("Nama folder baru")

    if (!folderName?.trim()) {
      return
    }

    setBusyAction("Membuat folder...")

    try {
      await createFolder(token, {
        name: folderName.trim(),
        parent_id: currentFolderId,
      })
      await refreshItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal membuat folder"
      )
    } finally {
      setBusyAction(null)
    }
  }

  function triggerUploadFile() {
    fileInputRef.current?.click()
  }

  async function handleUploadFile(event: ChangeEvent<HTMLInputElement>) {
    if (!token) {
      return
    }

    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setBusyAction("Mengunggah file...")

    try {
      await uploadFile(token, {
        file: selectedFile,
        folderId: currentFolderId,
        aesKeyEncrypted: `aes-${selectedFile.name}-${Date.now()}`,
      })
      await refreshItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal mengunggah file"
      )
    } finally {
      event.target.value = ""
      setBusyAction(null)
    }
  }

  function handleOpen(item: FileListItem) {
    if (item.kind === "folder" && item.id) {
      setCurrentFolderId(item.id)
      return
    }

    void handleDownload(item)
  }

  async function handleRename(item: FileListItem) {
    if (!token) {
      return
    }

    const nextName = window.prompt("Ubah nama", item.name)

    if (!nextName?.trim() || nextName.trim() === item.name) {
      return
    }

    setBusyAction("Menyimpan perubahan...")

    try {
      if (item.kind === "folder" && item.id) {
        await updateFolder(token, item.id, { name: nextName.trim() })
      }

      if (item.kind === "file" && item.id) {
        await updateFile(token, item.id, { name: nextName.trim() })
      }

      await refreshItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal mengganti nama"
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleMove(item: FileListItem) {
    const selectedItem = displayItems.find(
      (entry) => entry.id === item.id && entry.kind === item.kind
    )

    if (!selectedItem) {
      setError("Item tidak ditemukan")
      return
    }

    setMoveTarget(selectedItem)
    setDestinationFolderId(getParentFolderId(selectedItem))
    setMoveDialogOpen(true)
  }

  async function handleConfirmMove() {
    if (!token || !moveTarget || !moveTarget.id) {
      return
    }

    const currentParentId = getParentFolderId(moveTarget)

    if (currentParentId === destinationFolderId) {
      resetMoveDialog()
      return
    }

    if (
      moveTarget.kind === "folder" &&
      destinationFolderId &&
      blockedDestinationIds.has(destinationFolderId)
    ) {
      setError("Folder tidak bisa dipindahkan ke dalam dirinya sendiri")
      return
    }

    setBusyAction("Memindahkan item...")

    try {
      if (moveTarget.kind === "folder") {
        await updateFolder(token, moveTarget.id, { parent_id: destinationFolderId })
      }

      if (moveTarget.kind === "file") {
        await updateFile(token, moveTarget.id, { folder_id: destinationFolderId })
      }

      resetMoveDialog()
      await refreshItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal memindahkan item"
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDelete(item: FileListItem) {
    if (!token || !item.id) {
      return
    }

    const confirmed = window.confirm(`Hapus ${item.name}?`)

    if (!confirmed) {
      return
    }

    setBusyAction("Menghapus...")

    try {
      if (item.kind === "folder") {
        await deleteFolder(token, item.id)
      }

      if (item.kind === "file") {
        await deleteFile(token, item.id)
      }

      await refreshItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal menghapus item"
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDownload(item: FileListItem) {
    if (!token || item.kind !== "file" || !item.id) {
      return
    }

    setBusyAction("Menyiapkan unduhan...")

    try {
      const payload = await downloadFile(token, item.id)
      const fileBlob = decodeBase64ToBlob(payload.encrypted_data, payload.mime_type)
      const blobUrl = URL.createObjectURL(fileBlob)
      const anchor = document.createElement("a")

      anchor.href = blobUrl
      anchor.download = payload.name || item.name
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(blobUrl)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal mengunduh file"
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function openShareDialog(item: FileListItem) {
    if (!token || item.kind !== "file" || !item.id) {
      return
    }

    const sourceItem = displayItems.find(
      (entry) => entry.id === item.id && entry.kind === "file"
    )

    if (!sourceItem) {
      setError("File tidak ditemukan")
      return
    }

    setShareTarget(sourceItem)
    setShareDialogOpen(true)
    setShareQuery("")
    setSelectedReceiverId(null)
    await searchShareCandidates("")
  }

  async function handleShareSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await searchShareCandidates(shareQuery.trim())
  }

  async function handleConfirmShare() {
    if (!token || !shareTarget?.id || !selectedReceiverId) {
      return
    }

    setBusyAction("Membagikan file...")

    try {
      const publicKeyOwner = await getUserPublicKey(token, selectedReceiverId)

      await shareFile(token, {
        file_id: shareTarget.id,
        receiver_id: selectedReceiverId,
        aes_key_encrypted_for_receiver:
          shareTarget.rawFile?.aes_key_encrypted ||
          publicKeyOwner.public_key ||
          "shared-aes-key",
      })

      resetShareDialog()
      window.alert(
        `File dibagikan ke ${selectedReceiver?.username ?? publicKeyOwner.username}`
      )
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal membagikan file"
      )
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadFile}
      />

      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3 py-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {user?.username ?? "User"}!
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-blue-400">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setCurrentFolderId(null)}
              >
                My Files
              </button>
              {breadcrumbs.map((folder, index) => {
                const isLast = index === breadcrumbs.length - 1

                return (
                  <div key={folder.id} className="flex items-center gap-1">
                    <span>/</span>
                    <button
                      type="button"
                      className={isLast ? "font-medium text-foreground" : "hover:underline"}
                      onClick={() => setCurrentFolderId(folder.id)}
                      disabled={isLast}
                    >
                      {folder.name}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
            <NewDropdownMenu
              onCreateFolder={handleCreateFolder}
              onUploadFile={triggerUploadFile}
            />
          </div>
        </div>
      </div>

      {busyAction ? <p className="pb-3 text-sm text-muted-foreground">{busyAction}</p> : null}
      {error ? <p className="pb-3 text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="pb-3 text-sm text-muted-foreground">Memuat file...</p> : null}

      {isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          onOpen={handleOpen}
          onShare={openShareDialog}
          onDownload={handleDownload}
          onRename={handleRename}
          onMove={handleMove}
          onDelete={handleDelete}
        />
      ) : (
        <div className="grid gap-4 pt-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={`${file.kind}-${file.id ?? file.name}`}
              name={file.name}
              meta={file.kind === "folder" ? "Folder" : "File"}
              updatedAt={file.updatedAt}
              icon={file.icon}
              iconClassName={file.iconClassName}
              layout="grid"
              onOpen={() => handleOpen(file)}
              onRename={() => void handleRename(file)}
              onMove={() => void handleMove(file)}
              onDelete={() => void handleDelete(file)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={shareDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetShareDialog()
            return
          }

          setShareDialogOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bagikan File</DialogTitle>
            <DialogDescription>
              Pilih penerima untuk file <span className="font-medium text-foreground">{shareTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form className="flex items-center gap-2" onSubmit={handleShareSearchSubmit}>
            <Input
              value={shareQuery}
              onChange={(event) => setShareQuery(event.target.value)}
              placeholder="Cari username atau email"
            />
            <Button type="submit" variant="outline" disabled={searchingUsers}>
              Cari
            </Button>
          </form>

          <div className="max-h-52 overflow-y-auto rounded-md border">
            {searchingUsers ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Mencari user...</p>
            ) : shareCandidates.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">User tidak ditemukan.</p>
            ) : (
              <div className="divide-y">
                {shareCandidates.map((candidate) => {
                  const selected = candidate.id === selectedReceiverId

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      className={`w-full px-3 py-2 text-left transition-colors ${
                        selected ? "bg-accent" : "hover:bg-muted/60"
                      }`}
                      onClick={() => setSelectedReceiverId(candidate.id)}
                    >
                      <p className="text-sm font-medium">{candidate.username}</p>
                      <p className="text-xs text-muted-foreground">{candidate.email}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetShareDialog}>
              Batal
            </Button>
            <Button
              onClick={() => void handleConfirmShare()}
              disabled={!selectedReceiverId || Boolean(busyAction)}
            >
              Bagikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={moveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetMoveDialog()
            return
          }

          setMoveDialogOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pindahkan Item</DialogTitle>
            <DialogDescription>
              Pilih folder tujuan untuk <span className="font-medium text-foreground">{moveTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="move-destination" className="text-sm font-medium">
              Folder tujuan
            </label>
            <select
              id="move-destination"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={destinationFolderId ?? ROOT_FOLDER_VALUE}
              onChange={(event) => {
                const value = event.target.value
                setDestinationFolderId(value === ROOT_FOLDER_VALUE ? null : value)
              }}
            >
              {moveFolderOptions.map((folderOption) => (
                <option
                  key={folderOption.id ?? ROOT_FOLDER_VALUE}
                  value={folderOption.id ?? ROOT_FOLDER_VALUE}
                >
                  {folderOption.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetMoveDialog}>
              Batal
            </Button>
            <Button onClick={() => void handleConfirmMove()} disabled={Boolean(busyAction)}>
              Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
