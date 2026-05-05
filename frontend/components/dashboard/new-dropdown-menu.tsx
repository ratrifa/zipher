"use client"

import {
  ChevronDown,
  FilePlus2,
  FileUp,
  FolderUp,
  FileText,
  FileSpreadsheet,
  Presentation,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const createOptions = [
  { label: "New File", icon: FilePlus2, action: "new-file" },
  { label: "Upload File", icon: FileUp, action: "upload-file" },
  { label: "Upload Folder", icon: FolderUp, action: "upload-folder" },
  { label: "Google Docs", icon: FileText, action: "google-docs" },
  { label: "Google Sheets", icon: FileSpreadsheet, action: "google-sheets" },
  { label: "Google Slides", icon: Presentation, action: "google-slides" },
]

type NewDropdownMenuProps = {
  onCreateFolder?: () => void
  onUploadFile?: () => void
}

export function NewDropdownMenu({ onCreateFolder, onUploadFile }: NewDropdownMenuProps) {
  function handleAction(action: string) {
    if (action === "new-file") {
      onCreateFolder?.()
      return
    }

    if (action === "upload-file") {
      onUploadFile?.()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 gap-1.5 px-3 text-sm">
          New
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {createOptions.map((option, index) => {
          const Icon = option.icon
          const addSeparator = index === 2
          const isEnabled = option.action === "new-file" || option.action === "upload-file"

          return (
            <div key={option.label}>
              <DropdownMenuItem
                disabled={!isEnabled}
                onSelect={(event) => {
                  event.preventDefault()
                  handleAction(option.action)
                }}
              >
                <Icon className="size-4" />
                {option.label}
              </DropdownMenuItem>
              {addSeparator ? <DropdownMenuSeparator /> : null}
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
