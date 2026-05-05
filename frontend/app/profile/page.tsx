"use client"

import { useState, useEffect, useRef } from "react"
import { Mail, Camera, Lock, User, CheckCircle2, AlertCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { ProfileSettingRow } from "@/components/dashboard/profile-setting-row"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [activeModal, setActiveModal] = useState<"foto" | "nama" | "email" | "password" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      const response = await fetch("http://localhost:8000/api/v1/me", {
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
      const response = await fetch("http://localhost:8000/api/v1/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Gagal memperbarui profil")

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
    const password_confirmation = formData.get("password_confirmation") as string

    try {
      const token = localStorage.getItem("zipher_token")
      const response = await fetch("http://localhost:8000/api/v1/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ current_password, password, password_confirmation }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Gagal mengganti password")

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
      const response = await fetch("http://localhost:8000/api/v1/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Gagal mengunggah avatar")

      await fetchUser()
      window.dispatchEvent(new Event("user-updated"))
      setActiveModal(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const avatarUrl = user?.avatar ? `http://localhost:8000/storage/${user.avatar}` : null
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ZA"

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 pt-6 md:px-0 relative mb-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
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
                <Avatar className="size-14 bg-slate-100">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="text-lg bg-slate-100 text-slate-500 font-medium border border-slate-200">{initials}</AvatarFallback>
                </Avatar>
              }
              actionLabel="Ganti foto"
              onAction={() => setActiveModal("foto")}
            />

            <ProfileSettingRow
              title="Username"
              value={<span className="font-medium text-slate-800 text-[15px]">{user?.username || "..."}</span>}
              actionLabel="Ganti nama"
              onAction={() => setActiveModal("nama")}
            />

            <ProfileSettingRow
              title="Email"
              value={
                <span className="inline-flex items-center gap-2 font-medium text-slate-800 text-[15px]">
                  <Mail className="size-4 text-slate-500" />
                  {user?.email || "..."}
                </span>
              }
              actionLabel="Ganti email"
              onAction={() => setActiveModal("email")}
            />
          </div>
        </ProfileSection>

        <ProfileSection
          title="Security"
          description="Kelola password, two factor authentication, dan alert login akun."
        >
          <div id="security" className="space-y-0">
            <ProfileSettingRow
              title="Password"
              actionLabel="Ganti password"
              onAction={() => setActiveModal("password")}
            />

            <ProfileSettingRow
              title="Two factor authentication"
              description="Tambahkan lapisan keamanan ekstra saat login."
              value={
                <span className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? "Aktif" : "Nonaktif"}
                </span>
              }
            >
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                aria-label="Toggle two factor authentication"
              />
            </ProfileSettingRow>

            </div>
        </ProfileSection>

        </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          {/* Modal Background Click to Close */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveModal(null)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
             
             {/* Content: Ganti Foto */}
             {activeModal === "foto" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Ganti Foto Profil</h2>
                    <p className="text-sm text-slate-500">Unggah foto baru untuk profil Anda.</p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex justify-center py-4">
                     <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="size-24 border border-dashed border-slate-300">
                          {avatarUrl && <AvatarImage src={avatarUrl} />}
                          <AvatarFallback className="text-2xl bg-slate-50 text-slate-400">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Camera className="size-6 text-white mb-1" />
                           <span className="text-white text-[10px] font-bold">Upload</span>
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
                  <div className="flex justify-end gap-3 mt-2">
                    <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isLoading}>Batal</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white border-transparent" disabled={isLoading}>
                      {isLoading ? "Mengunggah..." : "Simpan Profil"}
                    </Button>
                  </div>
                </div>
             )}

             {/* Content: Ganti Nama */}
             {activeModal === "nama" && (
                <form className="flex flex-col gap-6" onSubmit={handleUpdateProfile}>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Ganti Nama</h2>
                    <p className="text-sm text-slate-500">Nama ini akan terlihat oleh pengguna lain.</p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
                       <Input id="username" name="username" defaultValue={user?.username} placeholder="Masukkan username..." className="bg-slate-50" required />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setActiveModal(null)} disabled={isLoading}>Batal</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white border-transparent" disabled={isLoading}>
                      {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
             )}

             {/* Content: Ganti Email */}
             {activeModal === "email" && (
                <form className="flex flex-col gap-6" onSubmit={handleUpdateProfile}>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Ganti Email</h2>
                    <p className="text-sm text-slate-500">Pastikan email baru Anda aktif. Konfirmasi akan dikirimkan.</p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="space-y-4">
                     <div className="space-y-2">
                       <Label className="text-slate-700 font-medium">Email Saat Ini</Label>
                       <Input value={user?.email} disabled className="bg-slate-100/50 text-slate-500" />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="email" className="text-slate-700 font-medium">Email Baru <span className="text-rose-500">*</span></Label>
                       <Input id="email" name="email" type="email" placeholder="contoh@domain.com" className="bg-slate-50 focus-visible:ring-blue-100" required />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setActiveModal(null)} disabled={isLoading}>Batal</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white border-transparent" disabled={isLoading}>
                      {isLoading ? "Menyimpan..." : "Kirim Konfirmasi"}
                    </Button>
                  </div>
                </form>
             )}

             {/* Content: Ganti Password */}
             {activeModal === "password" && (
                <form className="flex flex-col gap-6" onSubmit={handleChangePassword}>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Ganti Password</h2>
                    <p className="text-sm text-slate-500">Amankan akun Anda dengan password yang kuat.</p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="current_password" className="text-slate-700 font-medium">Password Saat Ini</Label>
                       <Input id="current_password" name="current_password" type="password" placeholder="••••••••" className="bg-slate-50 focus-visible:ring-blue-100" required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="password" className="text-slate-700 font-medium">Password Baru</Label>
                       <Input id="password" name="password" type="password" placeholder="Min. 8 karakter" className="bg-slate-50 focus-visible:ring-blue-100" required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="password_confirmation" className="text-slate-700 font-medium">Konfirmasi Password Baru</Label>
                       <Input id="password_confirmation" name="password_confirmation" type="password" placeholder="Ulangi password baru" className="bg-slate-50 focus-visible:ring-blue-100" required />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setActiveModal(null)} disabled={isLoading}>Batal</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white border-transparent" disabled={isLoading}>
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

