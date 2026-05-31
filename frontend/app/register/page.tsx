"use client"

import { API_BASE } from "@/lib/api"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Copy, Download, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { savePrivateKey, generateSeedPhrase, encryptPrivateKeyWithSeedPhrase } from "@/lib/crypto"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null)
  const [isSeedPhraseCopied, setIsSeedPhraseCopied] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    )

    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    )
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    )

    const publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(publicKeyBuffer))
    )
    const privateKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(privateKeyBuffer))
    )

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      setIsLoading(false)
      return
    }

    try {
      const keys = await generateKeyPair()
      const mnemonic = generateSeedPhrase()
      const { encryptedKey, saltHex } = await encryptPrivateKeyWithSeedPhrase(keys.privateKey, mnemonic)

      const response = await fetch(`${API_BASE}/api/v1/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          username,
          password,
          password_confirmation: confirmPassword,
          public_key: keys.publicKey,
          encrypted_private_key: encryptedKey,
          key_salt: saltHex,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registrasi gagal")
      }

      await savePrivateKey(keys.privateKey)
      setPrivateKey(keys.privateKey)
      setSeedPhrase(mnemonic)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleCopySeedPhrase() {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase)
      setIsSeedPhraseCopied(true)
    }
  }

  function handleDownloadSeedPhrase() {
    if (!seedPhrase) return
    const blob = new Blob([seedPhrase], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "zipher-seed-phrase.txt"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    setIsSeedPhraseCopied(true)
  }

  function handleCopyKey() {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  function handleDownloadKey() {
    if (!privateKey) return
    const blob = new Blob([privateKey], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "zipher-private-key.pem"
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    setIsDownloaded(true)
  }

  function handleFinishRegistration() {
    router.push("/")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 bg-muted/30 p-4 sm:gap-4 sm:p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">zipher.</h1>
        <br />
      </div>

      <Card className="w-full max-w-sm py-4 sm:py-6">
        <CardHeader>
          <CardTitle className="text-center text-lg sm:text-xl">Register</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-center text-xs font-medium text-destructive sm:text-sm">
                {error}
              </p>
            )}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username"
                autoComplete="username"
                required
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  autoComplete="new-password"
                  required
                  className="pr-10 text-xs sm:text-sm"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  required
                  className="pr-10 text-xs sm:text-sm"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <p className="text-right text-xs text-muted-foreground sm:text-xs">
              Sudah mempunyai akun?{" "}
              <Link
                href="/"
                className="font-medium text-foreground hover:underline"
              >
                Masuk
              </Link>
            </p>

            <Button type="submit" className="w-full text-xs sm:text-sm" disabled={isLoading}>
              {isLoading ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!privateKey} onOpenChange={() => {}}>
        <DialogContent className="w-full max-w-md p-4 sm:p-6 sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Simpan Seed Phrase & Private Key</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Seed phrase digunakan untuk memulihkan private key jika hilang.
              Simpan keduanya di tempat yang aman dan jangan bagikan kepada siapapun.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Seed Phrase (24 kata)</Label>
            <div className="grid grid-cols-3 gap-1 rounded-md border bg-muted p-3">
              {seedPhrase?.split(" ").map((word, i) => (
                <div key={i} className="flex gap-1 text-xs">
                  <span className="w-5 shrink-0 text-right text-muted-foreground">{i + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isSeedPhraseCopied ? "outline" : "default"}
                size="sm"
                className="flex-1 text-xs"
                onClick={handleCopySeedPhrase}
              >
                {isSeedPhraseCopied ? (
                  <><Check className="mr-1 size-3" /> Tersalin</>
                ) : (
                  <><Copy className="mr-1 size-3" /> Salin Seed Phrase</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDownloadSeedPhrase}
              >
                <Download className="mr-1 size-3" /> Unduh (.txt)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Private Key</Label>
            <div className="flex gap-2">
              <Input
                value={privateKey || ""}
                readOnly
                className="font-mono text-[10px] sm:text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 px-2"
                onClick={handleCopyKey}
              >
                {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
            </div>
            <Button
              type="button"
              variant={isDownloaded ? "outline" : "secondary"}
              size="sm"
              className="w-full text-xs"
              onClick={handleDownloadKey}
            >
              <Download className="mr-1 size-3" />
              {isDownloaded ? "Diunduh ✓" : "Unduh Private Key (.pem)"}
            </Button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="confirm-saved"
              className="size-4 rounded border-gray-300"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
            />
            <Label htmlFor="confirm-saved" className="text-xs font-normal">
              Saya sudah menyimpan seed phrase dengan aman
            </Label>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              className="w-full text-xs sm:text-sm"
              disabled={!isSeedPhraseCopied || !isConfirmed}
              onClick={handleFinishRegistration}
            >
              Lanjutkan ke Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
