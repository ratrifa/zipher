"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { useAuth } from "@/lib/auth"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Memuat sesi...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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
