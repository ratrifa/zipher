"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDialog } from "@/hooks/use-app-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TriangleAlert, FolderOpen, X, Clock, User, FileText } from "lucide-react"
import { API_BASE } from "@/lib/api"
import { formatDate, formatBytes } from "@/lib/utils/file-utils"

type Report = {
  id: string
  file_id: string
  reporter_id: string
  owner_id: string
  file_name: string
  owner_username: string
  reason: string
  details?: string
  reporter_username: string
  created_at: string
  mime_type?: string
  size?: number
}

type ApiReport = {
  id: string
  file_id: string
  reporter_id: string
  reason: string
  details?: string
  created_at: string
  file?: {
    id: string
    name: string
    user_id: string
    mime_type?: string
    size?: number
    user?: {
      id: string
      username: string
    }
  }
  reporter?: {
    id: string
    username: string
    email: string
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const { showConfirm } = useAppDialog()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [submittingIds, setSubmittingIds] = useState<string[]>([])
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const withSubmitting = async (id: string, action: () => Promise<void>) => {
    setSubmittingIds((prev) => [...prev, id])
    try {
      await action()
    } finally {
      setSubmittingIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const getAuthToken = () => {
    const token = localStorage.getItem("zipher_token")
    if (!token) {
      router.push("/")
      return null
    }
    return token
  }

  const mapReports = (items: ApiReport[]): Report[] => {
    return items.map((item) => ({
      id: item.id,
      file_id: item.file_id,
      reporter_id: item.reporter_id,
      owner_id: item.file?.user_id ?? "",
      file_name: item.file?.name ?? "Unknown file",
      owner_username: item.file?.user?.username ?? "-",
      reason: item.reason,
      details: item.details,
      reporter_username: item.reporter?.username ?? "Unknown user",
      created_at: item.created_at,
      mime_type: item.file?.mime_type,
      size: item.file?.size,
    }))
  }

  const fetchReports = async () => {
    const token = getAuthToken()
    if (!token) return

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
    setReports(mapReports(data.data || []))
  }

  const reviewReport = async (id: string, status: "reviewed" | "dismissed") => {
    const token = getAuthToken()
    if (!token) return

    await withSubmitting(id, async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/admin/reports/${id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        }
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message || "Gagal memproses laporan")
      }

      setReports((prev) => prev.filter((item) => item.id !== id))
      if (selectedReport?.id === id) {
        setIsDetailModalOpen(false)
      }
    })
  }

  const banOwner = async (reportId: string, userId: string) => {
    const token = getAuthToken()
    if (!token) return

    await withSubmitting(reportId, async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/admin/users/${userId}/ban?report_id=${reportId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message || "Gagal ban user")
      }

      setReports((prev) => prev.filter((item) => item.owner_id !== userId))
      if (selectedReport?.owner_id === userId) {
        setIsDetailModalOpen(false)
      }
    })
  }

  const deleteReportedFile = async (reportId: string, fileId: string) => {
    const token = getAuthToken()
    if (!token) return

    await withSubmitting(reportId, async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/admin/files/${fileId}?report_id=${reportId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message || "Gagal menghapus file")
      }

      setReports((prev) => prev.filter((item) => item.id !== reportId))
      if (selectedReport?.id === reportId) {
        setIsDetailModalOpen(false)
      }
    })
  }

  useEffect(() => {
    const boot = async () => {
      try {
        await fetchReports()
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    boot()
  }, [router])

  const filteredReports = reports.filter(
    (report) =>
      report.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.owner_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openDetail = (report: Report) => {
    setSelectedReport(report)
    setIsDetailModalOpen(true)
  }

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
        <p className="text-sm text-muted-foreground">
          Review dan moderasi laporan konten.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="w-full rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mt-1 mb-4 flex flex-wrap items-center justify-between gap-3">
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

        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full min-w-245 border-collapse text-center text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                <th className="w-12 px-2 py-3 font-bold">No</th>
                <th className="px-2 py-3 text-left font-bold">File</th>
                <th className="px-2 py-3 text-left font-bold">Owner</th>
                <th className="px-2 py-3 text-left font-bold">Reason</th>
                <th className="px-2 py-3 text-left font-bold">Reported By</th>
                <th className="px-2 py-3 text-left font-bold">Time</th>
                <th className="w-[320px] px-2 py-3 text-right font-bold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada laporan
                  </td>
                </tr>
              ) : (
                filteredReports.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/70 bg-card transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-2 py-3 text-center text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-3 text-left font-semibold">
                      {item.file_name}
                    </td>
                    <td className="px-2 py-3 text-left text-[11px] font-semibold text-muted-foreground">
                      {item.owner_username}
                    </td>
                    <td className="px-2 py-3 text-left">
                      <span className="rounded-sm bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                        {item.reason}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-left text-[11px] text-muted-foreground">
                      {item.reporter_username}
                    </td>
                    <td className="px-2 py-3 text-left text-[11px] font-medium text-muted-foreground">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full px-3 text-[10px] font-bold"
                          disabled={submittingIds.includes(item.id)}
                          onClick={async () => {
                            try {
                              await reviewReport(item.id, "dismissed")
                              setError(null)
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Terjadi kesalahan"
                              )
                            }
                          }}
                        >
                          Dismiss
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-primary/30 px-3 text-[10px] font-bold text-primary hover:bg-primary/10 hover:text-primary"
                          disabled={submittingIds.includes(item.id)}
                          onClick={() => openDetail(item)}
                        >
                          <FolderOpen className="size-3.5" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={submittingIds.includes(item.id)}
                          onClick={async () => {
                            const confirmed = await showConfirm(
                              "Konfirmasi Hapus File",
                              `Apakah Anda yakin ingin menghapus file "${item.file_name}" secara permanen? File akan dihapus dari penyimpanan server dan database.`,
                              { destructive: true }
                            )

                            if (!confirmed) return

                            try {
                              await deleteReportedFile(item.id, item.file_id)
                              setError(null)
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Terjadi kesalahan"
                              )
                            }
                          }}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={submittingIds.includes(item.id)}
                          onClick={async () => {
                            if (!item.owner_id) {
                              setError("ID pemilik file tidak ditemukan.")
                              return
                            }

                            const confirmed = await showConfirm(
                              "Konfirmasi Ban Permanen",
                              `Apakah Anda yakin ingin ban permanen pemilik file "${item.owner_username}"? Email ini akan di-blacklist dan seluruh filenya akan dihapus selamanya.`,
                              { destructive: true }
                            )

                            if (!confirmed) return

                            try {
                              await banOwner(item.id, item.owner_id)
                              setError(null)
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Terjadi kesalahan"
                              )
                            }
                          }}
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

      {/* Report Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsDetailModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 rounded-full"
              onClick={() => setIsDetailModalOpen(false)}
            >
              <X className="size-4" />
            </Button>

            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <TriangleAlert className="size-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Detail Laporan</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <FileText className="size-3" /> Informasi File
                  </p>
                  <p className="text-sm font-semibold truncate">{selectedReport.file_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <User className="size-3" /> Pemilik
                  </p>
                  <p className="text-sm font-semibold">{selectedReport.owner_username}</p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Alasan</p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {selectedReport.reason}
                  {selectedReport.details && (
                    <span className="block mt-2 pt-2 border-t border-border/50 text-muted-foreground italic">
                      "{selectedReport.details}"
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDate(selectedReport.created_at)}
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <User className="size-3" />
                  Dilapor Oleh {selectedReport.reporter_username}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t pt-6">
              <Button
                variant="outline"
                className="rounded-full h-9 px-6 text-xs font-semibold"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
