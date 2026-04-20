"use client"

import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Eye,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  PencilLine,
  Plus,
  Presentation,
} from "lucide-react"

import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type RecentAction = "open" | "edit" | "create"
type RecentFilter = "all" | RecentAction
type RecentPeriod =
  | "Hari ini"
  | "Minggu ini"
  | "Awal bulan ini"
  | "Bulan lalu"
  | "Awal tahun ini"
  | "Tahun lalu"
type RecentKind = "folder" | "pdf" | "sheet" | "doc" | "image" | "presentation" | "code"

type RecentItem = {
  name: string
  detail: string
  location: string
  accessedAt: string
  action: RecentAction
  period: RecentPeriod
  kind: RecentKind
}

const periodOrder: RecentPeriod[] = [
  "Hari ini",
  "Minggu ini",
  "Awal bulan ini",
  "Bulan lalu",
  "Awal tahun ini",
  "Tahun lalu",
]

const recentItems: RecentItem[] = [
  {
    name: "Sprint Planning - Q2",
    detail: "Google Sheets - 512 KB",
    location: "Product Team",
    accessedAt: "10:42",
    action: "edit",
    period: "Hari ini",
    kind: "sheet",
  },
  {
    name: "Dokumen Kontrak - PT Andalan",
    detail: "PDF - 1.4 MB",
    location: "Legal",
    accessedAt: "09:18",
    action: "open",
    period: "Hari ini",
    kind: "pdf",
  },
  {
    name: "Brand Assets 2026",
    detail: "Folder - 48 item",
    location: "Marketing",
    accessedAt: "08:51",
    action: "open",
    period: "Hari ini",
    kind: "folder",
  },
  {
    name: "catatan-meeting.md",
    detail: "Markdown - 24 KB",
    location: "My Files",
    accessedAt: "08:05",
    action: "create",
    period: "Hari ini",
    kind: "code",
  },
  {
    name: "Client Follow Up",
    detail: "Google Docs - 236 KB",
    location: "Shared with Me",
    accessedAt: "Kemarin",
    action: "edit",
    period: "Minggu ini",
    kind: "doc",
  },
  {
    name: "Pitch Deck Final",
    detail: "Presentation - 14 slide",
    location: "Sales",
    accessedAt: "4 hari lalu",
    action: "open",
    period: "Minggu ini",
    kind: "presentation",
  },
  {
    name: "User Interview Photos",
    detail: "Folder - 126 item",
    location: "Research",
    accessedAt: "5 hari lalu",
    action: "create",
    period: "Minggu ini",
    kind: "folder",
  },
  {
    name: "Onboarding Flow v2",
    detail: "Figma Export - PNG - 7.2 MB",
    location: "Design",
    accessedAt: "6 hari lalu",
    action: "open",
    period: "Minggu ini",
    kind: "image",
  },
  {
    name: "Rekap Biaya Operasional",
    detail: "Google Sheets - 1.1 MB",
    location: "Finance",
    accessedAt: "7 Apr",
    action: "edit",
    period: "Awal bulan ini",
    kind: "sheet",
  },
  {
    name: "MoM Townhall April",
    detail: "Google Docs - 192 KB",
    location: "HR",
    accessedAt: "5 Apr",
    action: "create",
    period: "Awal bulan ini",
    kind: "doc",
  },
  {
    name: "Quarterly Report",
    detail: "PDF - 3.8 MB",
    location: "Management",
    accessedAt: "2 Apr",
    action: "open",
    period: "Awal bulan ini",
    kind: "pdf",
  },
  {
    name: "Arsip Campaign Maret",
    detail: "Folder - 94 item",
    location: "Marketing",
    accessedAt: "31 Mar",
    action: "open",
    period: "Bulan lalu",
    kind: "folder",
  },
  {
    name: "invoice-template.tsx",
    detail: "TypeScript - 18 KB",
    location: "Dev Shared",
    accessedAt: "18 Mar",
    action: "edit",
    period: "Bulan lalu",
    kind: "code",
  },
  {
    name: "Performance Snapshot",
    detail: "Google Sheets - 640 KB",
    location: "Ops",
    accessedAt: "9 Mar",
    action: "open",
    period: "Bulan lalu",
    kind: "sheet",
  },
  {
    name: "Roadmap 2026",
    detail: "Presentation - 22 slide",
    location: "Product Team",
    accessedAt: "16 Feb",
    action: "edit",
    period: "Awal tahun ini",
    kind: "presentation",
  },
  {
    name: "Boilerplate Proposal",
    detail: "Google Docs - 128 KB",
    location: "Templates",
    accessedAt: "29 Jan",
    action: "create",
    period: "Awal tahun ini",
    kind: "doc",
  },
  {
    name: "Audit Summary",
    detail: "PDF - 2.6 MB",
    location: "Compliance",
    accessedAt: "11 Jan",
    action: "open",
    period: "Awal tahun ini",
    kind: "pdf",
  },
  {
    name: "Annual Budget 2025",
    detail: "Google Sheets - 2.2 MB",
    location: "Finance",
    accessedAt: "12 Nov 2025",
    action: "edit",
    period: "Tahun lalu",
    kind: "sheet",
  },
  {
    name: "Dokumentasi Event 2025",
    detail: "Folder - 312 item",
    location: "Media",
    accessedAt: "21 Sep 2025",
    action: "open",
    period: "Tahun lalu",
    kind: "folder",
  },
  {
    name: "Operational Checklist",
    detail: "Google Docs - 86 KB",
    location: "Operations",
    accessedAt: "4 Jul 2025",
    action: "create",
    period: "Tahun lalu",
    kind: "doc",
  },
]

