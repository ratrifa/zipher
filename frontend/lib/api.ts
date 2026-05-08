export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// Auth Types
export type AuthUser = {
  id: string
  username: string
  email: string
  avatar?: string
  public_key?: string
}

export type AuthSession = {
  user: AuthUser
  token: string
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
}

// Auth Functions
export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Gagal mengambil data user.")
  return json.data
}

export async function loginUser(payload: LoginPayload): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/api/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Login gagal.")
  return { user: json.data.user, token: json.data.token }
}

export async function registerUser(
  payload: RegisterPayload
): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Registrasi gagal.")
  return { user: json.data.user, token: json.data.token }
}

export async function logoutUser(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.message || "Logout gagal.")
  }
}

export async function checkResetEmail(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Email tidak ditemukan.")
}

export async function verifyResetKey(
  email: string,
  privateKey: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/verify-reset-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, private_key: privateKey }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Kunci privat tidak valid.")
}

export async function resetPassword(data: {
  email: string
  private_key: string
  password: string
  password_confirmation: string
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Reset password gagal.")
}
