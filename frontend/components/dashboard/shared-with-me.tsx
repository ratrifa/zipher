"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import { Button } from "@/components/ui/button"
import {
  downloadFile,
  formatBytes,
  formatDateTime,
  getSharedByMe,
  getSharedWithMe,
  revokeShare,
  type SharedFileRecord,
} from "@/lib/api"
import { useAuth } from "@/lib/auth"

type DisplayItem = FileListItem & {
  sizeBytes: number
}

function fileVisual(file: SharedFileRecord["file"]): {
  icon: LucideIcon
  iconClassName: string
} {
  const mime = file?.mime_type?.toLowerCase() ?? ""

  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) {
    return {
      icon: FileSpreadsheet,
      iconClassName: "bg-emerald-100 text-emerald-700",
    }
  }

  if (mime.includes("image")) {
    return {
      icon: FileImage,
      iconClassName: "bg-violet-100 text-violet-700",
    }
  }

  if (mime.includes("presentation") || mime.includes("powerpoint")) {
    return {
      icon: Presentation,
      iconClassName: "bg-rose-100 text-rose-700",
    }
  }

  if (!mime || mime.includes("folder")) {
    return {
      icon: Folder,
      iconClassName: "bg-blue-100 text-blue-700",
    }
  }

  return {
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
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

export function SharedWithMeSection() {
  const { token } = useAuth()

  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [sharedWithMe, setSharedWithMe] = useState<SharedFileRecord[]>([])
  const [sharedByMe, setSharedByMe] = useState<SharedFileRecord[]>([])

  const loadSharedItems = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [withMe, byMe] = await Promise.all([
        getSharedWithMe(token),
        getSharedByMe(token),
      ])

      setSharedWithMe(withMe)
      setSharedByMe(byMe)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat data berbagi"
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadSharedItems()
  }, [loadSharedItems])

  const sharedWithMeItems = useMemo<DisplayItem[]>(() => {
    return sharedWithMe.map((share) => {
      const visual = fileVisual(share.file)

      return {
        id: share.file?.id,
        shareId: share.id,
        kind: "file",
        canRevoke: false,
        name: share.file?.name ?? "Unknown file",
        owner: share.owner?.email ?? share.owner?.username ?? "Unknown owner",
        updatedAt: formatDateTime(share.shared_at),
        size: share.file ? formatBytes(share.file.size) : "-",
        sizeBytes: share.file?.size ?? 0,
        location: "Shared with me",
        icon: visual.icon,
        iconClassName: visual.iconClassName,
      }
    })
  }, [sharedWithMe])

  const sharedByMeItems = useMemo<DisplayItem[]>(() => {
    return sharedByMe.map((share) => {
      const visual = fileVisual(share.file)

      return {
        id: share.file?.id,
        shareId: share.id,
        kind: "file",
        canRevoke: true,
        name: share.file?.name ?? "Unknown file",
        owner: share.receiver?.email ?? share.receiver?.username ?? "Unknown receiver",
        updatedAt: formatDateTime(share.shared_at),
        size: share.file ? formatBytes(share.file.size) : "-",
        sizeBytes: share.file?.size ?? 0,
        location: "Shared by me",
        icon: visual.icon,
        iconClassName: visual.iconClassName,
      }
    })
  }, [sharedByMe])

  const sharedFiles = useMemo(() => {
    if (sourceFilter === "shared") {
      return sharedWithMeItems
    }

    if (sourceFilter === "team") {
      return sharedByMeItems
    }

    return [...sharedWithMeItems, ...sharedByMeItems]
  }, [sharedByMeItems, sharedWithMeItems, sourceFilter])

  const filteredFiles = useMemo(() => {
    const filtered = [...sharedFiles]

    if (fileFilter === "smallest") {
      filtered.sort((a, b) => a.sizeBytes - b.sizeBytes)
    } else if (fileFilter === "largest") {
      filtered.sort((a, b) => b.sizeBytes - a.sizeBytes)
    } else if (fileFilter === "folder-first") {
      filtered.sort((a, b) => {
        const aIsFolder = a.kind === "folder"
        const bIsFolder = b.kind === "folder"

        if (aIsFolder === bIsFolder) return a.name.localeCompare(b.name)
        return aIsFolder ? -1 : 1
      })
    }

    return filtered
  }, [fileFilter, sharedFiles])

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

  async function handleRevoke(item: FileListItem) {
    if (!token || !item.canRevoke || !item.shareId) {
      return
    }

    const confirmed = window.confirm(`Cabut akses berbagi untuk ${item.name}?`)

    if (!confirmed) {
      return
    }

    setBusyAction("Mencabut akses...")

    try {
      await revokeShare(token, item.shareId)
      await loadSharedItems()
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Gagal mencabut akses"
      )
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 bg-background px-4 md:-mx-6 md:px-6 pb-4">
        <div className="pt-4 mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Shared With Me
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Button
            variant={sourceFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSourceFilter("all")}
          >
            Semua
          </Button>
          <Button
            variant={sourceFilter === "shared" ? "default" : "outline"}
            size="sm"
            onClick={() => setSourceFilter("shared")}
          >
            Shared With Me
          </Button>
          <Button
            variant={sourceFilter === "team" ? "default" : "outline"}
            size="sm"
            onClick={() => setSourceFilter("team")}
          >
            Shared By Me
          </Button>

          <div className="ml-auto">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
          </div>
        </div>
      </div>

      {busyAction ? <p className="pb-3 text-sm text-muted-foreground">{busyAction}</p> : null}
      {error ? <p className="pb-3 text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="pb-3 text-sm text-muted-foreground">Memuat data...</p> : null}

      {isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          showTrashActions={false}
          showStarredView={false}
          onDownload={handleDownload}
          onDelete={handleRevoke}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={`${file.shareId}-${file.id ?? file.name}`}
              name={file.name}
              meta={file.location ?? "Shared"}
              updatedAt={file.updatedAt}
              icon={file.icon}
              iconClassName={file.iconClassName}
              layout="grid"
              onOpen={() => void handleDownload(file)}
              onDelete={file.canRevoke ? () => void handleRevoke(file) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
