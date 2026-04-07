import type { LucideIcon } from "lucide-react"
import {
  Download,
  MoreVertical,
  Pencil,
  SlidersHorizontal,
  Star,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FileListItem = {
  name: string
  owner: string
  updatedAt: string
  size: string
  icon: LucideIcon
  iconClassName: string
}

export type FileFilterOption = "none" | "smallest" | "largest" | "folder-first"

type FilesListTableProps = {
  files: FileListItem[]
  activeFilter: FileFilterOption
  onFilterChange: (value: FileFilterOption) => void
}

export function FilesListTable({
  files,
  activeFilter,
  onFilterChange,
}: FilesListTableProps) {
  const tableColumns = (
    <colgroup>
      <col style={{ width: "34%" }} />
      <col style={{ width: "17%" }} />
      <col style={{ width: "23%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "14%" }} />
    </colgroup>
  )

  return (
    <div className="rounded-xl">
      <div className="sticky top-20 z-20 border-b border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-195 table-fixed text-sm">
            {tableColumns}
            <thead className="text-head text-left tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Pemilik</th>
                <th className="px-4 py-3 font-medium">
                  Tanggal Terakhir Diubah
                </th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">
                  Size
                </th>
                <th className="px-1 py-3 text-right font-medium whitespace-nowrap">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-head h-7 rounded-md px-2 font-medium"
                        >
                          <SlidersHorizontal className="size-3.5" />
                          Filter by
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() =>
                            onFilterChange(
                              activeFilter === "smallest" ? "none" : "smallest"
                            )
                          }
                        >
                          Terkecil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            onFilterChange(
                              activeFilter === "largest" ? "none" : "largest"
                            )
                          }
                        >
                          Terbesar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            onFilterChange(
                              activeFilter === "folder-first"
                                ? "none"
                                : "folder-first"
                            )
                          }
                        >
                          Folder Dulu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-195 table-fixed text-sm">
          {tableColumns}
          <tbody className="divide-y divide-border">
            {files.map((file) => {
              const Icon = file.icon

              return (
                <tr key={file.name} className="group hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                          file.iconClassName,
                        ].join(" ")}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {file.owner}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {file.updatedAt}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">
                    {file.size}
                  </td>
                  <td className="px-1 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none size-8 rounded-full opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                        aria-label="Share file"
                      >
                        <UserPlus className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none size-8 rounded-full opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                        aria-label="Download file"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none size-8 rounded-full opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                        aria-label="Edit file"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none size-8 rounded-full opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                        aria-label="Star file"
                      >
                        <Star className="size-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label="More actions"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem>Open</DropdownMenuItem>
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Move</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
