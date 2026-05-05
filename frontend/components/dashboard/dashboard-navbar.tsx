"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FolderOpen, Search, ChevronDown, Settings, User, LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export function DashboardNavbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("zipher_user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("zipher_user")
      if (updatedUser) {
        setUser(JSON.parse(updatedUser))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("user-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("user-updated", handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("zipher_token")
    localStorage.removeItem("zipher_user")
    router.push("/")
  }

  const avatarUrl = user?.avatar ? `http://localhost:8000/storage/${user.avatar}` : null
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ZA"

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-18 items-center gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="rounded-md bg-primary p-2 text-primary-foreground">
            <FolderOpen className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">zipher</span>
        </Link>

        <div className="relative ml-2 hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            className="h-10 rounded-full bg-muted pl-10"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 overflow-hidden rounded-full px-2 py-0"
                aria-label="Menu akun"
              >
                <Avatar size="default" className="size-10">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Akun</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="size-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile#security">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
