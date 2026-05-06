"use client"

import { FormEvent, useEffect, useState } from "react"
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
import { resetPassword } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type ResetStep = "email" | "key" | "password"

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, loading, login } = useAuth()

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

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard/my-files")
    }
  }, [isAuthenticated, loading, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      await login({ email, password })
      router.replace("/dashboard/my-files")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Login gagal, silakan coba lagi."
      )
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
    setSuccessMessage(null)

    if (!resetEmail.trim()) {
      setError("Isi email terlebih dahulu sebelum reset password.")
      return
    }

    setResetStep("key")
  }

  async function handleResetKeySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!privateKey.trim()) {
      setError("Private key tidak boleh kosong.")
      return
    }

    setResetStep("password")
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!resetEmail.trim()) {
      setError("Isi email terlebih dahulu sebelum reset password.")
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }

    setSubmitting(true)

    try {
      await resetPassword({
        email: resetEmail,
        token: privateKey,
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
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Reset password gagal, silakan coba lagi."
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
                  onChange={(event) => setEmail(event.target.value)}
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
                      onChange={(event) => setResetEmail(event.target.value)}
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
                    <Input
                      id="privateKey"
                      name="privateKey"
                      type="text"
                      placeholder="Masukkan private key"
                      autoComplete="off"
                      required
                      value={privateKey}
                      onChange={(event) => setPrivateKey(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan private key untuk lanjut ke langkah berikutnya.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="Masukkan password baru"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2 pb-2">
                      <Label htmlFor="confirmNewPassword">Konfirmasi Password Baru</Label>
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type="password"
                        placeholder="Ulangi password baru"
                        autoComplete="new-password"
                        required
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                      />
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {successMessage ? (
              <p className="text-sm text-emerald-600">{successMessage}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting || loading}>
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
