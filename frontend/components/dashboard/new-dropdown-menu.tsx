"use client"

import { useRef, useState } from "react"
import {
  ChevronDown,
  FileUp,
  FolderPlus,
  FolderUp,
  Loader2,
} from "lucide-react"

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

export function NewDropdownMenu({ currentFolderId }: { currentFolderId?: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return

    setIsUploading(true)
    setIsFolderDialogOpen(false)
    const token = localStorage.getItem("zipher_token")

    try {
      const response = await fetch("http://localhost:8000/api/v1/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ 
          name: newFolderName,
          parent_id: currentFolderId || null
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
      alert(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const token = localStorage.getItem("zipher_token")

    try {
      let targetFolderId: string | null = currentFolderId || null

      if (files[0].webkitRelativePath && files[0].webkitRelativePath.includes("/")) {
        const rootFolderName = files[0].webkitRelativePath.split("/")[0]
        
        const folderResponse = await fetch("http://localhost:8000/api/v1/folders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ 
            name: rootFolderName,
            parent_id: currentFolderId || null
          }),
        })

        const folderData = await folderResponse.json()
        if (folderResponse.ok) {
          targetFolderId = folderData.data.id
        } else {
          throw new Error(folderData.message || "Gagal membuat folder untuk upload")
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Cek ukuran file (Limit 512MB sesuai backend)
        const MAX_FILE_SIZE = 512 * 1024 * 1024 // 512MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.name} terlalu besar (Maksimal 512MB)`)
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("name", file.name)
        formData.append("mime_type", file.type || "application/octet-stream")
        formData.append("aes_key_encrypted", "placeholder_encrypted_key")
        
        if (targetFolderId) {
          formData.append("folder_id", targetFolderId)
        }
        
        const response = await fetch("http://localhost:8000/api/v1/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || `Failed to upload ${file.name}`)
        }
      }

      window.dispatchEvent(new Event("contents-updated"))
    } catch (error: any) {
      alert(`Upload gagal: ${error.message}`)
    } finally {
      setIsUploading(false)
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
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        onChange={(e) => uploadFiles(e.target.files)}
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
            New Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-4" />
            Upload File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
            <FolderUp className="size-4" />
            Upload Folder
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
              <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
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
