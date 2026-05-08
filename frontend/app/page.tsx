"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_BASE, checkResetEmail, verifyResetKey, resetPassword } from "@/lib/api"

type ResetStep = "email" | "key" | "password"

export default function Page() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetMode, setResetMode] = useState(false)
  const [resetStep, setResetStep] = useState<ResetStep>("email")
  const [resetEmail, setResetEmail] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Login gagal")
      localStorage.setItem("zipher_token", data.data.token)
      localStorage.setItem("zipher_user", JSON.stringify(data.data.user))
      router.replace(data.data.user.role === "admin" ? "/admin" : "/dashboard/my-files")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function startResetFlow() {
    setResetMode(true)
    setResetStep("email")
    setResetEmail(email)
    setPrivateKey("")
    setNewPassword("")
    setConfirmNewPassword("")
    setError(null)
    setSuccessMessage(null)
  }

  function backToLogin() {
    setResetMode(false)
    setResetStep("email")
    setResetEmail("")
    setPrivateKey("")
    setNewPassword("")
    setConfirmNewPassword("")
    setError(null)
    setSuccessMessage(null)
  }

  async function handleResetEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!resetEmail.trim()) {
      setError("Isi email terlebih dahulu sebelum reset password.")
      return
    }
    setSubmitting(true)
    try {
      await checkResetEmail(resetEmail)
      setResetStep("key")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetKeySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!privateKey.trim()) {
      setError("Private key tidak boleh kosong.")
      return
    }
    setSubmitting(true)
    try {
      await verifyResetKey(resetEmail, privateKey)
      setResetStep("password")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmNewPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    setSubmitting(true)

    try {
      await resetPassword({
        email: resetEmail,
        private_key: privateKey,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      })

      setResetMode(false)
      setResetStep("email")
      setResetEmail("")
      setPrivateKey("")
      setNewPassword("")
      setConfirmNewPassword("")
      setPassword("")
      setSuccessMessage("Password berhasil diperbarui. Silakan masuk kembali.")
    } catch (err: any) {
      setError(err.message)
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
          <CardTitle className="text-center text-xl">
            {resetMode ? "Reset Password" : "Masuk"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={
              resetMode
                ? resetStep === "email"
                  ? handleResetEmailSubmit
                  : resetStep === "key"
                    ? handleResetKeySubmit
                    : handleResetPasswordSubmit
                : handleSubmit
            }
          >
            {!resetMode ? (
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
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            ) : null}

            {resetMode ? (
              <>
                {resetStep === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input
                      id="resetEmail"
                      name="resetEmail"
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan email akun untuk memulai reset password.
                    </p>
                    <p className="text-right text-xs text-muted-foreground">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={backToLogin}
                      >
                        Kembali ke login
                      </button>
                    </p>
                  </div>
                ) : resetStep === "key" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="privateKey">Private Key</Label>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => setResetStep("email")}
                      >
                        Ubah email
                      </button>
                    </div>
                    <textarea
                      id="privateKey"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Paste private key Anda di sini..."
                      rows={6}
                      required
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan private key untuk lanjut ke langkah berikutnya.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Masukkan password baru"
                          autoComplete="new-password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pb-2">
                      <Label htmlFor="confirmNewPassword">Konfirmasi Password Baru</Label>
                      <div className="relative">
                        <Input
                          id="confirmNewPassword"
                          name="confirmNewPassword"
                          type={showConfirmNewPassword ? "text" : "password"}
                          placeholder="Ulangi password baru"
                          autoComplete="new-password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="text-right text-xs text-muted-foreground">
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => setResetStep("key")}
                        >
                          Ubah private key
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={startResetFlow}
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
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
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {successMessage ? (
              <p className="text-sm text-emerald-600">{successMessage}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Memproses..."
                : resetMode
                  ? resetStep === "key"
                    ? "Next"
                    : "Reset Password"
                  : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
