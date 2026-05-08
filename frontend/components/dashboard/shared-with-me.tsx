"use client"

import { API_BASE } from "@/lib/api"
import {
  getIcon,
  getIconClassName,
  formatBytes,
  formatDate,
} from "@/lib/utils/file-utils"
import { useMemo, useState, useEffect } from "react"
import { useAppDialog } from "@/hooks/use-app-dialog"
import {
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  ChevronDown,
  File as FileIcon,
  Shield,
  Loader2,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import {
  FilePreviewContent,
  isTextDecodable,
} from "@/components/dashboard/file-preview-content"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PrivateKeyDialog } from "@/components/dashboard/private-key-dialog"
import { ReportDialog } from "@/components/dashboard/report-dialog"
import {
  importAESKey,
  importPublicKey,
  decryptAESKey,
  encryptAESKey,
  decryptData,
  loadPrivateKey,
} from "@/lib/crypto"
import axios from "axios"

function formatReceivedItem(share: any) {
  const item = share.file
  return {
    id: item.id,
    shareId: share.id,
    name: item.name,
    meta: `${item.mime_type} • ${formatBytes(item.size)}`,
    updatedAt: formatDate(share.shared_at),
    owner: share.owner?.username || "Unknown",
    sharedBy: share.owner?.email || "Unknown",
    size: formatBytes(item.size),
    sizeBytes: item.size || 0,
    location: "Diterima",
    icon: getIcon(item.mime_type || "", false, item.name),
    iconClassName: getIconClassName(item.mime_type || "", false, item.name),
    isFolder: false,
    isStarred: !!item.is_starred,
    section: "received",
  }
}

function formatSentItem(share: any) {
  const item = share.file
  return {
    id: item.id,
    shareId: share.id,
    name: item.name,
    meta: `${item.mime_type} • ${formatBytes(item.size)}`,
    updatedAt: formatDate(share.shared_at),
    owner: share.receiver?.username || share.receiver?.email || "Unknown",
    sharedWith: share.receiver?.username || share.receiver?.email || "Unknown",
    size: formatBytes(item.size),
    sizeBytes: item.size || 0,
    location: `Dibagikan ke ${share.receiver?.username || "seseorang"}`,
    icon: getIcon(item.mime_type || "", false, item.name),
    iconClassName: getIconClassName(item.mime_type || "", false, item.name),
    isFolder: false,
    isStarred: !!item.is_starred,
    section: "sent",
  }
}

