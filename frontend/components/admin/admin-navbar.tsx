"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FolderOpen, Search, ChevronDown, LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { clearPrivateKey } from "@/lib/crypto"

export function AdminNavbar() {
  const router = useRouter()
  const [submittingLogout, setSubmittingLogout] = useState(false)

  const clearAuthState = () => {
    localStorage.removeItem("zipher_token")
    localStorage.removeItem("zipher.auth.token")
    localStorage.removeItem("zipher_user")
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new Event("user-updated"))
  }

  const handleLogout = async () => {
    try {
      setSubmittingLogout(true)
      await clearPrivateKey()
      clearAuthState()
      const cacheKeys = [
        "zipher_cache_recent",
        "zipher_cache_trash",
        "zipher_cache_starred",
        "zipher_cache_sharing",
      ]
      cacheKeys.forEach((k) => localStorage.removeItem(k))
      Object.keys(localStorage)
        .filter((k) => k.startsWith("zipher_cache_contents_"))
        .forEach((k) => localStorage.removeItem(k))
      router.replace("/")
      router.refresh()
    } finally {
      setSubmittingLogout(false)
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-18 items-center gap-4 px-4 md:px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="rounded-md bg-primary p-2 text-primary-foreground">
            <FolderOpen className="size-5" />
          </span>

          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">zipher</p>
            <p className="text-xs text-muted-foreground">Admin Console</p>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 overflow-hidden rounded-full px-2 py-0"
                aria-label="Menu admin"
                disabled={submittingLogout}
              >
                <Avatar size="default" className="size-10">
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  void handleLogout()
                }}
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
