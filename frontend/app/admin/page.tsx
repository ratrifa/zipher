"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { History, Inbox, Siren, TriangleAlert, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ActiveModal = "reports" | "activity" | null

type OverviewCardItem = {
  label: string
  value: string
  helper?: string
  icon: LucideIcon
  iconClassName: string
}

const overviewCards: OverviewCardItem[] = [
  {
    label: "Users",
    value: "1.234",
    icon: Users,
    iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  {
    label: "All Files",
    value: "1.234",
    icon: Inbox,
    iconClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  {
    label: "Banned Users",
    value: "8",
    icon: TriangleAlert,
    iconClassName: "bg-destructive/15 text-destructive",
  },
  {
    label: "Reports Pending",
    value: "123",
    icon: Siren,
    iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  {
    label: "Most Reported User",
    value: "SyahbanTzy",
    helper: "1234 Report",
    icon: TriangleAlert,
    iconClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
]

const recentReports = [
  { title: "Video1.mp4", reason: "Danger", by: "User123", time: "2 menit lalu" },
  { title: "Video2.mp4", reason: "18+", by: "User1234", time: "8 menit lalu" },
  {
    title: "Video3.mp4",
    reason: "Confidential Info",
    by: "User12345",
    time: "15 menit lalu",
  },
]

const recentActivity = [
  { name: "Vio The Goat", action: "Edited", file: "LABP.pdf", time: "2m ago" },
  {
    name: "Vio The Goat",
    action: "Uploaded",
    file: "LABP.pdf",
    time: "1h ago",
  },
  { name: "Farrel", action: "Uploaded", file: "Image.png", time: "2h ago" },
  { name: "Gorlock", action: "Uploaded", file: "Image.png", time: "3h ago" },
]

function OverviewCard({ item }: { item: OverviewCardItem }) {
  const Icon = item.icon

  return (
    <Card className="h-full rounded-2xl border-border/80 shadow-sm">
      <CardContent className="flex h-full items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
          {item.helper ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
          ) : null}
        </div>

        <span
          className={`inline-flex size-12 items-center justify-center rounded-xl ${item.iconClassName}`}
        >
          <Icon className="size-6" />
        </span>
      </CardContent>
    </Card>
  )
}

function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <Card
      className="h-full cursor-pointer rounded-2xl border-border/80 shadow-sm transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="flex h-full items-center justify-between gap-3 p-6">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-6" />
        </span>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  return (
    <div className="relative space-y-8 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang Super Admin</h1>
        <p className="text-sm text-muted-foreground">Dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => (
          <OverviewCard key={item.label} item={item} />
        ))}

        <ActionCard
          title="Recent Reports"
          description="Lihat laporan terbaru"
          icon={TriangleAlert}
          onClick={() => setActiveModal("reports")}
        />
        <ActionCard
          title="Recent Activity"
          description="Pantau aktivitas terbaru"
          icon={History}
          onClick={() => setActiveModal("activity")}
        />
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />

          {activeModal === "reports" && (
            <div className="relative z-10 w-full max-w-xl rounded-2xl border bg-card p-6 text-card-foreground shadow-xl">
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
                onClick={() => setActiveModal(null)}
              >
                <X className="size-4" />
              </Button>

              <div className="mb-6 pr-10">
                <h2 className="text-xl font-semibold tracking-tight">Recent Reports</h2>
                <p className="text-sm text-muted-foreground">Laporan terbaru yang menunggu review admin.</p>
              </div>

              <div className="space-y-3">
                {recentReports.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/35 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reported by {item.by} - {item.time}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold text-destructive uppercase">
                        {item.reason}
                      </span>
                    </div>
                    <Button size="sm" className="h-8 shrink-0 rounded-full px-4">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModal === "activity" && (
            <div className="relative z-10 w-full max-w-xl rounded-2xl border bg-card p-6 text-card-foreground shadow-xl">
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
                onClick={() => setActiveModal(null)}
              >
                <X className="size-4" />
              </Button>

              <div className="mb-6 pr-10">
                <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Ringkasan aktivitas terakhir pengguna.</p>
              </div>

              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={`${item.name}-${item.time}`}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-muted/35 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.file}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