export function SharingSection() {
  const { showAlert, showConfirm } = useAppDialog()
  const [isListView, setIsListView] = useState(true)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [privateKeyDialogOpen, setPrivateKeyDialogOpen] = useState(false)
  const [targetFile, setTargetFile] = useState<any>(null)
  const [pendingSave, setPendingSave] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportingItem, setReportingItem] = useState<any>(null)
  const [reportedShareIds, setReportedShareIds] = useState<Set<string>>(
    new Set()
  )

  const [previewItem, setPreviewItem] = useState<{
    name: string
    url: string
    mimeType: string
    content?: string
  } | null>(null)

  const fetchShared = async () => {
    const cached = localStorage.getItem("zipher_cache_sharing")
    if (cached) {
      try {
        const raw = JSON.parse(cached)
        setItems([
          ...(raw.received || []).map(formatReceivedItem),
          ...(raw.sent || []).map(formatSentItem),
        ])
        setIsLoading(false)
      } catch {}
    } else {
      setIsLoading(true)
    }

    const token = localStorage.getItem("zipher_token")
    if (!token) return

    try {
      const [resReceived, resSent] = await Promise.all([
        fetch(`${API_BASE}/api/v1/shared/with-me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        fetch(`${API_BASE}/api/v1/shared/by-me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ])

      const dataReceived = await resReceived.json()
      const dataSent = await resSent.json()

      setItems([
        ...(dataReceived.data || []).map(formatReceivedItem),
        ...(dataSent.data || []).map(formatSentItem),
      ])
      localStorage.setItem(
        "zipher_cache_sharing",
        JSON.stringify({
          received: dataReceived.data || [],
          sent: dataSent.data || [],
        })
      )
    } catch (error) {
      console.error("Failed to fetch shared files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShared()
  }, [])

  const handleOpen = async (id: string, name: string) => {
    setTargetFile({ id, name })
    const privateKey = await loadPrivateKey()
    if (!privateKey) {
      setPrivateKeyDialogOpen(true)
    } else {
      decryptAndPreview(id, name, privateKey)
    }
  }

  const handleDownload = async (id: string, name: string) => {
    const token = localStorage.getItem("zipher_token")
    const privateKey = await loadPrivateKey()

    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/files/${id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      const data = response.data

      if (data.encrypted_data && data.aes_key_encrypted) {
        if (privateKey) {
          try {
            const aesKeyStr = await decryptAESKey(
              data.aes_key_encrypted,
              privateKey
            )
            const aesKey = await importAESKey(aesKeyStr)

            const encryptedBuffer = Uint8Array.from(
              atob(data.encrypted_data),
              (c) => c.charCodeAt(0)
            ).buffer
            const decryptedBuffer = await decryptData(encryptedBuffer, aesKey)

            const blob = new Blob([decryptedBuffer], { type: data.mime_type })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = data.name
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 100)
            return
          } catch (err) {
            console.error("Decryption failed for download:", err)
          }
        }

        const link = document.createElement("a")
        link.href = `data:${data.mime_type};base64,${data.encrypted_data}`
        link.download = data.name
        link.click()
      }
    } catch (error) {
      console.error("Failed to download file:", error)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const confirmMsg =
      item.section === "received"
        ? "Apakah Anda yakin ingin menghapus file ini dari daftar dibagikan? Anda akan kehilangan akses ke file ini."
        : "Apakah Anda yakin ingin membatalkan sharing file ini? Penerima akan kehilangan akses."

    const ok = await showConfirm("Konfirmasi", confirmMsg, {
      destructive: true,
    })
    if (!ok) return

    const token = localStorage.getItem("zipher_token")

    try {
      const url =
        item.section === "received"
          ? `${API_BASE}/api/v1/shared/received/${item.shareId}`
          : `${API_BASE}/api/v1/share/${item.shareId}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        setItems((items) => items.filter((i) => i.shareId !== item.shareId))
      }
    } catch (error) {
      console.error("Failed to revoke access:", error)
    }
  }

  function handleReport(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setReportingItem(item)
    setReportDialogOpen(true)
  }

  async function submitReport(reason: string) {
    if (!reportingItem) return
    const token = localStorage.getItem("zipher_token")
    const res = await fetch(`${API_BASE}/api/v1/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ share_id: reportingItem.shareId, reason }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || "Gagal mengirim laporan.")
    setReportedShareIds((prev) => new Set(prev).add(reportingItem.shareId))
  }

  const doSaveToMyFiles = async (
    id: string,
    name: string,
    privKey: CryptoKey
  ) => {
    setIsSaving(true)
    const token = localStorage.getItem("zipher_token")
    try {
      const dlRes = await axios.get(`${API_BASE}/api/v1/files/${id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = dlRes.data

      const rawAesKey = await decryptAESKey(data.aes_key_encrypted, privKey)

      const meRes = await fetch(`${API_BASE}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const meData = await meRes.json()
      const pubKey = await importPublicKey(meData.data.public_key)
      const newAesKeyEncrypted = await encryptAESKey(rawAesKey, pubKey)

      const encryptedBytes = Uint8Array.from(atob(data.encrypted_data), (c) =>
        c.charCodeAt(0)
      )
      const blob = new Blob([encryptedBytes], { type: data.mime_type })

      const formData = new FormData()
      formData.append("file", blob, name)
      formData.append("name", name)
      formData.append("mime_type", data.mime_type)
      formData.append("aes_key_encrypted", newAesKeyEncrypted)
      if (data.tags?.length) {
        formData.append(
          "tags",
          JSON.stringify(
            data.tags.map((t: any) => ({ name: t.name, score: t.score }))
          )
        )
      }

      await axios.post(`${API_BASE}/api/v1/files/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      window.dispatchEvent(new Event("contents-updated"))
    } catch (err) {
      console.error("Save to My Files failed:", err)
    } finally {
      setIsSaving(false)
      setPendingSave(null)
    }
  }

  const handleSaveToMyFiles = async (
    id: string,
    name: string,
    isFolder: boolean
  ) => {
    if (isFolder) return
    const privKey = await loadPrivateKey()
    if (!privKey) {
      setPendingSave({ id, name })
      setPrivateKeyDialogOpen(true)
      return
    }
    doSaveToMyFiles(id, name, privKey)
  }

  const decryptAndPreview = async (
    fileId: string,
    fileName: string,
    privKey: CryptoKey
  ) => {
    setIsOpening(true)
    setError(null)
    const token = localStorage.getItem("zipher_token")

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/files/${fileId}/download?intent=preview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        const jsonMatch = text.match(/\{.*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Format respons server tidak valid")
        }
      }

      if (!data || !data.encrypted_data || !data.aes_key_encrypted) {
        throw new Error(
          "Data file atau kunci enkripsi tidak ditemukan di server"
        )
      }

      let aesKeyStr: string
      try {
        aesKeyStr = await decryptAESKey(data.aes_key_encrypted, privKey)
      } catch (err) {
        throw new Error(
          "Private key tidak valid atau tidak cocok untuk file ini"
        )
      }

      const aesKey = await importAESKey(aesKeyStr)
      const encryptedBuffer = Uint8Array.from(atob(data.encrypted_data), (c) =>
        c.charCodeAt(0)
      ).buffer
      const decryptedBuffer = await decryptData(encryptedBuffer, aesKey)

      const blob = new Blob([decryptedBuffer], { type: data.mime_type })
      const url = URL.createObjectURL(blob)
      const content = isTextDecodable(data.mime_type, data.name)
        ? new TextDecoder().decode(decryptedBuffer)
        : undefined

      setPreviewItem({
        name: data.name,
        mimeType: data.mime_type,
        url,
        content,
      })
    } catch (err: any) {
      setError(err.message)
      showAlert("Error", err.message)
    } finally {
      setIsOpening(false)
    }
  }

  const filteredFiles = useMemo(() => {
    let filtered = [...items]

    if (fileFilter === "smallest") {
      filtered.sort((a, b) => a.sizeBytes - b.sizeBytes)
    } else if (fileFilter === "largest") {
      filtered.sort((a, b) => b.sizeBytes - a.sizeBytes)
    }

    return filtered
  }, [fileFilter, items])

  const receivedItems = useMemo(
    () =>
      filteredFiles
        .filter((i) => i.section === "received")
        .map((i) => ({ ...i, isReported: reportedShareIds.has(i.shareId) })),
    [filteredFiles, reportedShareIds]
  )
  const sentItems = useMemo(
    () => filteredFiles.filter((i) => i.section === "sent"),
    [filteredFiles]
  )

  const hasItems = items.length > 0

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 bg-background px-4 pb-4 md:-mx-6 md:px-6">
        <div className="mb-4 pt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Sharing</h1>
          <p className="text-sm text-muted-foreground">
            File yang dibagi dan diterima.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="ml-auto">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !hasItems ? (
        <div className="flex h-40 flex-col items-center justify-center">
          <p className="text-muted-foreground">Belum ada aktivitas sharing.</p>
        </div>
      ) : (
        <div className="space-y-8 pb-8">
          {/* Section: Diterima */}
          {receivedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Diterima
                </h2>
                <Separator />
              </div>

              {isListView ? (
                <FilesListTable
                  files={receivedItems}
                  activeFilter={fileFilter}
                  onFilterChange={setFileFilter}
                  showTrashActions={false}
                  showStarredView={false}
                  onOpen={handleOpen}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onMove={handleSaveToMyFiles}
                  onReport={handleReport}
                  moveLabel="Simpan ke File Saya"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {receivedItems.map((file) => (
                    <FileCard
                      key={`${file.id}-${file.shareId}`}
                      id={file.id}
                      name={file.name}
                      meta={file.meta}
                      updatedAt={file.updatedAt}
                      icon={file.icon}
                      iconClassName={file.iconClassName}
                      layout="grid"
                      isFolder={file.isFolder}
                      isStarred={file.isStarred}
                      onOpen={handleOpen}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      onMove={handleSaveToMyFiles}
                      onReport={handleReport}
                      isReported={file.isReported}
                      moveLabel="Simpan ke File Saya"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Dibagikan */}
          {sentItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Dibagikan
                </h2>
                <Separator />
              </div>

              {isListView ? (
                <FilesListTable
                  files={sentItems}
                  activeFilter={fileFilter}
                  onFilterChange={setFileFilter}
                  showTrashActions={false}
                  showStarredView={false}
                  onOpen={handleOpen}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  moveLabel="Move"
                  ownerLabel="Penerima"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {sentItems.map((file) => (
                    <FileCard
                      key={`${file.id}-${file.shareId}`}
                      id={file.id}
                      name={file.name}
                      meta={file.meta}
                      updatedAt={file.updatedAt}
                      icon={file.icon}
                      iconClassName={file.iconClassName}
                      layout="grid"
                      isFolder={file.isFolder}
                      isStarred={file.isStarred}
                      onOpen={handleOpen}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Mendekripsi file...</p>
          </div>
        </div>
      )}

      <PrivateKeyDialog
        open={privateKeyDialogOpen}
        onOpenChange={setPrivateKeyDialogOpen}
        onConfirm={async () => {
          const key = await loadPrivateKey()
          if (!key) return
          if (pendingSave) {
            doSaveToMyFiles(pendingSave.id, pendingSave.name, key)
          } else if (targetFile) {
            decryptAndPreview(targetFile.id, targetFile.name, key)
          }
        }}
      />

      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) {
            if (previewItem?.url?.startsWith("blob:"))
              URL.revokeObjectURL(previewItem.url)
            setPreviewItem(null)
          }
        }}
      >
        <DialogContent className="flex h-[90vh] flex-col overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="flex flex-none flex-row items-center justify-between space-y-0 border-b p-4">
            <div>
              <DialogTitle className="max-w-[300px] truncate md:max-w-md">
                {previewItem?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {previewItem?.mimeType}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/20 p-4">
            {previewItem && <FilePreviewContent previewItem={previewItem} />}
          </div>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        fileName={reportingItem?.name ?? ""}
        onSubmit={submitReport}
      />
    </section>
  )
}
