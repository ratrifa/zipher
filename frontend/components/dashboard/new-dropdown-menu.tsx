"use client"

import { API_BASE } from "@/lib/api"
import { useRef, useState } from "react"
import {
  ChevronDown,
  FileUp,
  FolderPlus,
  FolderUp,
  Loader2,
} from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractTextFromFile } from "@/lib/utils/extractors/text-extractor"
import { extractKeywords, extractTags } from "@/lib/utils/tfidf"
import { useUpload } from "@/hooks/use-upload"
import { useAppDialog } from "@/hooks/use-app-dialog"
import {
  generateAESKey,
  exportAESKey,
  importPublicKey,
  encryptAESKey,
  encryptData,
} from "@/lib/crypto"

export function NewDropdownMenu({
  currentFolderId,
}: {
  currentFolderId?: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null)

  const { setUploadState, setAbortController } = useUpload()
  const { showAlert } = useAppDialog()
  const folderCache = useRef<Record<string, string>>({})

  async function fetchUserPublicKey(token: string) {
    if (userPublicKey) return userPublicKey
    try {
      const response = await fetch(`${API_BASE}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = await response.json()
      if (data.success && data.data.public_key) {
        setUserPublicKey(data.data.public_key)
        return data.data.public_key
      }
    } catch (error) {
      console.error("Failed to fetch public key:", error)
    }
    return null
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return

    setIsUploading(true)
    setIsFolderDialogOpen(false)
    const token = localStorage.getItem("zipher_token")

    try {
      const response = await fetch(`${API_BASE}/api/v1/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: newFolderName,
          parent_id: currentFolderId || null,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
        setNewFolderName("")
      } else {
        throw new Error(data.message || "Gagal membuat folder")
      }
    } catch (error: any) {
      showAlert("Gagal", error.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function getOrCreateFolderCached(
    pathParts: string[],
    baseParentId: string | null,
    token: string,
    signal: AbortSignal
  ): Promise<string | null> {
    let currentParentId = baseParentId

    for (const part of pathParts) {
      const cacheKey = `${currentParentId}_${part}`
      if (folderCache.current[cacheKey]) {
        currentParentId = folderCache.current[cacheKey]
        continue
      }

      const response = await fetch(`${API_BASE}/api/v1/folders`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: part,
          parent_id: currentParentId,
        }),
      })

      const data = await response.json()
      if (response.ok || response.status === 200) {
        if (!data.data?.id) {
          throw new Error("Folder ID tidak ditemukan dalam response")
        }
        currentParentId = data.data.id as string
        folderCache.current[cacheKey] = currentParentId
      } else {
        throw new Error(data.message || `Gagal membuat folder: ${part}`)
      }
    }
    return currentParentId
  }

  async function processUpload(files: FileList | null, isFolder: boolean) {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const token = localStorage.getItem("zipher_token")

    const totalFiles = files.length
    let totalBytes = 0
    const fileArray = Array.from(files)
    for (const f of fileArray) totalBytes += f.size

    const controller = new AbortController()
    setAbortController(controller)

    const CONCURRENCY_LIMIT = 50
    let currentIndex = 0
    let totalFinished = 0
    const fileUploadedBytes = new Array(totalFiles).fill(0)

    const updateGlobalProgress = (activeFileName: string) => {
      const currentUploadedTotal = fileUploadedBytes.reduce((a, b) => a + b, 0)
      const overallPercent = (currentUploadedTotal / (totalBytes || 1)) * 100

      setUploadState({
        fileName: activeFileName,
        progress: Math.min(overallPercent, 100),
        currentFileIndex: totalFinished,
        totalFiles: totalFiles,
        isUploading: true,
      })
    }

    const uploadNext = async (): Promise<void> => {
      if (currentIndex >= totalFiles || controller.signal.aborted) return

      const i = currentIndex++
      const file = fileArray[i]
      const path = file.webkitRelativePath || ""
      let targetFolderId: string | null = currentFolderId || null

      try {
        if (isFolder && path.includes("/")) {
          const pathParts = path.split("/")
          pathParts.pop()
          targetFolderId = await getOrCreateFolderCached(
            pathParts,
            currentFolderId || null,
            token || "",
            controller.signal
          )
        }

        const MAX_FILE_SIZE = 1024 * 1024 * 1024
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} terlalu besar (Maksimal 1GB)`)
        }

        const pubKeyPem = await fetchUserPublicKey(token || "")
        if (!pubKeyPem) {
          throw new Error("Gagal mengambil kunci publik untuk enkripsi")
        }
        const pubKey = await importPublicKey(pubKeyPem)

        let autoTags: Array<{ name: string; score: number }> = []
        let autoKeywords: string[] = []
        if (file.size > 2048) {
          const textContent = await extractTextFromFile(file)
          if (textContent) {
            autoTags = extractTags(textContent)
            autoKeywords = extractKeywords(textContent)
          }
        }

        const aesKey = await generateAESKey()
        const exportedAesKey = await exportAESKey(aesKey)

        const aesKeyEncrypted = await encryptAESKey(exportedAesKey, pubKey)

        const fileBuffer = await file.arrayBuffer()
        const encryptedFileBuffer = await encryptData(fileBuffer, aesKey)
        const encryptedFile = new File([encryptedFileBuffer], file.name, {
          type: file.type || "application/octet-stream",
        })

        const formData = new FormData()
        formData.append("file", encryptedFile)
        formData.append("name", file.name)
        formData.append("mime_type", file.type || "application/octet-stream")
        formData.append("aes_key_encrypted", aesKeyEncrypted)

        if (autoTags.length > 0)
          formData.append("tags", JSON.stringify(autoTags))
        if (autoKeywords.length > 0)
          formData.append("keywords", JSON.stringify(autoKeywords))
        if (targetFolderId) formData.append("folder_id", targetFolderId)

        await axios.post(`${API_BASE}/api/v1/files/upload`, formData, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            fileUploadedBytes[i] = progressEvent.loaded
            updateGlobalProgress(file.name)
          },
        })

        totalFinished++
        updateGlobalProgress(file.name)
        return uploadNext()
      } catch (error: any) {
        if (axios.isCancel(error) || error.name === "AbortError") return

        console.error(`Failed to upload ${file.name}:`, error)
        fileUploadedBytes[i] = file.size
        totalFinished++
        updateGlobalProgress(file.name)
        return uploadNext()
      }
    }

    try {
      const workers = []
      for (
        let w = 0;
        workers.length < Math.min(CONCURRENCY_LIMIT, totalFiles);
        w++
      ) {
        workers.push(uploadNext())
      }

      await Promise.all(workers)
      window.dispatchEvent(new Event("contents-updated"))
    } catch (error: any) {
      if (error.name !== "AbortError")
        showAlert("Upload Selesai", "Upload selesai dengan beberapa kendala.")
    } finally {
      setIsUploading(false)
      setAbortController(null)
      setUploadState({
        fileName: "",
        progress: 0,
        currentFileIndex: 0,
        totalFiles: 0,
        isUploading: false,
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (folderInputRef.current) folderInputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={(e) => processUpload(e.target.files, false)}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        onChange={(e) => processUpload(e.target.files, true)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-9 gap-1.5 px-3 text-sm" disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                New
                <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)}>
            <FolderPlus className="size-4" />
            Folder Baru
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-4" />
            Unggah File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
            <FolderUp className="size-4" />
            Unggah Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>Buat Folder Baru</DialogTitle>
              <DialogDescription>
                Masukkan nama untuk folder baru Anda di sini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFolderDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!newFolderName.trim()}>
                Buat Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
