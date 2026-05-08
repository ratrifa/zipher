"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type UploadProgress = {
  fileName: string
  progress: number // Overall progress (0-100)
  currentFileIndex: number
  totalFiles: number
  isUploading: boolean
}

type UploadContextType = {
  uploadState: UploadProgress
  setUploadState: (state: UploadProgress) => void
  abortController: AbortController | null
  setAbortController: (controller: AbortController | null) => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    fileName: "",
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    isUploading: false,
  })
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  return (
    <UploadContext.Provider value={{ uploadState, setUploadState, abortController, setAbortController }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider")
  }
  return context
}
