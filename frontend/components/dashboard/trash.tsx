"use client"

import { API_BASE } from "@/lib/api"
import {
  getIcon,
  getIconClassName,
  formatBytes,
  formatDate,
} from "@/lib/utils/file-utils"
import { useMemo, useState, useEffect } from "react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
  FileCode2,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function formatTrashFile(item: any) {
  return {
    id: item.id,
    name: item.name,
    meta: formatBytes(item.size),
    updatedAt: formatDate(item.deleted_at),
    owner: "You",
    size: formatBytes(item.size),
    sizeBytes: item.size || 0,
    location: item.folder ? item.folder.name : "My Files",
    icon: getIcon(item.mime_type || "", false, item.name),
    iconClassName: getIconClassName(item.mime_type || "", false, item.name),
    isFolder: false,
    tags: (item.tags || []).map((t: any) => t.name as string),
  }
}

function formatTrashFolder(item: any) {
  return {
    id: item.id,
    name: item.name,
    meta: "Folder",
    updatedAt: formatDate(item.deleted_at),
    owner: "You",
    size: "-",
    sizeBytes: 0,
    location: item.parent ? item.parent.name : "My Files",
    icon: getIcon("", true, item.name),
    iconClassName: getIconClassName("", true, item.name),
    isFolder: true,
  }
}

export function TrashSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    isFolder: boolean
  } | null>(null)
  const [isBulkRestoreConfirmOpen, setIsBulkRestoreConfirmOpen] =
    useState(false)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  useEffect(() => {
    async function fetchTrash() {
      const cached = localStorage.getItem("zipher_cache_trash")
      if (cached) {
        try {
          const raw = JSON.parse(cached)
          setItems([
            ...(raw.folders || []).map(formatTrashFolder),
            ...(raw.files || []).map(formatTrashFile),
          ])
          setIsLoading(false)
        } catch {}
      } else {
        setIsLoading(true)
      }

      const token = localStorage.getItem("zipher_token")
      if (!token) return

      try {
        const [filesRes, foldersRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/files/trash`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_BASE}/api/v1/folders/trash`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ])

        const filesData = await filesRes.json()
        const foldersData = await foldersRes.json()

        const formattedFiles = (filesData.data || []).map(formatTrashFile)
        const formattedFolders = (foldersData.data || []).map(formatTrashFolder)

        setItems([...formattedFolders, ...formattedFiles])
        localStorage.setItem(
          "zipher_cache_trash",
          JSON.stringify({
            files: filesData.data || [],
            folders: foldersData.data || [],
          })
        )
      } catch (error) {
        console.error("Failed to fetch trash:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrash()

    window.addEventListener("contents-updated", fetchTrash)
    return () => window.removeEventListener("contents-updated", fetchTrash)
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

    if (fileFilter === "folder-first") {
      next.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name)
        return a.isFolder ? -1 : 1
      })
      return next
    }

    return items
  }, [fileFilter, items])

  const handleRestore = async (id: string, isFolder: boolean) => {
    const token = localStorage.getItem("zipher_token")
    const endpoint = isFolder ? `folders/${id}/restore` : `files/${id}/restore`

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
      console.error("Failed to restore:", error)
    }
  }

  const handleForceDelete = async () => {
    if (!deleteConfirm) return

    const { id, isFolder } = deleteConfirm
    const token = localStorage.getItem("zipher_token")
    const endpoint = isFolder ? `folders/${id}/force` : `files/${id}/force`

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
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error("Failed to force delete:", error)
    }
  }

  const handleRestoreAll = async () => {
    const token = localStorage.getItem("zipher_token")
    if (!token || items.length === 0) return

    setIsBulkActionLoading(true)
    try {
      await Promise.all(
        items.map((item) => {
          const endpoint = item.isFolder
            ? `folders/${item.id}/restore`
            : `files/${item.id}/restore`
          return fetch(`${API_BASE}/api/v1/${endpoint}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })
        })
      )
      window.dispatchEvent(new Event("contents-updated"))
      setIsBulkRestoreConfirmOpen(false)
    } catch (error) {
      console.error("Failed to restore all:", error)
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    const token = localStorage.getItem("zipher_token")
    if (!token || items.length === 0) return

    setIsBulkActionLoading(true)
    try {
      await Promise.all(
        items.map((item) => {
          const endpoint = item.isFolder
            ? `folders/${item.id}/force`
            : `files/${item.id}/force`
          return fetch(`${API_BASE}/api/v1/${endpoint}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })
        })
      )
      window.dispatchEvent(new Event("contents-updated"))
      setIsBulkDeleteConfirmOpen(false)
    } catch (error) {
      console.error("Failed to delete all:", error)
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
            <p className="text-sm text-muted-foreground">
              File dan folder yang dihapus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={items.length === 0 || isLoading}
              onClick={() => setIsBulkRestoreConfirmOpen(true)}
            >
              Pulihkan Semua
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={items.length === 0 || isLoading}
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
            >
              Hapus Semua
            </Button>
            <div className="mx-1 h-6 w-px bg-border" />
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
        <div className="flex h-40 flex-col items-center justify-center">
          <p className="text-muted-foreground">Trash kosong</p>
        </div>
      ) : isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          showTrashActions={true}
          onRestore={handleRestore}
          onForceDelete={(id, isFolder) => setDeleteConfirm({ id, isFolder })}
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
              onRestore={handleRestore}
              onForceDelete={(id, isFolder) =>
                setDeleteConfirm({ id, isFolder })
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Selamanya?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Item akan dihapus secara
              permanen dari storage Anda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleForceDelete}>
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBulkRestoreConfirmOpen}
        onOpenChange={(open) => !open && setIsBulkRestoreConfirmOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pulihkan Semua Item?</DialogTitle>
            <DialogDescription>
              Semua file di Trash akan dikembalikan ke lokasi asalnya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBulkRestoreConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button disabled={isBulkActionLoading} onClick={handleRestoreAll}>
              {isBulkActionLoading ? "Memproses..." : "Pulihkan Semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={(open) => !open && setIsBulkDeleteConfirmOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kosongkan Trash?</DialogTitle>
            <DialogDescription>
              Semua file di Trash akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={isBulkActionLoading}
              onClick={handleDeleteAll}
            >
              {isBulkActionLoading ? "Memproses..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
