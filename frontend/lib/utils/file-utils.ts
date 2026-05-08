import {
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  File as FileIcon,
  type LucideIcon,
} from "lucide-react"

export function getIcon(mimeType: string, isFolder: boolean, fileName: string = ""): typeof LucideIcon {
  if (isFolder) return Folder

  const lowerName = fileName.toLowerCase()
  const isCode =
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".ts") ||
    lowerName.endsWith(".tsx") ||
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".py") ||
    lowerName.endsWith(".json") ||
    mimeType?.includes("javascript") ||
    mimeType?.includes("typescript") ||
    mimeType?.includes("markdown")

  if (isCode) return FileCode2
  if (mimeType.includes("image")) return FileImage
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return FileSpreadsheet
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return Presentation
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("officedocument.wordprocessingml") ||
    mimeType.includes("text")
  )
    return FileText
  return FileIcon
}

export function getIconClassName(mimeType: string, isFolder: boolean, fileName: string = ""): string {
  if (isFolder) return "bg-blue-100 text-blue-700"

  const lowerName = fileName.toLowerCase()
  const isCode =
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".ts") ||
    lowerName.endsWith(".tsx") ||
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".py") ||
    lowerName.endsWith(".json") ||
    mimeType?.includes("javascript") ||
    mimeType?.includes("typescript") ||
    mimeType?.includes("markdown")

  if (isCode) return "bg-slate-100 text-slate-700"
  if (mimeType?.includes("image")) return "bg-violet-100 text-violet-700"
  if (
    mimeType?.includes("spreadsheet") ||
    mimeType?.includes("excel") ||
    mimeType?.includes("csv")
  )
    return "bg-emerald-100 text-emerald-700"
  if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint"))
    return "bg-rose-100 text-rose-700"
  if (mimeType?.includes("pdf")) return "bg-orange-100 text-orange-700"
  if (
    mimeType?.includes("word") ||
    mimeType?.includes("officedocument.wordprocessingml")
  )
    return "bg-sky-100 text-sky-700"
  if (mimeType?.includes("text")) return "bg-slate-100 text-slate-700"
  return "bg-slate-100 text-slate-700"
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
