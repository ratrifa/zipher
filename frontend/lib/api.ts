export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api/v1"

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message?: string
}

export type AuthUser = {
  id: string
  username: string
  email: string
  public_key?: string
}

export type AuthSession = {
  user: AuthUser
  token: string
}

export type FileRecord = {
  id: string
  name: string
  size: number
  mime_type: string
  storage_path: string
  aes_key_encrypted: string
  user_id: string
  folder_id: string | null
  created_at: string
  updated_at: string
}

export type FolderRecord = {
  id: string
  name: string
  user_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

export type SharedFileRecord = {
  id: string
  file_id: string
  owner_id: string
  receiver_id: string
  aes_key_encrypted_for_receiver: string
  shared_at: string
  file?: FileRecord
  owner?: Pick<AuthUser, "id" | "username" | "email">
  receiver?: Pick<AuthUser, "id" | "username" | "email">
}

export type DownloadedFilePayload = {
  aes_key_encrypted: string
  encrypted_data: string
  name: string
  mime_type: string
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

function toQueryString(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value)
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  headers.set("Accept", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...options,
    headers,
  })

  const textBody = await response.text()
  let body: unknown = null

  if (textBody) {
    try {
      body = JSON.parse(textBody)
    } catch {
      body = textBody
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: string }).message)
        : `Request failed with status ${response.status}`

    throw new ApiError(message, response.status, body)
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as { success: boolean }).success === false
  ) {
    const message =
      "message" in body && typeof (body as { message?: unknown }).message === "string"
        ? ((body as { message?: string }).message ?? "Unknown API error")
        : "Unknown API error"

    throw new ApiError(message, response.status, body)
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "data" in body
  ) {
    return (body as ApiEnvelope<T>).data
  }

  return body as T
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  password_confirmation: string
  public_key: string
}

export function loginUser(payload: LoginPayload) {
  return request<AuthSession>("login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function registerUser(payload: RegisterPayload) {
  return request<AuthSession>("register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(token: string) {
  return request<AuthUser>("me", { method: "GET" }, token)
}

export function logoutUser(token: string) {
  return request<{ message: string }>("logout", { method: "POST" }, token)
}

export function searchUsers(token: string, query?: string) {
  const suffix = toQueryString({ q: query })
  return request<AuthUser[]>(`users/search${suffix}`, { method: "GET" }, token)
}

export function getUserPublicKey(token: string, userId: string) {
  return request<AuthUser>(`users/${userId}/public-key`, { method: "GET" }, token)
}

export function listFiles(token: string, folderId?: string | null) {
  const suffix = toQueryString({ folder_id: folderId ?? undefined })
  return request<FileRecord[]>(`files${suffix}`, { method: "GET" }, token)
}

export type UploadFilePayload = {
  file: File
  folderId?: string | null
  name?: string
  mimeType?: string
  aesKeyEncrypted: string
}

export function uploadFile(token: string, payload: UploadFilePayload) {
  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name ?? payload.file.name)
  formData.append(
    "mime_type",
    (payload.mimeType ?? payload.file.type) || "application/octet-stream"
  )
  formData.append("aes_key_encrypted", payload.aesKeyEncrypted)

  if (payload.folderId) {
    formData.append("folder_id", payload.folderId)
  }

  return request<FileRecord>(
    "files/upload",
    {
      method: "POST",
      body: formData,
    },
    token
  )
}

export function downloadFile(token: string, fileId: string) {
  return request<DownloadedFilePayload>(`files/${fileId}/download`, { method: "GET" }, token)
}

export type UpdateFilePayload = {
  name?: string
  folder_id?: string | null
}

export function updateFile(token: string, fileId: string, payload: UpdateFilePayload) {
  return request<FileRecord>(
    `files/${fileId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  )
}

export function deleteFile(token: string, fileId: string) {
  return request<{ message: string }>(`files/${fileId}`, { method: "DELETE" }, token)
}

export function listFolders(token: string, parentId?: string | null) {
  const suffix = toQueryString({ parent_id: parentId ?? undefined })
  return request<FolderRecord[]>(`folders${suffix}`, { method: "GET" }, token)
}

export type CreateFolderPayload = {
  name: string
  parent_id?: string | null
}

export function createFolder(token: string, payload: CreateFolderPayload) {
  return request<FolderRecord>(
    "folders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export type UpdateFolderPayload = {
  name?: string
  parent_id?: string | null
}

export function updateFolder(
  token: string,
  folderId: string,
  payload: UpdateFolderPayload
) {
  return request<FolderRecord>(
    `folders/${folderId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token
  )
}

export function deleteFolder(token: string, folderId: string) {
  return request<{ message: string }>(`folders/${folderId}`, { method: "DELETE" }, token)
}

export type ShareFilePayload = {
  file_id: string
  receiver_id: string
  aes_key_encrypted_for_receiver: string
}

export function shareFile(token: string, payload: ShareFilePayload) {
  return request<SharedFileRecord>(
    "share",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export function getSharedWithMe(token: string) {
  return request<SharedFileRecord[]>("shared/with-me", { method: "GET" }, token)
}

export function getSharedByMe(token: string) {
  return request<SharedFileRecord[]>("shared/by-me", { method: "GET" }, token)
}

export function revokeShare(token: string, shareId: string) {
  return request<{ message: string }>(`share/${shareId}`, { method: "DELETE" }, token)
}

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
