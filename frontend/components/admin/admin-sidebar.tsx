"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertCircle, Home, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
    match: ["/admin"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: AlertCircle,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <div className="px-2 pb-4">
        <p className="text-xs font-medium tracking-[0.14em] text-sidebar-foreground/70 uppercase">
          Admin Panel
        </p>
        <p className="mt-1 text-lg font-semibold">Moderation</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            "match" in item && item.match
              ? item.match.includes(pathname)
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

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

      <div className="mt-auto px-2 pt-4 text-xs text-sidebar-foreground/60">
        Role: Super Admin
      </div>
    </aside>
  )
}
