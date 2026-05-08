"use client"

import { API_BASE } from "@/lib/api"
import { formatBytes } from "@/lib/utils/file-utils"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock3, Home, Star, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StorageDialog } from "@/components/dashboard/storage-dialog"

const menuItems = [
  {
    label: "My Files",
    href: "/dashboard/my-files",
    icon: Home,
    match: ["/dashboard", "/dashboard/my-files"],
  },
  {
    label: "Sharing",
    href: "/dashboard/shared",
    icon: Users,
  },
  {
    label: "Recent",
    href: "/dashboard/recent",
    icon: Clock3,
  },
  {
    label: "Starred",
    href: "/dashboard/starred",
    icon: Star,
  },
  {
    label: "Trash",
    href: "/dashboard/trash",
    icon: Trash2,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [storage, setStorage] = useState(() => {
    try {
      const cached = localStorage.getItem("zipher_user")
      if (cached) {
        const u = JSON.parse(cached)
        if (u.storage_used != null && u.storage_limit != null) {
          return { used: u.storage_used, limit: u.storage_limit }
        }
      }
    } catch {}
    return { used: 0, limit: 32 * 1024 * 1024 * 1024 }
  })

  useEffect(() => {
    async function fetchStorage() {
      const token = localStorage.getItem("zipher_token")
      if (!token) return

      try {
        const response = await fetch(`${API_BASE}/api/v1/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        if (data.success) {
          setStorage({
            used: data.data.storage_used || 0,
            limit: data.data.storage_limit || 32 * 1024 * 1024 * 1024
          })
          localStorage.setItem("zipher_user", JSON.stringify(data.data))
        }
      } catch (error) {
        console.error("Failed to fetch storage:", error)
      }
    }

    fetchStorage()

    window.addEventListener("contents-updated", fetchStorage)
    return () => window.removeEventListener("contents-updated", fetchStorage)
  }, [])

  const [storageDialogOpen, setStorageDialogOpen] = useState(false)
  const progressValue = (storage.used / storage.limit) * 100

  return (
    <aside className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            "match" in item && item.match
              ? item.match.includes(pathname)
              : item.href === pathname

          return (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              className={[
                "h-12 w-full justify-start gap-3 rounded-3xl px-4 text-base",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <Link href={item.href}>
                <Icon className="size-5" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </nav>

      <button
        onClick={() => setStorageDialogOpen(true)}
        className="mt-6 w-full cursor-pointer rounded-lg border border-sidebar-border px-2 pt-4 pb-2 text-left transition-colors hover:bg-sidebar-accent/40"
      >
        <p className="text-sm font-medium text-sidebar-foreground/80">
          Storage
        </p>
        <Progress
          value={progressValue}
          className="mt-3 h-2 bg-sidebar-accent *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-blue-500 *:data-[slot=progress-indicator]:to-violet-500"
        />
        <p className="mt-3 text-sm text-sidebar-foreground/70">
          {formatBytes(storage.used)} of {formatBytes(storage.limit)} used
        </p>
      </button>

      <StorageDialog
        open={storageDialogOpen}
        onOpenChange={setStorageDialogOpen}
        storage={storage}
      />
    </aside>
  )
}
