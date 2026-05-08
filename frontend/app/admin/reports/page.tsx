"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TriangleAlert, ChevronDown, FolderOpen } from "lucide-react"
import { API_BASE } from "@/lib/api"

type Report = {
  id: string
  file_name: string
  owner_username: string
  reason: string
  reporter_username: string
  created_at: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("zipher_token")
        if (!token) {
          router.push("/")
          return
        }

        const response = await fetch(`${API_BASE}/api/v1/admin/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          if (response.status === 403) {
            router.push("/dashboard")
            return
          }
          throw new Error("Gagal mengambil data laporan")
        }

        const data = await response.json()
        setReports(data.data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [router])

  const filteredReports = reports.filter(
    (report) =>
      report.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.owner_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Review dan moderasi laporan konten.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:w-4/5">
        <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Search Filters
            <ChevronDown className="size-4" />
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md bg-primary/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
              REPORT COUNT: {filteredReports.length}
            </div>
            <Input
              placeholder="Search report..."
              className="h-8 w-full max-w-55 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full min-w-245 border-collapse text-center text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                <th className="py-3 px-2 font-bold w-12">No</th>
                <th className="py-3 px-2 font-bold text-left">File</th>
                <th className="py-3 px-2 font-bold text-left">Owner</th>
                <th className="py-3 px-2 font-bold text-left">Reason</th>
                <th className="py-3 px-2 font-bold text-left">Reported By</th>
                <th className="py-3 px-2 font-bold text-left">Time</th>
                <th className="py-3 px-2 font-bold text-right w-[320px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada laporan
                  </td>
                </tr>
              ) : (
                filteredReports.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                  >
                    <td className="py-3 px-2 text-center text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-2 text-left font-semibold">{item.file_name}</td>
                    <td className="py-3 px-2 text-left text-[11px] font-semibold text-muted-foreground">
                      {item.owner_username}
                    </td>
                    <td className="py-3 px-2 text-left">
                      <span className="rounded-sm bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-left text-[11px] text-muted-foreground">
                      {item.reporter_username}
                    </td>
                    <td className="py-3 px-2 text-left text-[11px] font-medium text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full px-3 text-[10px] font-bold"
                        >
                          Dismiss
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-primary/30 px-3 text-[10px] font-bold text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <FolderOpen className="size-3.5" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <TriangleAlert className="size-3.5" />
                          Ban
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
