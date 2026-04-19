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
    <aside className="flex h-full flex-col bg-background pt-6 px-4 border-r border-slate-200">
      <nav className="space-y-2">
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
                "w-full justify-start gap-4 rounded-full h-11 px-6 font-medium text-[15px]",
                isActive
                  ? "bg-[#eff5ff] text-blue-500 hover:bg-[#eff5ff]/80 hover:text-blue-500"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
    </aside>
  )
}
