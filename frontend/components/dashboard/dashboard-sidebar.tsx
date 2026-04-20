"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock3, Home, Star, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const menuItems = [
  {
    label: "My Files",
    href: "/dashboard/my-files",
    icon: Home,
    match: ["/dashboard", "/dashboard/my-files"],
  },
  {
    label: "Shared with Me",
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

      <div className="mt-6 border-t border-sidebar-border px-2 pt-4 pb-2">
        <p className="text-sm font-medium text-sidebar-foreground/80">
          Storage
        </p>
        <Progress
          value={57}
          className="mt-3 h-2 bg-sidebar-accent *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-blue-500 *:data-[slot=progress-indicator]:to-violet-500"
        />
        <p className="mt-3 text-sm text-sidebar-foreground/70">
          8.5 GB of 15 GB used
        </p>
      </div>
    </aside>
  )
}
