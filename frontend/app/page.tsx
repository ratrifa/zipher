"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("http://localhost:8000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login gagal")
      }

      localStorage.setItem("zipher_token", data.data.token)
      localStorage.setItem("zipher_user", JSON.stringify(data.data.user))
      
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/30 p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">zipher.</h1>
        <br />
      </div>
      <Card className="w-full max-w-sm py-6">
        <CardHeader>
          <CardTitle className="text-center text-xl">Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2 pb-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Lupa password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground hover:underline"
                >
                  Daftar
                </Link>
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
