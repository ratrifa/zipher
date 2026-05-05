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
  name: string
  meta: string
  updatedAt: string
  icon: LucideIcon
  iconClassName: string
  layout?: "grid" | "list"
  onOpen?: () => void
  onRename?: () => void
  onMove?: () => void
  onDelete?: () => void
}

export function FileCard({
  name,
  meta,
  updatedAt,
  icon: Icon,
  iconClassName,
  layout = "grid",
  onOpen,
  onRename,
  onMove,
  onDelete,
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
        <DropdownMenuItem onSelect={onOpen} disabled={!onOpen}>
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename} disabled={!onRename}>
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMove} disabled={!onMove}>
          Move
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete} disabled={!onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (layout === "list") {
    return (
      <Card className="py-0 transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-3">
          <div
            className={[
              "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
              iconClassName,
            ].join(" ")}
          >
            <Icon className="size-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-1 text-sm font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground">{meta}</p>
            <p className="text-xs text-muted-foreground/80">
              Updated {updatedAt}
            </p>
          </div>

          {actions}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0 transition-shadow hover:shadow-md">
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

          {actions}
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
