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
  tags?: string[]
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
  onShare?: (id: string, name: string) => void
  onReport?: (id: string) => void
  isReported?: boolean
  moveLabel?: string
}

export function FileCard({
  id,
  name,
  meta,
  updatedAt,
  icon: Icon,
  iconClassName,
  tags,
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
  onShare,
  onReport,
  isReported = false,
  moveLabel = "Pindah",
}: FileCardProps) {
  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          aria-label="Aksi file"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onOpen?.(id, name, isFolder)}>
          Buka
        </DropdownMenuItem>
        {onRename && (
          <DropdownMenuItem onClick={() => onRename?.(id, name, isFolder)}>
            Ganti Nama
          </DropdownMenuItem>
        )}
        {!isFolder && onDownload && (
          <DropdownMenuItem onClick={() => onDownload?.(id, name)}>
            Unduh
          </DropdownMenuItem>
        )}
        {onShare && !isFolder && (
          <DropdownMenuItem onClick={() => onShare?.(id, name)}>
            Bagikan
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem onClick={() => onMove?.(id, name, isFolder)}>
            {moveLabel}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete?.(id, isFolder)}
          >
            Hapus
          </DropdownMenuItem>
        )}
        {onReport && (
          <DropdownMenuItem
            variant="destructive"
            disabled={isReported}
            onClick={() => { if (!isReported) onReport?.(id) }}
          >
            {isReported ? "Sudah Dilaporkan" : "Lapor"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Card
      className={[
        "group relative py-0 transition-all hover:shadow-md",
        "cursor-pointer",
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

          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-semibold">{name}</h3>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{meta}</p>
          <p className="text-xs text-muted-foreground/80">
            Diperbarui {updatedAt}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
