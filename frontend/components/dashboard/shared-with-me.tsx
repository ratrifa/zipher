"use client"

import { useMemo, useState } from "react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  ChevronDown,
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

const baseSharedFiles = [
  {
    name: "CV_Naufal Raff Hidayat.pdf",
    meta: "PDF • 1.2 MB",
    updatedAt: "9 Apr",
    owner: "naufalraff21@gmail.com",
    sharedBy: "naufalraff21@gmail.com",
    size: "1.2 MB",
    location: "Shared",
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
  },
  {
    name: "Salinan dari Template - Formulir Pendaftaran Pitching.docx",
    meta: "Word Document • 856 KB",
    updatedAt: "7 Apr",
    owner: "zizajsa@gmail.com",
    sharedBy: "zizajsa@gmail.com",
    size: "856 KB",
    location: "Shared",
    icon: FileText,
    iconClassName: "bg-blue-100 text-blue-700",
  },
  {
    name: "Elevate_Result",
    meta: "Folder • 12 items",
    updatedAt: "6 Apr",
    owner: "partnershiptelu@gmail.c...",
    sharedBy: "partnershiptelu@gmail.c...",
    size: "2.4 GB",
    location: "Shared",
    icon: Folder,
    iconClassName: "bg-blue-100 text-blue-700",
  },
  {
    name: "SEPATU",
    meta: "Folder • 8 items",
    updatedAt: "6 Apr",
    owner: "hayurashop@gmail.com",
    sharedBy: "hayurashop@gmail.com",
    size: "1.8 GB",
    location: "Shared",
    icon: Folder,
    iconClassName: "bg-purple-100 text-purple-700",
  },
  {
    name: "Template Proposal new.zip",
    meta: "ZIP Archive • 3.2 MB",
    updatedAt: "6 Apr",
    owner: "mandalasatria@gmail.com",
    sharedBy: "mandalasatria@gmail.com",
    size: "3.2 MB",
    location: "Shared",
    icon: FileText,
    iconClassName: "bg-gray-100 text-gray-700",
  },
  {
    name: "Financial Report Q1 2026",
    meta: "Google Sheets • 2.1 MB",
    updatedAt: "5 Apr",
    owner: "finance@company.com",
    sharedBy: "finance@company.com",
    size: "2.1 MB",
    location: "Shared",
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
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
const owners = ["user1@gmail.com", "user2@gmail.com", "user3@gmail.com", "user4@gmail.com", "user5@gmail.com"]
const sizes = ["840 KB", "2.4 MB", "5.8 MB", "78 MB", "1.1 GB"]

const generatedSharedFiles = Array.from({ length: 9 }, (_, index) => {
  const variant = index % 5
  const fileNumber = index + 7
  const daysAgo = (index % 7) + 1

  return {
    name: `Shared File ${fileNumber}`,
    meta: extraFileMeta[variant],
    updatedAt: `${daysAgo} Apr`,
    owner: owners[index % owners.length],
    sharedBy: owners[index % owners.length],
    size: sizes[index % sizes.length],
    location: "Shared",
    icon: extraFileIcons[variant],
    iconClassName: extraFileStyles[variant],
  }
})

const sharedFiles = [...baseSharedFiles, ...generatedSharedFiles]

function parseSizeToBytes(size: string) {
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)

  if (!match) return 0

  const value = Number(match[1])
  const unit = match[2].toUpperCase()

  if (unit === "KB") return value * 1024
  if (unit === "MB") return value * 1024 * 1024
  return value * 1024 * 1024 * 1024
}

export function SharedWithMeSection() {
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [personFilter, setPersonFilter] = useState<string>("all")
  const [modifiedFilter, setModifiedFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  const filteredFiles = useMemo(() => {
    let filtered = [...sharedFiles]

    if (fileFilter === "smallest") {
      filtered.sort((a, b) => parseSizeToBytes(a.size) - parseSizeToBytes(b.size))
    } else if (fileFilter === "largest") {
      filtered.sort((a, b) => parseSizeToBytes(b.size) - parseSizeToBytes(a.size))
    } else if (fileFilter === "folder-first") {
      filtered.sort((a, b) => {
        const aIsFolder = a.meta.startsWith("Folder")
        const bIsFolder = b.meta.startsWith("Folder")

        if (aIsFolder === bIsFolder) return a.name.localeCompare(b.name)
        return aIsFolder ? -1 : 1
      })
    }

    return filtered
  }, [fileFilter])

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
              <DropdownMenuItem onSelect={() => setTypeFilter("all")}>
                Semua
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTypeFilter("folder")}>
                Folder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTypeFilter("file")}>
                File
              </DropdownMenuItem>
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
              <DropdownMenuItem onSelect={() => setPersonFilter("all")}>
                Semua orang
              </DropdownMenuItem>
              {owners.map((owner) => (
                <DropdownMenuItem
                  key={owner}
                  onSelect={() => setPersonFilter(owner)}
                >
                  {owner}
                </DropdownMenuItem>
              ))}
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
              <DropdownMenuItem onSelect={() => setModifiedFilter("all")}>
                Anytime
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModifiedFilter("week")}>
                Minggu ini
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModifiedFilter("month")}>
                Bulan ini
              </DropdownMenuItem>
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
              <DropdownMenuItem onSelect={() => setSourceFilter("all")}>
                Semua
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSourceFilter("shared")}>
                Dibagikan langsung
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSourceFilter("team")}>
                Dari tim
              </DropdownMenuItem>
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

      {isListView ? (
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
