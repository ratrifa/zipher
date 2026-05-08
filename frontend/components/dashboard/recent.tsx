"use client"

import { API_BASE } from "@/lib/api"
import { useMemo, useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Download,
  Eye,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  PencilLine,
  Presentation,
  Share2,
  Trash,
  Trash2,
  Upload,
} from "lucide-react"

import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type RecentAction =
  | "opened"
  | "downloaded"
  | "uploaded"
  | "created"
  | "renamed"
  | "moved"
  | "shared"
  | "trashed"
  | "deleted"

type RecentFilter = "all" | RecentAction

type RecentPeriod =
  | "Hari ini"
  | "Minggu ini"
  | "Awal bulan ini"
  | "Bulan lalu"
  | "Awal tahun ini"
  | "Tahun lalu"

type RecentKind =
  | "folder"
  | "pdf"
  | "sheet"
  | "doc"
  | "image"
  | "presentation"
  | "code"

type RecentItem = {
  id: string
  name: string
  detail: string
  location: string
  accessedAt: string
  action: RecentAction
  period: RecentPeriod
  kind: RecentKind
}

type ApiActivity = {
  id: string
  file_name: string
  mime_type: string | null
  is_folder: boolean
  action: string
  created_at: string
  location?: string
}

const periodOrder: RecentPeriod[] = [
  "Hari ini",
  "Minggu ini",
  "Awal bulan ini",
  "Bulan lalu",
  "Awal tahun ini",
  "Tahun lalu",
]

const filterOptions: Array<{ label: string; value: RecentFilter }> = [
  { label: "Semua", value: "all" },
  { label: "Dibuka", value: "opened" },
  { label: "Diunduh", value: "downloaded" },
  { label: "Diunggah", value: "uploaded" },
  { label: "Dibuat", value: "created" },
  { label: "Direname", value: "renamed" },
  { label: "Dipindah", value: "moved" },
  { label: "Dibagi", value: "shared" },
  { label: "Dihapus", value: "trashed" },
  { label: "Dihapus Permanen", value: "deleted" },
]

const kindConfig: Record<
  RecentKind,
  { icon: LucideIcon; iconClassName: string }
> = {
  folder: { icon: Folder, iconClassName: "bg-blue-100 text-blue-700" },
  pdf: { icon: FileText, iconClassName: "bg-orange-100 text-orange-700" },
  sheet: {
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  doc: { icon: FileText, iconClassName: "bg-sky-100 text-sky-700" },
  image: { icon: FileImage, iconClassName: "bg-violet-100 text-violet-700" },
  presentation: {
    icon: Presentation,
    iconClassName: "bg-rose-100 text-rose-700",
  },
  code: { icon: FileCode2, iconClassName: "bg-slate-100 text-slate-700" },
}

const actionConfig: Record<
  RecentAction,
  { label: string; icon: LucideIcon; className: string }
> = {
  opened: {
    label: "Dibuka",
    icon: Eye,
    className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  downloaded: {
    label: "Diunduh",
    icon: Download,
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  uploaded: {
    label: "Diunggah",
    icon: Upload,
    className: "bg-green-50 text-green-700 ring-green-200",
  },
  created: {
    label: "Dibuat",
    icon: FolderPlus,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  renamed: {
    label: "Direname",
    icon: PencilLine,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  moved: {
    label: "Dipindah",
    icon: FolderPlus,
    className: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  shared: {
    label: "Dibagi",
    icon: Share2,
    className: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  trashed: {
    label: "Dihapus",
    icon: Trash2,
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  deleted: {
    label: "Dihapus Permanen",
    icon: Trash,
    className: "bg-red-100 text-red-800 ring-red-300",
  },
}

function mapAction(apiAction: string): RecentAction {
  if (apiAction in actionConfig) return apiAction as RecentAction
  return "opened"
}

function mapKind(
  mimeType: string | null,
  isFolder: boolean,
  fileName: string
): RecentKind {
  if (isFolder) return "folder"
  if (!mimeType) return "doc"
  const lower = fileName.toLowerCase()
  const isCode =
    lower.endsWith(".md") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".js") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".py") ||
    lower.endsWith(".json") ||
    lower.endsWith(".html") ||
    lower.endsWith(".css") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("markdown")
  if (isCode) return "code"
  if (mimeType.includes("image")) return "image"
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "sheet"
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "presentation"
  if (mimeType.includes("pdf")) return "pdf"
  return "doc"
}

function mapPeriod(createdAt: string): RecentPeriod {
  const now = new Date()
  const date = new Date(createdAt)
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return "Hari ini"
  if (diffDays <= 7) return "Minggu ini"

  const nowMonth = now.getMonth()
  const nowYear = now.getFullYear()
  const dateMonth = date.getMonth()
  const dateYear = date.getFullYear()

  if (dateYear === nowYear && dateMonth === nowMonth) return "Awal bulan ini"
  if (dateYear === nowYear && dateMonth === nowMonth - 1) return "Bulan lalu"
  if (dateYear === nowYear) return "Awal tahun ini"
  return "Tahun lalu"
}

function formatAccessedAt(createdAt: string): string {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Baru saja"
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24)
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  if (diffDays === 1) return "Kemarin"
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function mapDetail(mimeType: string | null, isFolder: boolean): string {
  if (isFolder) return "Folder"
  if (!mimeType) return "File"
  if (mimeType.includes("image")) return "Gambar"
  if (mimeType.includes("pdf")) return "PDF"
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet"
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "Presentasi"
  if (mimeType.includes("word") || mimeType.includes("wordprocessingml"))
    return "Dokumen"
  if (mimeType.includes("text/plain")) return "Teks"
  if (mimeType.includes("json")) return "JSON"
  if (mimeType.includes("javascript")) return "JavaScript"
  return "File"
}

function mapActivity(a: ApiActivity): RecentItem {
  return {
    id: a.id,
    name: a.file_name,
    detail: mapDetail(a.mime_type, a.is_folder),
    location: a.location ?? "My Files",
    accessedAt: formatAccessedAt(a.created_at),
    action: mapAction(a.action),
    period: mapPeriod(a.created_at),
    kind: mapKind(a.mime_type, a.is_folder, a.file_name),
  }
}

function RecentActionBadge({ action }: { action: RecentAction }) {
  const config = actionConfig[action]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        config.className
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  )
}

function RecentListRow({ item }: { item: RecentItem }) {
  const config = kindConfig[item.kind]
  const Icon = config.icon

  return (
    <article className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_150px_160px_90px] sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
            config.iconClassName
          )}
        >
          <Icon className="size-5" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.detail}
          </p>
          <p className="truncate text-xs text-muted-foreground sm:hidden">
            {item.accessedAt}
          </p>
        </div>
      </div>

      <div>
        <RecentActionBadge action={item.action} />
      </div>

      <p className="hidden truncate text-sm text-muted-foreground sm:block">
        {item.location}
      </p>

      <p className="sm hidden text-sm text-muted-foreground sm:block">
        {item.accessedAt}
      </p>
    </article>
  )
}

function RecentGridCard({ item }: { item: RecentItem }) {
  const config = kindConfig[item.kind]
  const Icon = config.icon

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl",
            config.iconClassName
          )}
        >
          <Icon className="size-5" />
        </div>
        <RecentActionBadge action={item.action} />
      </div>

      <p className="truncate text-sm font-medium">{item.name}</p>
      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>{item.accessedAt}</p>
      </div>
    </article>
  )
}

