import type { ReactNode } from "react"

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="h-svh overflow-hidden bg-background">
      <div className="grid h-full md:grid-cols-[280px_1fr]">
        <div className="hidden h-svh border-r border-sidebar-border md:sticky md:top-0 md:block">
          <DashboardSidebar />
        </div>

        <div className="flex h-svh flex-col overflow-hidden">
          <DashboardNavbar />
          <main className="flex-1 overflow-y-auto px-7 pb-4 md:px-7 pb-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
