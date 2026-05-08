"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { useUpload } from "@/hooks/use-upload"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { uploadState, abortController, setAbortController } = useUpload()

  useEffect(() => {
    const token = localStorage.getItem("zipher_token")
    if (!token) {
      router.push("/")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
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

        <div className="relative flex h-svh flex-col overflow-hidden">
          <DashboardNavbar />

          {uploadState.isUploading && (
            <div className="absolute top-18 right-0 left-0 z-50 animate-in border-b bg-background/90 p-4 shadow-sm backdrop-blur-sm duration-300 fade-in slide-in-from-top-2">
              <div className="mx-auto flex max-w-xl items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="max-w-[80%] truncate">
                      {uploadState.totalFiles > 1
                        ? `Uploading ${uploadState.totalFiles} items... (${uploadState.currentFileIndex + 1}/${uploadState.totalFiles})`
                        : `Uploading: ${uploadState.fileName}`}
                    </span>
                    <span>{Math.round(uploadState.progress)}%</span>
                  </div>
                  <Progress value={uploadState.progress} className="h-1.5" />
                  {uploadState.totalFiles > 1 && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      File: {uploadState.fileName}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleCancelUpload}
                  title="Cancel Upload"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-7 pb-4 md:px-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
