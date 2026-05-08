export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function checkResetEmail(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || "Email tidak ditemukan.")
}

export async function verifyResetKey(email: string, privateKey: string): Promise<void> {
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
