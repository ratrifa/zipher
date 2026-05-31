"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_BASE } from "@/lib/api"
import { decryptPrivateKeyWithSeedPhrase, validateSeedPhrase, savePrivateKey } from "@/lib/crypto"
import { Download } from "lucide-react"

export default function RecoverKeyPage() {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "success">("form")
  const [email, setEmail] = useState("")
  const [mnemonic, setMnemonic] = useState("")
  const [recoveredKey, setRecoveredKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, " ")
    const wordCount = normalized.split(" ").length

    if (wordCount !== 24) {
      setError(`Seed phrase harus 24 kata. Saat ini: ${wordCount} kata.`)
      return
    }

    if (!validateSeedPhrase(normalized)) {
      setError("Seed phrase tidak valid. Periksa kembali ejaan setiap kata.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/recover-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Akun tidak ditemukan.")

      let plainKey: string
      try {
        plainKey = await decryptPrivateKeyWithSeedPhrase(
          data.data.encrypted_private_key,
          data.data.key_salt,
          normalized
        )
      } catch (err) {
        if (err instanceof DOMException) {
          throw new Error("Seed phrase salah atau tidak cocok dengan akun ini.")
        }
        throw err
      }

      await savePrivateKey(plainKey)
      setRecoveredKey(plainKey)
      setStep("success")
    } catch (err: any) {
      setError(err.message || "Gagal memulihkan kunci.")
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([recoveredKey], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "zipher-private-key.pem"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 bg-muted/30 p-4 sm:gap-4 sm:p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">zipher.</h1>
        <br />
      </div>

      <Card className="w-full max-w-sm py-4 sm:py-6">
        <CardHeader>
          <CardTitle className="text-center text-lg sm:text-xl">
            {step === "success" ? "Kunci Dipulihkan" : "Pulihkan Private Key"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {step === "success" ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Private key berhasil dipulihkan dan disimpan ke browser ini.
                Unduh sebagai cadangan, lalu masuk kembali.
              </p>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Private Key</Label>
                <Input
                  value={recoveredKey}
                  readOnly
                  className="font-mono text-[10px] sm:text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs sm:text-sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 size-4" />
                Unduh Private Key (.pem)
              </Button>
              <Button
                type="button"
                className="w-full text-xs sm:text-sm"
                onClick={() => router.push("/")}
              >
                Masuk
              </Button>
            </div>
          ) : (
            <form className="space-y-3 sm:space-y-4" onSubmit={handleRecover}>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="mnemonic" className="text-xs sm:text-sm">Seed Phrase (24 kata)</Label>
                <textarea
                  id="mnemonic"
                  value={mnemonic}
                  onChange={e => setMnemonic(e.target.value)}
                  placeholder="Masukkan 24 kata seed phrase, dipisahkan spasi..."
                  rows={4}
                  required
                  className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Pisahkan setiap kata dengan spasi. Huruf kecil semua.
                </p>
              </div>

              {error && (
                <p className="text-xs font-medium text-destructive sm:text-sm">{error}</p>
              )}

              <Button type="submit" className="w-full text-xs sm:text-sm" disabled={loading}>
                {loading ? "Memulihkan..." : "Pulihkan Kunci"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Link href="/" className="hover:underline">
                  Kembali ke login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
