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
  { label: "New File", icon: FilePlus2 },
  { label: "Upload File", icon: FileUp },
  { label: "Upload Folder", icon: FolderUp },
  { label: "Google Docs", icon: FileText },
  { label: "Google Sheets", icon: FileSpreadsheet },
  { label: "Google Slides", icon: Presentation },
]

export function NewDropdownMenu() {
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

          return (
            <div key={option.label}>
              <DropdownMenuItem>
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
