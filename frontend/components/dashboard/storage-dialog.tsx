"use client"

import { API_BASE } from "@/lib/api"
import { useEffect, useState } from "react"
import {
  HardDrive,
  FileText,
  FileImage,
  Film,
  File as FileIcon,
} from "lucide-react"
import { formatBytes } from "@/lib/utils/file-utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StorageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storage: { used: number; limit: number }
}

interface Breakdown {
  images: number
  videos: number
  documents: number
  others: number
}

const CATEGORIES = [
  { key: "documents", label: "Documents", bar: "bg-blue-500", Icon: FileText },
  { key: "images", label: "Photos", bar: "bg-violet-500", Icon: FileImage },
  { key: "videos", label: "Videos", bar: "bg-pink-500", Icon: Film },
  { key: "others", label: "Others", bar: "bg-amber-500", Icon: FileIcon },
] as const

export function StorageDialog({
  open,
  onOpenChange,
  storage,
}: StorageDialogProps) {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    const token = localStorage.getItem("zipher_token")
    fetch(`${API_BASE}/api/v1/storage/breakdown`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBreakdown(data.data.breakdown)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [open])

  const { used, limit } = storage
  const available = Math.max(0, limit - used)
  const usedPct = limit > 0 ? (used / limit) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="size-4 text-primary" />
            Storage Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="rounded-xl border bg-muted/40 px-5 py-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Storage Used
                </p>
                <p className="mt-0.5 text-xl font-medium tracking-tight">
                  {formatBytes(used)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="mt-0.5 text-xl font-medium tracking-tight">
                  {formatBytes(available)}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {usedPct.toFixed(2)}% of {formatBytes(limit)} used
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Storage Breakdown</h3>

            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}

            {!isLoading && breakdown && (
              <div className="space-y-4">
                {CATEGORIES.map(({ key, label, bar, Icon }) => {
                  const size = breakdown[key as keyof Breakdown]
                  const pctOfLimit = limit > 0 ? (size / limit) * 100 : 0
                  const pctOfUsed = used > 0 ? (size / used) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-muted p-1.5">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-none font-medium">
                            {label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {pctOfLimit.toFixed(1)}% of total storage
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatBytes(size)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className={`${bar} h-full rounded-full transition-all`}
                          style={{ width: `${Math.min(pctOfUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
