"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { File as FileIcon } from "lucide-react"

export type PreviewItem = {
  name: string
  url: string
  mimeType: string
  content?: string
  tags?: any[]
}

function isJsonType(mimeType: string, name: string) {
  return mimeType === "application/json" || name.toLowerCase().endsWith(".json")
}

function isMarkdownType(mimeType: string, name: string) {
  return (
    mimeType === "text/markdown" ||
    mimeType === "text/x-markdown" ||
    name.toLowerCase().endsWith(".md")
  )
}

export function isTextDecodable(mimeType: string, name: string) {
  return isJsonType(mimeType, name) || isMarkdownType(mimeType, name)
}

export function FilePreviewContent({
  previewItem,
}: {
  previewItem: PreviewItem
}) {
  const { mimeType, name, url, content } = previewItem

  if (mimeType.startsWith("image/")) {
    return <img src={url} alt={name} className="h-full w-full object-contain" />
  }

  if (isMarkdownType(mimeType, name) && content) {
    return (
      <div className="markdown-preview h-full w-full overflow-auto bg-white p-6 text-sm leading-relaxed text-gray-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  if (isJsonType(mimeType, name) && content) {
    let pretty = content
    try {
      pretty = JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      // keep raw if invalid JSON
    }
    return (
      <div className="h-full w-full overflow-auto bg-[#1e1e1e] p-4">
        <pre className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-green-300">
          {pretty}
        </pre>
      </div>
    )
  }

  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return (
      <iframe
        src={url}
        className="h-full min-h-[60vh] w-full border-none bg-white"
        title={name}
      />
    )
  }

  return (
    <div className="p-8 text-center">
      <FileIcon className="mx-auto mb-4 size-16 text-muted-foreground opacity-20" />
      <p className="font-medium text-muted-foreground">
        Preview tidak tersedia untuk tipe file ini.
      </p>
    </div>
  )
}
