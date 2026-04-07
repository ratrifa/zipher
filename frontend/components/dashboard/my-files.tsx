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
import { NewDropdownMenu } from "@/components/dashboard/new-dropdown-menu"

const baseFiles = [
  {
    name: "Marketing Assets",
    meta: "Folder • 24 items",
    updatedAt: "2 hours ago",
    owner: "You",
    size: "1.3 GB",
    icon: Folder,
    iconClassName: "bg-blue-100 text-blue-700",
  },
  {
    name: "Product Roadmap Q2",
    meta: "Google Sheets • 1.2 MB",
    updatedAt: "Yesterday",
    owner: "You",
    size: "1.2 MB",
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Brand Guidelines",
    meta: "PDF • 3.7 MB",
    updatedAt: "2 days ago",
    owner: "Design Team",
    size: "3.7 MB",
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
  },
  {
    name: "App UI Concept",
    meta: "Image • 5.1 MB",
    updatedAt: "4 days ago",
    owner: "Nadia",
    size: "5.1 MB",
    icon: FileImage,
    iconClassName: "bg-violet-100 text-violet-700",
  },
  {
    name: "Pitch Deck 2026",
    meta: "Presentation • 8 slides",
    updatedAt: "1 week ago",
    owner: "Product Team",
    size: "18 MB",
    icon: Presentation,
    iconClassName: "bg-rose-100 text-rose-700",
  },
  {
    name: "Client Assets",
    meta: "Folder • 9 items",
    updatedAt: "1 week ago",
    owner: "You",
    size: "840 MB",
    icon: Folder,
    iconClassName: "bg-sky-100 text-sky-700",
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
const owners = ["You", "Arga", "Design Team", "Finance", "Marketing"]
const sizes = ["840 KB", "2.4 MB", "5.8 MB", "78 MB", "1.1 GB"]

const generatedFiles = Array.from({ length: 44 }, (_, index) => {
  const variant = index % 5
  const fileNumber = index + 7

  return {
    name: `Project File ${fileNumber}`,
    meta: extraFileMeta[variant],
    updatedAt: `${(index % 9) + 1} days ago`,
    owner: owners[index % owners.length],
    size: sizes[index % sizes.length],
    icon: extraFileIcons[variant],
    iconClassName: extraFileStyles[variant],
  }
})

const files = [...baseFiles, ...generatedFiles]

function parseSizeToBytes(size: string) {
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)

  if (!match) return 0

  const value = Number(match[1])
  const unit = match[2].toUpperCase()

  if (unit === "KB") return value * 1024
  if (unit === "MB") return value * 1024 * 1024
  return value * 1024 * 1024 * 1024
}

export function MyFilesSection() {
  const [isListView, setIsListView] = useState(false)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")

  const filteredFiles = useMemo(() => {
    const next = [...files]

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

    return files
  }, [fileFilter])

  return (
    <section >
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, User!
            </h1>
            <p className="text-sm text-blue-400">My Files</p>
          </div>

          <div className="flex items-center gap-2">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
            <NewDropdownMenu />
          </div>
        </div>
      </div>

      {isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
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
