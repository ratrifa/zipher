import type { ReactNode } from "react"

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <div className="grid min-h-svh md:grid-cols-[280px_1fr]">
        <div className="hidden border-r border-sidebar-border md:block">
          <DashboardSidebar />
        </div>

        <div className="flex min-h-svh flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
