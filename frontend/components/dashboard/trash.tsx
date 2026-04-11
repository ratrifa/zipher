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

const baseDeletedFiles = [
  {
    name: "LEMBAR PENGESAHAN ORISINALITAS KARYA WEB.pdf",
    meta: "PDF • 1.8 MB",
    updatedAt: "26 Mar",
    owner: "saya",
    size: "1.8 MB",
    location: "Web Design - hara h...",
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
  },
  {
    name: "Lembar Pengesahani.pdf",
    meta: "PDF • 84 KB",
    updatedAt: "26 Mar",
    owner: "saya",
    size: "84 KB",
    location: "Web Design - hara h...",
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
  },
  {
    name: "Old Marketing Plan",
    meta: "Google Docs • 2.1 MB",
    updatedAt: "25 Mar",
    owner: "Design Team",
    size: "2.1 MB",
    location: "Marketing Assets",
    icon: FileText,
    iconClassName: "bg-blue-100 text-blue-700",
  },
  {
    name: "Presentation Draft v1",
    meta: "Presentation • 12 MB",
    updatedAt: "24 Mar",
    owner: "You",
    size: "12 MB",
    location: "Projects",
    icon: Presentation,
    iconClassName: "bg-rose-100 text-rose-700",
  },
  {
    name: "Budget Spreadsheet 2025",
    meta: "Google Sheets • 856 KB",
    updatedAt: "23 Mar",
    owner: "Finance",
    size: "856 KB",
    location: "Financial Reports",
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Old Design Reference",
    meta: "Image • 7.2 MB",
    updatedAt: "22 Mar",
    owner: "You",
    size: "7.2 MB",
    location: "Design Assets",
    icon: FileImage,
    iconClassName: "bg-violet-100 text-violet-700",
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

const generatedDeletedFiles = Array.from({ length: 14 }, (_, index) => {
  const variant = index % 5
  const fileNumber = index + 7
  const daysAgo = (index % 10) + 1

  return {
    name: `Deleted File ${fileNumber}`,
    meta: extraFileMeta[variant],
    updatedAt: `${daysAgo} days ago`,
    owner: owners[index % owners.length],
    size: sizes[index % sizes.length],
    location: ["Projects", "Marketing Assets", "Design Files", "Documents"][index % 4],
    icon: extraFileIcons[variant],
    iconClassName: extraFileStyles[variant],
  }
})

const deletedFiles = [...baseDeletedFiles, ...generatedDeletedFiles]

function parseSizeToBytes(size: string) {
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)

  if (!match) return 0

  const value = Number(match[1])
  const unit = match[2].toUpperCase()

  if (unit === "KB") return value * 1024
  if (unit === "MB") return value * 1024 * 1024
  return value * 1024 * 1024 * 1024
}

export function TrashSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")

  const filteredFiles = useMemo(() => {
    const next = [...deletedFiles]

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

    return deletedFiles
  }, [fileFilter])

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Trash
            </h1>
            <p className="text-sm text-muted-foreground">Deleted files and documents</p>
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
          showTrashActions={true}
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
