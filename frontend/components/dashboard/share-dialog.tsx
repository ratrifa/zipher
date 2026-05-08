"use client"

import { API_BASE } from "@/lib/api"
import { useState, useEffect } from "react"
import { useAppDialog } from "@/hooks/use-app-dialog"
import { Search, Check, Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  importPublicKey,
  decryptAESKey,
  encryptAESKey,
  loadPrivateKey,
} from "@/lib/crypto"
import { PrivateKeyDialog } from "@/components/dashboard/private-key-dialog"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
}

export function ShareDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
}: ShareDialogProps) {
  const { showAlert } = useAppDialog()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setUsers([])
      setSelectedUser(null)
      setError(null)
      return
    }
  }, [open])

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setUsers([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const token = localStorage.getItem("zipher_token")
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/users/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        )
        const data = await response.json()
        if (data.success) {
          setUsers(data.data)
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Search failed:", err)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  const handleShare = async (preloadedKey?: CryptoKey) => {
    setIsLoading(true)
    setError(null)

    const token = localStorage.getItem("zipher_token")
    try {
      // 1. Fetch AES key file
      const response = await fetch(`${API_BASE}/api/v1/files/${fileId}/key`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(
          errData.message || "Gagal mengambil kunci enkripsi dari server"
        )
      }

      const keyData = await response.json()
      if (!keyData || !keyData.aes_key_encrypted) {
        throw new Error("Kunci enkripsi file tidak ditemukan di server")
      }

      // 2. Decrypt AES key dengan private key
      let aesKey: string
      try {
        const privKey = preloadedKey!
        aesKey = await decryptAESKey(keyData.aes_key_encrypted, privKey)
      } catch (err: any) {
        console.error("Decryption error:", err)
        throw new Error(
          "Private key Anda tidak valid atau tidak cocok untuk file ini. Pastikan Anda menggunakan kunci yang benar saat mengunggah file ini."
        )
      }

      // 3. Encrypt AES key dengan public key penerima
      const receiverPubKey = await importPublicKey(selectedUser.public_key)
      const encryptedForReceiver = await encryptAESKey(aesKey, receiverPubKey)

      // 4. Send ke backend
      const shareResponse = await fetch(`${API_BASE}/api/v1/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
          receiver_id: selectedUser.id,
          aes_key_encrypted_for_receiver: encryptedForReceiver,
        }),
      })

      const shareResult = await shareResponse.json()
      if (!shareResponse.ok)
        throw new Error(shareResult.message || "Gagal membagikan file")

      onOpenChange(false)
      showAlert("Berhasil", "File berhasil dibagikan!")
    } catch (err: any) {
      console.error("Share error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bagikan File</DialogTitle>
            <DialogDescription>
              Bagikan <strong>{fileName}</strong> dengan aman kepada pengguna
              lain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Pengguna</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Ketik username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (selectedUser) setSelectedUser(null)
                  }}
                  className="pr-9"
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  {isSearching ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("")
                          setSelectedUser(null)
                        }}
                      >
                        <X className="size-4 text-muted-foreground" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {users.length > 0 && !selectedUser && (
                <div className="rounded-md border bg-background shadow-sm">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md hover:bg-muted"
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchQuery(user.username)
                      }}
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    @{selectedUser.username}
                  </p>
                </div>
                <Check className="size-4 text-primary" />
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                disabled={!selectedUser || isLoading}
                onClick={async () => {
                  const savedKey = await loadPrivateKey()
                  if (savedKey) {
                    handleShare(savedKey)
                  } else {
                    setPrivateKeyDialogOpen(true)
                  }
                }}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Bagikan"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrivateKeyDialog
        open={privateKeyDialogOpen}
        onOpenChange={setPrivateKeyDialogOpen}
        onConfirm={async () => {
          const key = await loadPrivateKey()
          if (key) handleShare(key)
        }}
      />
    </>
  )
}
