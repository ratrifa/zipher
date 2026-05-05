"use client"

import { useMemo, useState, useEffect } from "react"
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
} from "lucide-react"

import { FileCard } from "@/components/dashboard/file-card"
import { FileLayoutSwitch } from "@/components/dashboard/file-layout-switch"
import {
  FilesListTable,
  type FileFilterOption,
} from "@/components/dashboard/files-list-table"
import { NewDropdownMenu } from "@/components/dashboard/new-dropdown-menu"
import { Button } from "@/components/ui/button"
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

function getIcon(mimeType: string, isFolder: boolean) {
  if (isFolder) return Folder
  if (mimeType.includes("image")) return FileImage
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet
  if (mimeType.includes("pdf") || mimeType.includes("text") || mimeType.includes("word")) return FileText
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation
  return FileIcon
}

function getIconClassName(mimeType: string, isFolder: boolean) {
  if (isFolder) return "bg-blue-100 text-blue-700"
  if (mimeType.includes("image")) return "bg-violet-100 text-violet-700"
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "bg-emerald-100 text-emerald-700"
  if (mimeType.includes("pdf") || mimeType.includes("text") || mimeType.includes("word")) return "bg-orange-100 text-orange-700"
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "bg-rose-100 text-rose-700"
  return "bg-slate-100 text-slate-700"
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function MyFilesSection() {
  const [isListView, setIsListView] = useState(false)
  const [fileFilter, setFileFilter] = useState<FileFilterOption>("none")
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("User")
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([])
  
  const [renameItem, setRenameConfirm] = useState<{ id: string, name: string, isFolder: boolean } | null>(null)
  const [newName, setNewName] = useState("")

  const [moveItem, setMoveItem] = useState<{ id: string, name: string, isFolder: boolean } | null>(null)
  const [moveTargetFolders, setMoveTargetFolders] = useState<any[]>([])
  const [moveCurrentFolderId, setMoveCurrentFolderId] = useState<string | null>(null)
  const [moveFolderStack, setMoveFolderStack] = useState<{id: string, name: string}[]>([])
  const [isMoving, setIsMoving] = useState(false)

  const [previewItem, setPreviewItem] = useState<{name: string, url: string, mimeType: string} | null>(null)

  const fetchContents = async () => {
    const token = localStorage.getItem("zipher_token")
    if (!token) return

    setIsLoading(true)
    try {
      const url = currentFolderId 
        ? `http://localhost:8000/api/v1/contents?folder_id=${currentFolderId}`
        : "http://localhost:8000/api/v1/contents"

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = await response.json()
      if (data.success) {
        const formattedItems = data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          meta: item.type === "folder" ? `Folder • ${item.items_count || 0} items` : `${item.mime_type} • ${formatBytes(item.size)}`,
          updatedAt: formatDate(item.updated_at),
          owner: "You",
          size: item.type === "folder" ? "-" : formatBytes(item.size),
          sizeBytes: item.size || 0,
          icon: getIcon(item.mime_type || "", item.type === "folder"),
          iconClassName: getIconClassName(item.mime_type || "", item.type === "folder"),
          isFolder: item.type === "folder",
          isStarred: item.is_starred,
          parentId: item.type === "folder" ? item.parent_id : item.folder_id,
        }))
        setItems(formattedItems)      }
    } catch (error) {
      console.error("Failed to fetch contents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("zipher_user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.username || "User")
    }

    fetchContents()

    const handleUpdate = () => fetchContents()
    window.addEventListener("contents-updated", handleUpdate)
    return () => window.removeEventListener("contents-updated", handleUpdate)
  }, [currentFolderId])

  useEffect(() => {
    if (!moveItem) return

    const fetchMoveTargetFolders = async () => {
        const token = localStorage.getItem("zipher_token")
        try {
            const url = moveCurrentFolderId 
                ? `http://localhost:8000/api/v1/folders?parent_id=${moveCurrentFolderId}`
                : "http://localhost:8000/api/v1/folders"
            
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })
            const data = await response.json()
            if (data.success) {
                setMoveTargetFolders(data.data.filter((f: any) => f.id !== moveItem.id))
            }
        } catch (error) {
            console.error("Failed to fetch target folders:", error)
        }
    }

    fetchMoveTargetFolders()
  }, [moveItem, moveCurrentFolderId])

  const handleMoveSubmit = async () => {
    if (!moveItem) return
    setIsMoving(true)

    const token = localStorage.getItem("zipher_token")
    try {
        const response = await fetch("http://localhost:8000/api/v1/contents/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            body: JSON.stringify({
                file_ids: moveItem.isFolder ? [] : [moveItem.id],
                folder_ids: moveItem.isFolder ? [moveItem.id] : [],
                target_folder_id: moveCurrentFolderId,
            }),
        })

        if (response.ok) {
            window.dispatchEvent(new Event("contents-updated"))
            setMoveItem(null)
            setMoveCurrentFolderId(null)
            setMoveFolderStack([])
        } else {
            const err = await response.json()
            alert(err.message || "Gagal memindahkan item")
        }
    } catch (error) {
        console.error("Failed to move item:", error)
    } finally {
        setIsMoving(false)
    }
  }

  const filteredFiles = useMemo(() => {
    const next = [...items]

    if (fileFilter === "smallest") {
      next.sort((a, b) => a.sizeBytes - b.sizeBytes)
      return next
    }

    if (fileFilter === "largest") {
      next.sort((a, b) => b.sizeBytes - a.sizeBytes)
      return next
    }

    if (fileFilter === "folder-first") {
      next.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name)
        return a.isFolder ? -1 : 1
      })
      return next
    }

    return items
  }, [fileFilter, items])

  const handleDelete = async (id: string, isFolder: boolean) => {
    const token = localStorage.getItem("zipher_token")
    const endpoint = isFolder ? `folders/${id}` : `files/${id}`
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const handleToggleStar = async (id: string) => {
    const token = localStorage.getItem("zipher_token")
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/${id}/star`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
      }
    } catch (error) {
      console.error("Failed to toggle star:", error)
    }
  }

  const handleFolderClick = (id: string, name: string) => {
    setFolderStack([...folderStack, { id, name }])
    setCurrentFolderId(id)
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setFolderStack([])
      setCurrentFolderId(null)
    } else {
      const newStack = folderStack.slice(0, index + 1)
      setFolderStack(newStack)
      setCurrentFolderId(newStack[newStack.length - 1].id)
    }
  }

  const handleRenameClick = (id: string, currentName: string, isFolder: boolean) => {
    const nameOnly = isFolder ? currentName : currentName.replace(/\.[^/.]+$/, "")
    setRenameConfirm({ id, name: currentName, isFolder })
    setNewName(nameOnly)
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameItem || !newName.trim()) return

    const token = localStorage.getItem("zipher_token")
    const endpoint = renameItem.isFolder ? `folders/${renameItem.id}` : `files/${renameItem.id}`
    
    let finalName = newName.trim()
    if (!renameItem.isFolder) {
      const extension = renameItem.name.split('.').pop()
      finalName = extension ? `${finalName}.${extension}` : finalName
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ name: finalName }),
      })

      if (response.ok) {
        window.dispatchEvent(new Event("contents-updated"))
        setRenameConfirm(null)
      } else {
        const data = await response.json()
        alert(data.message || "Gagal mengubah nama")
      }
    } catch (error) {
      console.error("Failed to rename:", error)
    }
  }

  const handleDownload = async (id: string, name: string) => {
    const token = localStorage.getItem("zipher_token")
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/${id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = await response.json()
      
      if (data.name) {
          const link = document.createElement('a')
          link.href = `data:${data.mime_type};base64,${data.encrypted_data}`
          link.download = data.name
          link.click()
      }
    } catch (error) {
      console.error("Failed to download file:", error)
    }
  }

  const handleOpen = async (id: string, name: string, isFolder: boolean) => {
    if (isFolder) {
      handleFolderClick(id, name)
    } else {
      const token = localStorage.getItem("zipher_token")
      try {
        const response = await fetch(`http://localhost:8000/api/v1/files/${id}/download`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        const data = await response.json()
        
        if (data.name) {
            setPreviewItem({
                name: data.name,
                mimeType: data.mime_type,
                url: `data:${data.mime_type};base64,${data.encrypted_data}`
            })
        }
      } catch (error) {
        console.error("Failed to open file:", error)
      }
    }
  }

  return (
    <section>
      <div className="sticky top-0 z-30 -mx-4 h-20 bg-background px-4 md:-mx-6 md:px-6">
        <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <nav className="flex items-center text-sm font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
              <button 
                onClick={() => handleBreadcrumbClick(-1)}
                className={`transition-colors hover:text-foreground p-1 rounded ${currentFolderId ? "text-muted-foreground" : "text-xl font-semibold tracking-tight text-foreground"}`}
              >
                My Files
              </button>
              
              {folderStack.map((folder, index) => (
                <div key={folder.id} className="flex items-center">
                  <span className="mx-2 text-muted-foreground">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`transition-colors hover:text-foreground truncate max-w-[150px] p-1 rounded ${index === folderStack.length - 1 ? "text-xl font-semibold tracking-tight text-foreground" : "text-muted-foreground"}`}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <FileLayoutSwitch
              isList={isListView}
              onCheckedChange={setIsListView}
            />
            <NewDropdownMenu currentFolderId={currentFolderId} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <p className="text-muted-foreground">Folder ini kosong</p>
        </div>
      ) : isListView ? (
        <FilesListTable
          files={filteredFiles}
          activeFilter={fileFilter}
          onFilterChange={setFileFilter}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onFolderClick={handleFolderClick}
          onRename={handleRenameClick}
          onMove={(id, name, isFolder) => setMoveItem({ id, name, isFolder })}
          onOpen={handleOpen}
          onDownload={handleDownload}
        />
      ) : (
        <div className=" grid gap-4 pt-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              id={file.id}
              name={file.name}
              meta={file.meta}
              updatedAt={file.updatedAt}
              icon={file.icon}
              iconClassName={file.iconClassName}
              layout="grid"
              isFolder={file.isFolder}
              isStarred={file.isStarred}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onFolderClick={file.isFolder ? () => handleFolderClick(file.id, file.name) : undefined}
              onRename={handleRenameClick}
              onMove={(id, name, isFolder) => setMoveItem({ id, name, isFolder })}
              onOpen={handleOpen}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Ubah Nama {renameItem?.isFolder ? 'Folder' : 'File'}</DialogTitle>
              <DialogDescription>
                Masukkan nama baru untuk item ini. {renameItem?.isFolder ? '' : 'Ekstensi file akan tetap dipertahankan.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="rename">Nama Baru</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rename"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  {!renameItem?.isFolder && (
                    <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded border">
                      .{renameItem?.name.split('.').pop()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameConfirm(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={!newName.trim()}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={!!moveItem} onOpenChange={(open) => {
          if (!open) {
              setMoveItem(null)
              setMoveCurrentFolderId(null)
              setMoveFolderStack([])
          }
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pindahkan {moveItem?.isFolder ? 'Folder' : 'File'}</DialogTitle>
              <DialogDescription>
                Pilih folder tujuan untuk <strong>{moveItem?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 rounded-md border border-border">
                <div className="flex items-center gap-2 border-b p-2 bg-muted/30">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => {
                            setMoveCurrentFolderId(null)
                            setMoveFolderStack([])
                        }}
                    >
                        <Home className="size-4 mr-1" />
                        My Files
                    </Button>
                    {moveFolderStack.map((f, i) => (
                        <div key={f.id} className="flex items-center">
                            <ChevronRight className="size-3 text-muted-foreground" />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 max-w-[100px] truncate"
                                onClick={() => {
                                    const newStack = moveFolderStack.slice(0, i + 1)
                                    setMoveFolderStack(newStack)
                                    setMoveCurrentFolderId(f.id)
                                }}
                            >
                                {f.name}
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {moveTargetFolders.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">Tidak ada folder di sini</p>
                    ) : (
                        moveTargetFolders.map((f) => (
                            <button
                                key={f.id}
                                className="flex w-full items-center gap-2 rounded-sm p-2 text-sm hover:bg-muted text-left"
                                onClick={() => {
                                    setMoveCurrentFolderId(f.id)
                                    setMoveFolderStack([...moveFolderStack, { id: f.id, name: f.name }])
                                }}
                            >
                                <Folder className="size-4 text-blue-500" />
                                <span className="flex-1 truncate">{f.name}</span>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setMoveItem(null)}>
                Batal
              </Button>
              <Button 
                onClick={handleMoveSubmit} 
                disabled={isMoving || (moveCurrentFolderId === (items.find(i => i.id === moveItem?.id)?.parentId || null))}
              >
                Pindahkan ke Sini
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div>
                <DialogTitle className="truncate max-w-[300px] md:max-w-md">{previewItem?.name}</DialogTitle>
                <DialogDescription className="text-xs">{previewItem?.mimeType}</DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center min-h-[300px]">
            {previewItem?.mimeType.startsWith('image/') ? (
                <img 
                    src={previewItem.url} 
                    alt={previewItem.name} 
                    className="max-w-full max-h-full object-contain shadow-sm" 
                />
            ) : previewItem?.mimeType === 'application/pdf' || previewItem?.mimeType.startsWith('text/') ? (
                <iframe 
                    src={previewItem.url} 
                    className="w-full h-full min-h-[60vh] border-none bg-white"
                    title={previewItem.name}
                />
            ) : (
                <div className="text-center p-8">
                    <FileIcon className="size-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">Pratinjau tidak tersedia untuk tipe file ini.</p>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
