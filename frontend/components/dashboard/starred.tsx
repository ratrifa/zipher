"use client"

import { useMemo, useState, useEffect } from "react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"

function getIcon(mimeType: string, isFolder: boolean) {
  if (isFolder) return Folder
  if (mimeType?.includes("image")) return FileImage
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || mimeType?.includes("csv")) return FileSpreadsheet
  if (mimeType?.includes("pdf") || mimeType?.includes("text") || mimeType?.includes("word")) return FileText
  if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint")) return Presentation
  return FileIcon
}

function getIconClassName(mimeType: string, isFolder: boolean) {
  if (isFolder) return "bg-blue-100 text-blue-700"
  if (mimeType?.includes("image")) return "bg-violet-100 text-violet-700"
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || mimeType?.includes("csv")) return "bg-emerald-100 text-emerald-700"
  if (mimeType?.includes("pdf") || mimeType?.includes("text") || mimeType?.includes("word")) return "bg-orange-100 text-orange-700"
  if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint")) return "bg-rose-100 text-rose-700"
  return "bg-slate-100 text-slate-700"
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function StarredSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStarred() {
      const token = localStorage.getItem("zipher_token")
      if (!token) return

      try {
        const response = await fetch("http://localhost:8000/api/v1/files/starred", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        if (data.success) {
          const formattedItems = data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            meta: `${item.mime_type} • ${formatBytes(item.size)}`,
            updatedAt: formatDate(item.updated_at),
            owner: "You",
            size: formatBytes(item.size),
            sizeBytes: item.size || 0,
            location: item.folder?.name || "Root",
            icon: getIcon(item.mime_type || "", false),
            iconClassName: getIconClassName(item.mime_type || "", false),
            isFolder: false,
            isStarred: true,
          }))
          setItems(formattedItems)
        }
      } catch (error) {
        console.error("Failed to fetch starred files:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStarred()
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
      const response = await fetch(`http://localhost:8000/api/v1/${endpoint}`, {
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
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/${id}/star`, {
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

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Starred
            </h1>
            <p className="text-sm text-muted-foreground">Your starred files</p>
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
      ) : isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          showTrashActions={false}
          showStarredView={true}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
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
              layout="grid"
              isFolder={file.isFolder}
              isStarred={file.isStarred}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
            />
          ))}
        </div>
      )}
    </section>
  )
}