const filterOptions: Array<{ label: string; value: RecentFilter }> = [
  { label: "Semua", value: "all" },
  { label: "Dibuka", value: "open" },
  { label: "Diedit", value: "edit" },
  { label: "Dibuat", value: "create" },
]

const kindConfig: Record<
  RecentKind,
  { icon: LucideIcon; iconClassName: string }
> = {
  folder: {
    icon: Folder,
    iconClassName: "bg-blue-100 text-blue-700",
  },
  pdf: {
    icon: FileText,
    iconClassName: "bg-orange-100 text-orange-700",
  },
  sheet: {
    icon: FileSpreadsheet,
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  doc: {
    icon: FileText,
    iconClassName: "bg-sky-100 text-sky-700",
  },
  image: {
    icon: FileImage,
    iconClassName: "bg-violet-100 text-violet-700",
  },
  presentation: {
    icon: Presentation,
    iconClassName: "bg-rose-100 text-rose-700",
  },
  code: {
    icon: FileCode2,
    iconClassName: "bg-slate-100 text-slate-700",
  },
}

const actionConfig: Record<
  RecentAction,
  { label: string; icon: LucideIcon; className: string }
> = {
  open: {
    label: "Dibuka",
    icon: Eye,
    className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  edit: {
    label: "Diedit",
    icon: PencilLine,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  create: {
    label: "Dibuat",
    icon: Plus,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
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
    <article className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_130px_180px_90px] sm:items-center sm:gap-4">
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
          <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
          <p className="truncate text-xs text-muted-foreground sm:hidden">
            {item.location} - {item.accessedAt}
          </p>
        </div>
      </div>

      <div>
        <RecentActionBadge action={item.action} />
      </div>

      <p className="hidden truncate text-sm text-muted-foreground sm:block">
        {item.location}
      </p>

      <p className="hidden text-sm text-muted-foreground sm:block sm:text-right">
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

      <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
        <p className="truncate">Lokasi: {item.location}</p>
        <p>Diakses: {item.accessedAt}</p>
      </div>
    </article>
  )
}

export function RecentSection() {
  const [isListView, setIsListView] = useState(true)
  const [activeFilter, setActiveFilter] = useState<RecentFilter>("all")

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return recentItems

    return recentItems.filter((item) => item.action === activeFilter)
  }, [activeFilter])

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
              File dan folder yang pernah dibuka, diedit, atau dibuat.
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

      {!hasItems ? (
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
                    <div className="hidden grid-cols-[minmax(0,2fr)_130px_180px_90px] items-center gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground uppercase sm:grid">
                      <span>Nama</span>
                      <span>Aktivitas</span>
                      <span>Lokasi</span>
                      <span className="text-right">Waktu</span>
                    </div>

                    {group.items.map((item, index) => (
                      <div
                        key={`${group.period}-${item.name}`}
                        className={cn(index > 0 && "border-t")}
                      >
                        <RecentListRow item={item} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <RecentGridCard
                        key={`${group.period}-${item.name}`}
                        item={item}
                      />
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