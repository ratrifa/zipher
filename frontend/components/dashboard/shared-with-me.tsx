"use client"

import { useMemo, useState, useEffect } from "react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  ChevronDown,
  File as FileIcon,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function SharedWithMeSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchShared() {
      const token = localStorage.getItem("zipher_token")
      if (!token) return

      try {
        const response = await fetch("http://localhost:8000/api/v1/shared/with-me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        if (data.success) {
          const formattedItems = data.data.map((share: any) => {
            const item = share.file
            return {
              id: share.id,
              name: item.name,
              meta: `${item.mime_type} • ${formatBytes(item.size)}`,
              updatedAt: formatDate(share.shared_at),
              owner: item.owner?.username || "Unknown",
              sharedBy: item.owner?.email || "Unknown",
              size: formatBytes(item.size),
              sizeBytes: item.size || 0,
              location: "Shared",
              icon: getIcon(item.mime_type || "", false),
              iconClassName: getIconClassName(item.mime_type || "", false),
              isFolder: false,
            }
          })
          setItems(formattedItems)
        }
      } catch (error) {
        console.error("Failed to fetch shared files:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShared()
  }, [])

  const filteredFiles = useMemo(() => {
    let filtered = [...items]

    if (fileFilter === "smallest") {
      filtered.sort((a, b) => a.sizeBytes - b.sizeBytes)
    } else if (fileFilter === "largest") {
      filtered.sort((a, b) => b.sizeBytes - a.sizeBytes)
    }

    return filtered
  }, [fileFilter, items])

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 bg-background px-4 md:-mx-6 md:px-6 pb-4">
        <div className="pt-4 mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Shared With Me
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 items-center mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Jenis
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Semua</DropdownMenuItem>
              <DropdownMenuItem>Folder</DropdownMenuItem>
              <DropdownMenuItem>File</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Orang
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Semua orang</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Dimodifikasi
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Anytime</DropdownMenuItem>
              <DropdownMenuItem>Minggu ini</DropdownMenuItem>
              <DropdownMenuItem>Bulan ini</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Sumber
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Semua</DropdownMenuItem>
              <DropdownMenuItem>Dibagikan langsung</DropdownMenuItem>
              <DropdownMenuItem>Dari tim</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto">
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
          showStarredView={false}
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
            />
          ))}
        </div>
      )}
    </section>
  )
}
