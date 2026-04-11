"use client"

import { useMemo, useState } from "react"
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
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"

const baseStarredFiles = [
  {
    name: "tcp.pdf",
    meta: "PDF • 897 KB",
    updatedAt: "20 Mar",
    owner: "Tidak dapat memuat pengguna",
    size: "897 KB",
    location: "Dibagikan kepada sa...",
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
    isStarred: true,
  },
  {
    name: "Project Proposal 2026",
    meta: "Google Docs • 2.3 MB",
    updatedAt: "18 Mar",
    owner: "You",
    size: "2.3 MB",
    location: "Projects",
    icon: FileText,
    iconClassName: "bg-blue-100 text-blue-700",
    isStarred: true,
  },
  {
    name: "Budget Forecast",
    meta: "Google Sheets • 1.5 MB",
    updatedAt: "15 Mar",
    owner: "Finance",
    size: "1.5 MB",
    location: "Financial",
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
    isStarred: true,
  },
  {
    name: "Design System v2",
    meta: "Folder • 45 items",
    updatedAt: "12 Mar",
    owner: "Design Team",
    size: "3.2 GB",
    location: "Design Assets",
    icon: Folder,
    iconClassName: "bg-blue-100 text-blue-700",
    isStarred: true,
  },
  {
    name: "Q1 Presentation",
    meta: "Presentation • 8 slides",
    updatedAt: "10 Mar",
    owner: "You",
    size: "24 MB",
    location: "Presentations",
    icon: Presentation,
    iconClassName: "bg-rose-100 text-rose-700",
    isStarred: true,
  },
  {
    name: "Logo Variations",
    meta: "Image • 5.8 MB",
    updatedAt: "8 Mar",
    owner: "Design Team",
    size: "5.8 MB",
    location: "Brand Assets",
    icon: FileImage,
    iconClassName: "bg-violet-100 text-violet-700",
    isStarred: true,
  },
]

const extraFileIcons = [
  Folder,
  FileSpreadsheet,
  FileText,
  FileImage,
  Presentation,
]
const extraFileStyles = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
]
const extraFileMeta = [
  "Folder • 12 items",
  "Google Sheets • 860 KB",
  "PDF • 2.4 MB",
  "Image • 4.2 MB",
  "Presentation • 6 slides",
]
const owners = ["You", "saya", "Design Team", "Finance", "Marketing"]
const sizes = ["840 KB", "2.4 MB", "5.8 MB", "78 MB", "1.1 GB"]

const generatedStarredFiles = Array.from({ length: 9 }, (_, index) => {
  const variant = index % 5
  const fileNumber = index + 7
  const daysAgo = (index % 10) + 1

  return {
    name: `Starred File ${fileNumber}`,
    meta: extraFileMeta[variant],
    updatedAt: `${daysAgo} days ago`,
    owner: owners[index % owners.length],
    size: sizes[index % sizes.length],
    location: ["Projects", "Marketing Assets", "Design Files", "Documents"][index % 4],
    icon: extraFileIcons[variant],
    iconClassName: extraFileStyles[variant],
    isStarred: true,
  }
})

const starredFiles = [...baseStarredFiles, ...generatedStarredFiles]

function parseSizeToBytes(size: string) {
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)

  if (!match) return 0

  const value = Number(match[1])
  const unit = match[2].toUpperCase()

  if (unit === "KB") return value * 1024
  if (unit === "MB") return value * 1024 * 1024
  return value * 1024 * 1024 * 1024
}

export function StarredSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")

  const filteredFiles = useMemo(() => {
    const next = [...starredFiles]

    if (fileFilter === "smallest") {
      next.sort((a, b) => parseSizeToBytes(a.size) - parseSizeToBytes(b.size))
      return next
    }

    if (fileFilter === "largest") {
      next.sort((a, b) => parseSizeToBytes(b.size) - parseSizeToBytes(a.size))
      return next
    }

    if (fileFilter === "folder-first") {
      next.sort((a, b) => {
        const aIsFolder = a.meta.startsWith("Folder")
        const bIsFolder = b.meta.startsWith("Folder")

        if (aIsFolder === bIsFolder) return a.name.localeCompare(b.name)
        return aIsFolder ? -1 : 1
      })
      return next
    }

    return starredFiles
  }, [fileFilter])

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

      {isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          showTrashActions={false}
          showStarredView={true}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.name}
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
