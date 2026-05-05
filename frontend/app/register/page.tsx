"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

function generatePublicKeyPlaceholder() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `pk-${window.crypto.randomUUID()}`
  }

  return `pk-${Date.now()}`
}

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, loading, register } = useAuth()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard/my-files")
    }
  }, [isAuthenticated, loading, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    setSubmitting(true)

    try {
      await register({
        username,
        email,
        password,
        password_confirmation: confirmPassword,
        public_key: generatePublicKeyPlaceholder(),
      })

      router.replace("/dashboard/my-files")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Registrasi gagal, silakan coba lagi."
      )
    } finally {
      setSubmitting(false)
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
          <CardTitle className="text-center text-xl">Daftar</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username"
                autoComplete="username"
                minLength={8}
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <p className="text-right text-xs text-muted-foreground">
              Sudah mempunyai akun?{" "}
              <Link
                href="/"
                className="font-medium text-foreground hover:underline"
              >
                Masuk
              </Link>
            </p>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={submitting || loading}>
              {submitting ? "Memproses..." : "Daftar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}