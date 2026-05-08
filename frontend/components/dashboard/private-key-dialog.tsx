"use client"

import { useState, useEffect } from "react"
import { KeyRound, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  importPublicKey,
  importPrivateKey,
  encryptAESKey,
  decryptAESKey,
  savePrivateKey,
} from "@/lib/crypto"

interface PrivateKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PrivateKeyDialog({
  open,
  onOpenChange,
  onConfirm,
}: PrivateKeyDialogProps) {
  const [key, setKey] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setKey("")
      setError("")
    }
  }, [open])

  const handleConfirm = async () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError("Kunci privat tidak boleh kosong")
      return
    }

    try {
      const userStr = localStorage.getItem("zipher_user")
      const userPublicKey = userStr ? JSON.parse(userStr).public_key : null

      if (userPublicKey) {
        const pubKey = await importPublicKey(userPublicKey)
        const testEncrypted = await encryptAESKey("zipher-key-verify", pubKey)
        let privKey: CryptoKey
        try {
          privKey = await importPrivateKey(trimmed)
        } catch {
          setError("Format kunci privat tidak valid")
          return
        }
        try {
          const result = await decryptAESKey(testEncrypted, privKey)
          if (result !== "zipher-key-verify") throw new Error("mismatch")
        } catch {
          setError("Private key tidak cocok")
          return
        }
      }

      await savePrivateKey(trimmed)
      onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError("Format kunci privat tidak valid")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Masukkan Kunci Privat
          </DialogTitle>
          <DialogDescription>
            File ini dienkripsi secara end-to-end. Masukkan Private Key Anda
            untuk membukanya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="privKeyInput">Private Key Anda</Label>
            <textarea
              id="privKeyInput"
              value={key}
              onChange={(e) => {
                setKey(e.target.value)
                setError("")
              }}
              placeholder="Paste private key Anda di sini..."
              rows={6}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!key.trim()} onClick={handleConfirm}>
            Lanjutkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
