"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { History, Inbox, Siren, TriangleAlert, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { API_BASE } from "@/lib/api"

type ActiveModal = "reports" | "activity" | null

type OverviewCardItem = {
  label: string
  value: string
  helper?: string
  icon: LucideIcon
  iconClassName: string
}

type AdminStats = {
  total_users: number
  total_files: number
  banned_users: number
  pending_reports: number
  most_reported_user?: {
    username: string
    report_count: number
  }
}

type ReportItem = {
  id: string
  file_name: string
  reason: string
  reporter_username: string
  created_at: string
}

const overviewCards: OverviewCardItem[] = [
  {
    label: "Users",
    value: "0",
    icon: Users,
    iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  {
    label: "All Files",
    value: "0",
    icon: Inbox,
    iconClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  {
    label: "Banned Users",
    value: "0",
    icon: TriangleAlert,
    iconClassName: "bg-destructive/15 text-destructive",
  },
  {
    label: "Reports Pending",
    value: "0",
    icon: Siren,
    iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  {
    label: "Most Reported User",
    value: "N/A",
    helper: "0 Report",
    icon: TriangleAlert,
    iconClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
]

const recentReports = []

const recentActivity = []

function OverviewCard({ item }: { item: OverviewCardItem }) {
  const Icon = item.icon

  return (
    <Card className="h-full rounded-2xl border-border/80 shadow-sm">
      <CardContent className="flex h-full items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {item.value}
          </p>
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
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_files: 0,
    banned_users: 0,
    pending_reports: 0,
  })
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("zipher_token")
        if (!token) {
          router.push("/")
          return
        }

        const dashRes = await fetch(`${API_BASE}/api/v1/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })

        if (!dashRes.ok) {
          if (dashRes.status === 403) {
            router.push("/dashboard")
            return
          }
          throw new Error("Gagal mengambil data dashboard")
        }

        const dashData = await dashRes.json()
        const dashboardStats = dashData?.data ?? {}
        setStats({
          total_users: dashboardStats.total_users ?? 0,
          total_files: dashboardStats.total_files ?? 0,
          banned_users: dashboardStats.banned_users ?? 0,
          pending_reports: dashboardStats.pending_reports ?? 0,
          most_reported_user: dashboardStats.most_reported_user,
        })

        const reportsRes = await fetch(`${API_BASE}/api/v1/admin/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json()
          setReports(reportsData.data || [])
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const cards: OverviewCardItem[] = [
    {
      label: "Users",
      value: (stats.total_users ?? 0).toLocaleString(),
      icon: Users,
      iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "All Files",
      value: (stats.total_files ?? 0).toLocaleString(),
      icon: Inbox,
      iconClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    },
    {
      label: "Banned Users",
      value: (stats.banned_users ?? 0).toString(),
      icon: TriangleAlert,
      iconClassName: "bg-destructive/15 text-destructive",
    },
    {
      label: "Reports Pending",
      value: (stats.pending_reports ?? 0).toString(),
      icon: Siren,
      iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    },
    ...(stats.most_reported_user
      ? [
          {
            label: "Most Reported User",
            value: stats.most_reported_user.username,
            helper: `${stats.most_reported_user.report_count} Reports`,
            icon: TriangleAlert,
            iconClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
          },
        ]
      : []),
  ]

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Selamat Datang Super Admin
        </h1>
        <p className="text-sm text-muted-foreground">Dashboard overview</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
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
          <div
            className="absolute inset-0"
            onClick={() => setActiveModal(null)}
          />

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
                <h2 className="text-xl font-semibold tracking-tight">
                  Recent Reports
                </h2>
                <p className="text-sm text-muted-foreground">
                  Laporan terbaru yang menunggu review admin.
                </p>
              </div>

              <div className="max-h-96 space-y-3 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada laporan pending
                  </p>
                ) : (
                  reports.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-muted/35 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.file_name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reported by {item.reporter_username}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold text-destructive uppercase">
                          {item.reason}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 shrink-0 rounded-full px-4"
                        onClick={() => router.push("/admin/reports")}
                      >
                        Review
                      </Button>
                    </div>
                  ))
                )}
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
                <h2 className="text-xl font-semibold tracking-tight">
                  Recent Activity
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ringkasan aktivitas terakhir pengguna.
                </p>
              </div>

              <div className="max-h-96 space-y-3 overflow-y-auto">
                <p className="text-sm text-muted-foreground">
                  Activity feed coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
