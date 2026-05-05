import type { LucideIcon } from "lucide-react"
import { MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Card, CardContent } from "@/components/ui/card"

type FileCardProps = {
  id: string
  name: string
  meta: string
  updatedAt: string
  icon: LucideIcon
  iconClassName: string
  layout?: "grid" | "list"
  isFolder?: boolean
  isStarred?: boolean
  onDelete?: (id: string, isFolder: boolean) => void
  onRestore?: (id: string, isFolder: boolean) => void
  onForceDelete?: (id: string, isFolder: boolean) => void
  onToggleStar?: (id: string) => void
  onFolderClick?: () => void
  onRename?: (id: string, name: string, isFolder: boolean) => void
  onMove?: (id: string, name: string, isFolder: boolean) => void
  onOpen?: (id: string, name: string, isFolder: boolean) => void
  onDownload?: (id: string, name: string) => void
}

export function FileCard({
  id,
  name,
  meta,
  updatedAt,
  icon: Icon,
  iconClassName,
  layout = "grid",
  isFolder = false,
  isStarred = false,
  onDelete,
  onRestore,
  onForceDelete,
  onToggleStar,
  onFolderClick,
  onRename,
  onMove,
  onOpen,
  onDownload,
}: FileCardProps) {
  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          aria-label="File actions"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onOpen?.(id, name, isFolder)}>Open</DropdownMenuItem>
        {!isFolder && (
            <DropdownMenuItem onClick={() => onDownload?.(id, name)}>Download</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onRename?.(id, name, isFolder)}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove?.(id, name, isFolder)}>Move</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(id, isFolder)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Card 
      className={[
        "relative py-0 transition-all hover:shadow-md group",
        "cursor-pointer"
      ].join(" ")}
      onClick={() => onOpen?.(id, name, isFolder)}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={[
              "inline-flex size-10 items-center justify-center rounded-xl",
              iconClassName,
            ].join(" ")}
          >
            <Icon className="size-5" />
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{meta}</p>
          <p className="text-xs text-muted-foreground/80">
            Updated {updatedAt}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
