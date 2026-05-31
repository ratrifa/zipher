"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDialog } from "@/hooks/use-app-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { API_BASE } from "@/lib/api"

type User = {
  id: string
  username: string
  email: string
  is_banned: boolean
  created_at: string
  files_count?: number
  reports_received_count?: number
  avatar?: string
}

export default function UsersPage() {
  const router = useRouter()
  const { showConfirm } = useAppDialog()
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [bannedUsers, setBannedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchActive, setSearchActive] = useState("")
  const [searchBanned, setSearchBanned] = useState("")
  const [submittingUserIds, setSubmittingUserIds] = useState<string[]>([])

  const withSubmittingUser = async (
    id: string,
    action: () => Promise<void>
  ) => {
    setSubmittingUserIds((prev) => [...prev, id])
    try {
      await action()
    } finally {
      setSubmittingUserIds((prev) => prev.filter((item) => item !== id))
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

  const fetchUsers = async () => {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch(
      `${API_BASE}/api/v1/admin/users?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 403) {
        router.push("/dashboard")
        return
      }
      throw new Error("Gagal mengambil data users")
    }

    const data = await response.json()
    const users = data.data.data || []
    setActiveUsers(users.filter((u: User) => !u.is_banned))
    setBannedUsers(users.filter((u: User) => u.is_banned))
  }

  const banUser = async (userId: string) => {
    const token = getAuthToken()
    if (!token) return

    await withSubmittingUser(userId, async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/admin/users/${userId}/ban`,
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

      await fetchUsers()
    })
  }

  useEffect(() => {
    const boot = async () => {
      try {
        await fetchUsers()
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    boot()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  const filteredActiveUsers = activeUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchActive.toLowerCase()) ||
      user.email.toLowerCase().includes(searchActive.toLowerCase())
  )

  const filteredBannedUsers = bannedUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchBanned.toLowerCase()) ||
      user.email.toLowerCase().includes(searchBanned.toLowerCase())
  )

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Kelola user aktif dan blacklist.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-8">
        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-primary/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
              USERS ({activeUsers.length})
            </div>
            <Input
              placeholder="Search user..."
              className="h-8 w-full max-w-55 text-xs"
              value={searchActive}
              onChange={(e) => setSearchActive(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-190 border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                  <th className="w-10 px-2 py-3 font-bold">No</th>
                  <th className="px-2 py-3 text-left font-bold">Name</th>
                  <th className="px-2 py-3 text-left font-bold">E-Mail</th>
                  <th className="px-2 py-3 font-bold">Joined</th>
                  <th className="px-2 py-3 font-bold">Reports</th>
                  <th className="px-2 py-3 font-bold">Files</th>
                  <th className="w-12 px-2 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Tidak ada user aktif
                    </td>
                  </tr>
                ) : (
                  filteredActiveUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/70 bg-card transition-colors last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2.5 text-left">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border">
                            <AvatarImage
                              src={
                                user.avatar
                                  ? `${API_BASE}/storage/${user.avatar}`
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-[9px]">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="w-24 truncate text-[12px] font-semibold sm:w-32">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-left text-[11px] text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-2 py-2.5 text-[11px] font-semibold">
                        {user.reports_received_count ? (
                          <span
                            className={
                              user.reports_received_count > 1
                                ? "text-destructive"
                                : "text-amber-700 dark:text-amber-300"
                            }
                          >
                            {user.reports_received_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-muted-foreground">
                        {user.files_count ?? 0}
                      </td>
                      <td className="flex justify-center px-2 py-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="my-1 h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={submittingUserIds.includes(user.id)}
                          onClick={async () => {
                            const confirmed = await showConfirm(
                              "Konfirmasi",
                              `Apakah Anda yakin ingin ban permanen pengguna "${user.username}"? Email ini akan di-blacklist dan seluruh filenya akan dihapus selamanya.`,
                              { destructive: true }
                            )

                            if (!confirmed) return

                            try {
                              await banUser(user.id)
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
                          Ban
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-destructive/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-destructive uppercase">
              BLACKLISTED USERS ({bannedUsers.length})
            </div>
            <Input
              placeholder="Search user..."
              className="h-8 w-full max-w-55 text-xs"
              value={searchBanned}
              onChange={(e) => setSearchBanned(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-120 border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                  <th className="w-8 px-2 py-3 font-bold">No</th>
                  <th className="w-[35%] px-2 py-3 text-left font-bold">Name</th>
                  <th className="w-[35%] px-2 py-3 text-left font-bold">E-Mail</th>
                  <th className="w-28 px-2 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBannedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Tidak ada user dalam blacklist
                    </td>
                  </tr>
                ) : (
                  filteredBannedUsers.map((user, idx) => (
                    <tr
                      key={`banned-${user.id}`}
                      className="border-b border-border/70 bg-card transition-colors last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2.5 text-left">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border">
                            <AvatarImage
                              src={
                                user.avatar
                                  ? `${API_BASE}/storage/${user.avatar}`
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-[9px]">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="w-24 truncate text-[12px] font-semibold sm:w-28">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-left text-[11px] text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="rounded-sm bg-destructive/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                          Banned
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
