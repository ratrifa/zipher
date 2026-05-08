"use client"

import { API_BASE } from "@/lib/api"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  FolderOpen,
  Search,
  ChevronDown,
  Settings,
  User,
  LogOut,
} from "lucide-react"

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
import { clearPrivateKey } from "@/lib/crypto"

function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim())
    } else {
      params.delete("q")
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="relative ml-2 hidden max-w-md flex-1 md:block"
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Cari file..."
        className="h-10 rounded-full bg-muted pl-10"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </form>
  )
}

export function DashboardNavbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [submittingLogout, setSubmittingLogout] = useState(false)

  const clearAuthState = () => {
    localStorage.removeItem("zipher_token")
    localStorage.removeItem("zipher.auth.token")
    localStorage.removeItem("zipher_user")
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new Event("user-updated"))
  }

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
      // folder-level caches follow the pattern zipher_cache_contents_*
      Object.keys(localStorage)
        .filter((k) => k.startsWith("zipher_cache_contents_"))
        .forEach((k) => localStorage.removeItem(k))
      router.replace("/")
      router.refresh()
    } finally {
      setSubmittingLogout(false)
    }
  }

  const avatarUrl = user?.avatar ? `${API_BASE}/storage/${user.avatar}` : null
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "U"

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-18 items-center gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="rounded-md bg-primary p-2 text-primary-foreground">
            <FolderOpen className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">zipher</span>
        </Link>

        <Suspense
          fallback={
            <div className="ml-2 hidden max-w-md flex-1 md:block">
              <div className="h-10 animate-pulse rounded-full bg-muted" />
            </div>
          }
        >
          <SearchInput />
        </Suspense>

        <div className="ml-auto flex items-center gap-2">
          {user?.role === "admin" && (
            <Button asChild variant="outline" className="hidden rounded-full md:inline-flex">
              <Link href="/admin">Super Admin</Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 overflow-hidden rounded-full px-2 py-0"
                aria-label="Menu akun"
                disabled={submittingLogout}
              >
                <Avatar size="default" className="size-10">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.username ?? "Akun"}</DropdownMenuLabel>
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
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  void handleLogout()
                }}
              >
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
