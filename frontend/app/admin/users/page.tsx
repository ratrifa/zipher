"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ActiveUser = {
  id: number
  name: string
  email: string
  login: string
  status: "ABNORMAL" | "NORMAL"
  reports: number
  files: number
}

type BannedUser = {
  id: number
  name: string
  email: string
  status: "BANNED"
  bannedAt: string
  reports: number
  files: number
}

const ACTIVE_USERS: ActiveUser[] = [
  { id: 1, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 2, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 3, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 4, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 5, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 6, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 7, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 8, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 9, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 10, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 11, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 12, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 13, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 14, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 15, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 16, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
]

const BANNED_USERS: BannedUser[] = Array(8).fill(null).map((_, i) => ({
  id: i + 1,
  name: "Scarlett Johansson",
  email: "scarlettjohansson@gmail.com",
  status: "BANNED",
  bannedAt: "17/06/2020",
  reports: 10,
  files: 25
}))

function getStatusBadge(user: ActiveUser) {
  if (user.status === "NORMAL") {
    return (
      <span className="rounded-sm bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
        Normal
      </span>
    )
  }

  if (user.reports > 1) {
    return (
      <span className="rounded-sm bg-destructive/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
        Abnormal
      </span>
    )
  }

  return (
    <span className="rounded-sm bg-amber-500/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
      Warning
    </span>
  )
}

export default function UsersPage() {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Kelola user aktif dan user yang diblokir.</p>
      </div>

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:flex-[1.35]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-primary/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
              USER ACTIVE
            </div>
            <Input
              placeholder="Search user..."
              className="h-8 w-full max-w-55 text-xs"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-190 border-collapse text-center text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                  <th className="py-3 px-2 font-bold w-10">No</th>
                  <th className="py-3 px-2 font-bold text-left">Name</th>
                  <th className="py-3 px-2 font-bold text-left">E-Mail</th>
                  <th className="py-3 px-2 font-bold">Last Login</th>
                  <th className="py-3 px-2 font-bold">Status</th>
                  <th className="py-3 px-2 font-bold">Reports</th>
                  <th className="py-3 px-2 font-bold">Files</th>
                  <th className="py-3 px-2 font-bold w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVE_USERS.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                  >
                    <td className="py-2.5 px-2 text-muted-foreground">{user.id}</td>
                    <td className="py-2.5 px-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
                          <AvatarFallback className="text-[9px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="w-24 truncate text-[12px] font-semibold sm:w-32">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-left text-[11px] text-muted-foreground">{user.email}</td>
                    <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{user.login}</td>
                    <td className="py-2.5 px-2">{getStatusBadge(user)}</td>
                    <td className="py-2.5 px-2 text-[11px] font-semibold">
                      {user.reports > 0 ? (
                        <span
                          className={
                            user.reports > 1
                              ? "text-destructive"
                              : "text-amber-700 dark:text-amber-300"
                          }
                        >
                          {user.reports}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{user.reports}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{user.files}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:max-w-[45%]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-destructive/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-destructive uppercase">
              BANNED USER
            </div>
            <Input
              placeholder="Search user..."
              className="h-8 w-full max-w-55 text-xs"
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
                {BANNED_USERS.map((user) => (
                  <tr
                    key={`banned-${user.id}`}
                    className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                  >
                    <td className="py-2.5 px-2 text-muted-foreground">{user.id}</td>
                    <td className="py-2.5 px-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
                          <AvatarFallback className="text-[9px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="w-24 truncate text-[12px] font-semibold sm:w-28">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-muted-foreground">{user.email}</td>
                    <td className="py-2.5 px-2">
                      <span className="rounded-sm bg-destructive/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                        Banned
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[11px] font-semibold text-destructive">{user.reports}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
