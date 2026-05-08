"use client"

import { API_BASE } from "@/lib/api"
import { useState, useEffect, useRef } from "react"
import {
  Mail,
  Camera,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { ProfileSettingRow } from "@/components/dashboard/profile-setting-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [activeModal, setActiveModal] = useState<
    "foto" | "nama" | "email" | "password" | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("zipher_user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    fetchUser()
  }, [])

  async function fetchUser() {
    const token = localStorage.getItem("zipher_token")
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.data)
        localStorage.setItem("zipher_user", JSON.stringify(data.data))
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload: any = {}
    if (activeModal === "nama") payload.username = formData.get("username")
    if (activeModal === "email") payload.email = formData.get("email")

    try {
      const token = localStorage.getItem("zipher_token")
      const response = await fetch(`${API_BASE}/api/v1/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.message || "Gagal memperbarui profil")

      await fetchUser()
      window.dispatchEvent(new Event("user-updated"))
      setActiveModal(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const current_password = formData.get("current_password") as string
    const password = formData.get("password") as string
    const password_confirmation = formData.get(
      "password_confirmation"
    ) as string

    try {
      const token = localStorage.getItem("zipher_token")
      const response = await fetch(`${API_BASE}/api/v1/profile/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          current_password,
          password,
          password_confirmation,
        }),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.message || "Gagal mengganti password")

      setActiveModal(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const token = localStorage.getItem("zipher_token")
      const response = await fetch(`${API_BASE}/api/v1/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.message || "Gagal mengunggah avatar")

      await fetchUser()
      window.dispatchEvent(new Event("user-updated"))
      setActiveModal(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const avatarUrl = user?.avatar ? `${API_BASE}/storage/${user.avatar}` : null
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "ZA"

  return (
    <DashboardShell>
      <div className="relative mx-auto mb-8 w-full max-w-2xl space-y-6 px-3 py-4 sm:px-4 sm:py-6 md:mb-12 md:space-y-8 md:px-0 md:pt-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Profile</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Atur informasi akun, keamanan, dan perangkat yang terhubung.
          </p>
        </div>

        <ProfileSection
          title="Informasi Akun"
          description="Perbarui foto profil, nama, dan email."
        >
          <div className="space-y-0">
            <ProfileSettingRow
              title="Foto profil"
              value={
                <Avatar className="size-10 bg-slate-100 sm:size-14">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500 sm:text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              }
              actionLabel="Ganti foto"
              onAction={() => setActiveModal("foto")}
            />

            <ProfileSettingRow
              title="Username"
              value={
                <span className="text-xs font-medium text-white sm:text-[15px]">
                  {user?.username || "..."}
                </span>
              }
              actionLabel="Ganti nama"
              onAction={() => setActiveModal("nama")}
            />

            <ProfileSettingRow
              title="Email"
              value={
                <span className="inline-flex items-center gap-2 text-xs font-medium text-white sm:text-[15px]">
                  <Mail className="size-3 text-slate-500 sm:size-4" />
                  {user?.email || "..."}
                </span>
              }
              actionLabel="Ganti email"
              onAction={() => setActiveModal("email")}
            />
          </div>
        </ProfileSection>

        <ProfileSection title="Security" description="Kelola password akun.">
          <div id="security" className="space-y-0">
            <ProfileSettingRow
              title="Password"
              actionLabel="Ganti password"
              onAction={() => setActiveModal("password")}
            />
          </div>
        </ProfileSection>
      </div>

      {/* Modals Overlay - More Responsive */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          {/* Modal Background Click to Close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setActiveModal(null)}
          />

          <div className="relative z-10 w-full max-w-md max-h-[90vh] animate-in rounded-xl bg-white p-4 shadow-xl duration-200 zoom-in-95 fade-in overflow-y-auto sm:p-6">
            {/* Content: Ganti Foto */}
            {activeModal === "foto" && (
              <div className="flex flex-col gap-4 sm:gap-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    Ganti Foto Profil
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Unggah foto baru untuk profil Anda.
                  </p>
                </div>
                {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
                <div className="flex justify-center py-3 sm:py-4">
                  <div
                    className="group relative cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="size-16 border border-dashed border-slate-300 sm:size-24">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-slate-50 text-lg text-slate-400 sm:text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="mb-1 size-5 text-white sm:size-6" />
                      <span className="text-[9px] font-bold text-white sm:text-[10px]">
                        Upload
                      </span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Batal
                  </Button>
                  <Button
                    className="border-transparent bg-blue-600 text-xs text-white hover:bg-blue-700 sm:text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Mengunggah..." : "Simpan Profil"}
                  </Button>
                </div>
              </div>
            )}

            {/* Content: Ganti Nama */}
            {activeModal === "nama" && (
              <form
                className="flex flex-col gap-4 sm:gap-6"
                onSubmit={handleUpdateProfile}
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    Ganti Nama
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Nama ini akan terlihat oleh pengguna lain.
                  </p>
                </div>
                {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-xs font-medium text-slate-700 sm:text-sm"
                    >
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={user?.username}
                      placeholder="Masukkan username..."
                      className="bg-slate-50 text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="border-transparent bg-blue-600 text-xs text-white hover:bg-blue-700 sm:text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            )}

            {/* Content: Ganti Email */}
            {activeModal === "email" && (
              <form
                className="flex flex-col gap-4 sm:gap-6"
                onSubmit={handleUpdateProfile}
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    Ganti Email
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Pastikan email baru Anda aktif. Konfirmasi akan dikirimkan.
                  </p>
                </div>
                {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs font-medium text-slate-700 sm:text-sm">
                      Email Saat Ini
                    </Label>
                    <Input
                      value={user?.email}
                      disabled
                      className="bg-slate-100/50 text-xs text-slate-500 sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-medium text-slate-700 sm:text-sm"
                    >
                      Email Baru <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contoh@domain.com"
                      className="bg-slate-50 text-xs focus-visible:ring-blue-100 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="border-transparent bg-blue-600 text-xs text-white hover:bg-blue-700 sm:text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Kirim Konfirmasi"}
                  </Button>
                </div>
              </form>
            )}

            {/* Content: Ganti Password */}
            {activeModal === "password" && (
              <form
                className="flex flex-col gap-4 sm:gap-6"
                onSubmit={handleChangePassword}
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    Ganti Password
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Amankan akun Anda dengan password yang kuat.
                  </p>
                </div>
                {error && <p className="text-xs text-destructive sm:text-sm">{error}</p>}
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="current_password" className="text-xs font-medium text-slate-700 sm:text-sm">
                      Password Saat Ini
                    </Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        name="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-slate-50 pr-10 text-xs focus-visible:ring-blue-100 sm:text-sm"
                        required
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-700 sm:text-sm">
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min. 8 karakter"
                        className="bg-slate-50 pr-10 text-xs focus-visible:ring-blue-100 sm:text-sm"
                        required
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="password_confirmation" className="text-xs font-medium text-slate-700 sm:text-sm">
                      Konfirmasi Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        className="bg-slate-50 pr-10 text-xs focus-visible:ring-blue-100 sm:text-sm"
                        required
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    disabled={isLoading}
                    className="text-xs sm:text-sm"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="border-transparent bg-blue-600 text-xs text-white hover:bg-blue-700 sm:text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Memperbarui..." : "Perbarui Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
