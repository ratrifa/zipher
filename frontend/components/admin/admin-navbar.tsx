"use client"

import Link from "next/link"
import { FolderOpen, Search, ChevronDown } from "lucide-react"

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

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 w-[240px]">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="rounded-md bg-[#00a8cc] p-1.5 text-white">
              <FolderOpen className="size-5" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-slate-800">zipher</span>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="ml-auto flex items-center gap-2 justify-end w-60">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-auto gap-2 rounded-full px-2 py-0 hover:bg-slate-100"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-indigo-500 text-white text-xs">JY</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