export function RecentSection() {
  const [isListView, setIsListView] = useState(true)
  const [activeFilter, setActiveFilter] = useState<RecentFilter>("all")
  const [items, setItems] = useState<RecentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRecent() {
      const cached = localStorage.getItem("zipher_cache_recent")
      if (cached) {
        try {
          setItems((JSON.parse(cached) as ApiActivity[]).map(mapActivity))
          setIsLoading(false)
        } catch {}
      } else {
        setIsLoading(true)
      }

      const token = localStorage.getItem("zipher_token")
      if (!token) return

      try {
        const response = await fetch(`${API_BASE}/api/v1/recent`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        if (data.success) {
          setItems((data.data as ApiActivity[]).map(mapActivity))
          localStorage.setItem("zipher_cache_recent", JSON.stringify(data.data))
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecent()
    window.addEventListener("contents-updated", fetchRecent)
    return () => window.removeEventListener("contents-updated", fetchRecent)
  }, [])

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items
    return items.filter((item) => item.action === activeFilter)
  }, [activeFilter, items])

  const groupedItems = useMemo(
    () =>
      periodOrder.map((period) => ({
        period,
        items: filteredItems.filter((item) => item.period === period),
      })),
    [filteredItems]
  )

  const hasItems = groupedItems.some((group) => group.items.length > 0)

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 bg-background px-4 pb-4 md:-mx-6 md:px-6">
        <div className="grid min-h-20 grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
            <p className="text-sm text-muted-foreground">
              Log aktivitas terbaru file dan folder.
            </p>
          </div>

          <FileLayoutSwitch
            isList={isListView}
            onCheckedChange={setIsListView}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeFilter === option.value ? "secondary" : "outline"}
              size="sm"
              className="rounded-full px-4"
              aria-pressed={activeFilter === option.value}
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : !hasItems ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Belum ada aktivitas recent untuk filter ini.
        </div>
      ) : (
        <div className="space-y-6 pb-6">
          {groupedItems.map((group) => {
            if (!group.items.length) return null

            return (
              <div key={group.period} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {group.period}
                  </h2>
                  <Separator />
                </div>

                {isListView ? (
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="hidden grid-cols-[minmax(0,2fr)_150px_160px_90px] items-center gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground uppercase sm:grid">
                      <span>Nama</span>
                      <span>Aktivitas</span>
                      <span>Lokasi</span>
                      <span>Waktu</span>
                    </div>

                    {group.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={cn(index > 0 && "border-t")}
                      >
                        <RecentListRow item={item} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <RecentGridCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
