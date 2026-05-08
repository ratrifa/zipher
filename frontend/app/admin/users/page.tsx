"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  report_count?: number
  file_count?: number
  avatar?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [bannedUsers, setBannedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchActive, setSearchActive] = useState("")
  const [searchBanned, setSearchBanned] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("zipher_token")
        if (!token) {
          router.push("/")
          return
        }

        const response = await fetch(`${API_BASE}/api/v1/admin/users?per_page=100`, {
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
          throw new Error("Gagal mengambil data users")
        }

        const data = await response.json()
        const users = data.data.data || []
        
        setActiveUsers(users.filter((u: User) => !u.is_banned))
        setBannedUsers(users.filter((u: User) => u.is_banned))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
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
        <p className="text-sm text-muted-foreground">Kelola user aktif dan user yang diblokir.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:flex-[1.35]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-primary/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
              USER ACTIVE ({activeUsers.length})
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
                  <th className="py-3 px-2 font-bold w-10">No</th>
                  <th className="py-3 px-2 font-bold text-left">Name</th>
                  <th className="py-3 px-2 font-bold text-left">E-Mail</th>
                  <th className="py-3 px-2 font-bold">Joined</th>
                  <th className="py-3 px-2 font-bold">Reports</th>
                  <th className="py-3 px-2 font-bold">Files</th>
                  <th className="py-3 px-2 font-bold w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Tidak ada user aktif
                    </td>
                  </tr>
                ) : (
                  filteredActiveUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                    >
                      <td className="py-2.5 px-2 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2.5 px-2 text-left">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border">
                            <AvatarImage src={user.avatar ? `${API_BASE}/storage/${user.avatar}` : undefined} />
                            <AvatarFallback className="text-[9px]">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="w-24 truncate text-[12px] font-semibold sm:w-32">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-left text-[11px] text-muted-foreground">{user.email}</td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] font-semibold">
                        {user.report_count ? (
                          <span className={user.report_count > 1 ? "text-destructive" : "text-amber-700 dark:text-amber-300"}>
                            {user.report_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{user.file_count || 0}</td>
                      <td className="py-2.5 px-2 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="my-1 h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
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

        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:max-w-[45%]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-destructive/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-destructive uppercase">
              BANNED USER ({bannedUsers.length})
            </div>
            <Input
              placeholder="Search user..."
              className="h-8 w-full max-w-55 text-xs"
              value={searchBanned}
              onChange={(e) => setSearchBanned(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-155 border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                  <th className="py-3 px-2 font-bold w-8">No</th>
                  <th className="py-3 px-2 font-bold text-left">Name</th>
                  <th className="py-3 px-2 font-bold text-left">E-Mail</th>
                  <th className="py-3 px-2 font-bold">Status</th>
                  <th className="py-3 px-2 font-bold">Reports</th>
                  <th className="py-3 px-2 font-bold w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBannedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada user yang diblokir
                    </td>
                  </tr>
                ) : (
                  filteredBannedUsers.map((user, idx) => (
                    <tr
                      key={`banned-${user.id}`}
                      className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                    >
                      <td className="py-2.5 px-2 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2.5 px-2 text-left">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border">
                            <AvatarImage src={user.avatar ? `${API_BASE}/storage/${user.avatar}` : undefined} />
                            <AvatarFallback className="text-[9px]">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="w-24 truncate text-[12px] font-semibold sm:w-28">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{user.email}</td>
                      <td className="py-2.5 px-2">
                        <span className="rounded-sm bg-destructive/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                          Banned
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[11px] font-semibold text-destructive">
                        {user.report_count || 0}
                      </td>
                      <td className="py-2.5 px-2 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="my-1 h-7 rounded-full border-emerald-500/30 px-3 text-[10px] font-bold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-300"
                        >
                          Unban
                        </Button>
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
