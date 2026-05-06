"use client"

import { useState } from "react"
import { Laptop, Mail, Monitor, Smartphone, Camera } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileDeviceItem } from "@/components/dashboard/profile-device-item"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { ProfileSettingRow } from "@/components/dashboard/profile-setting-row"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(false)
  const [activeModal, setActiveModal] = useState<
    "foto" | "nama" | "email" | "password" | null
  >(null)

  return (
    <DashboardShell>
      <div className="relative mx-auto mb-12 w-full max-w-2xl space-y-8 px-4 pt-6 md:px-0">
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
                  <AvatarFallback className="border border-slate-200 bg-slate-100 text-lg font-medium text-slate-500">
                    ZA
                  </AvatarFallback>
                </Avatar>
              }
              actionLabel="Ganti foto"
              onAction={() => setActiveModal("foto")}
            />

            <ProfileSettingRow
              title="Nama"
              value={
                <span className="text-[15px] font-medium text-slate-800">
                  Zipher Admin
                </span>
              }
              actionLabel="Ganti nama"
              onAction={() => setActiveModal("nama")}
            />

            <ProfileSettingRow
              title="Email"
              value={
                <span className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-800">
                  <Mail className="size-4 text-slate-500" />
                  satri@example.com
                </span>
              }
              actionLabel="Ganti email"
              onAction={() => setActiveModal("email")}
            />
          </div>
        </ProfileSection>

        <ProfileSection
          title="Security"
          description="Kelola password dan alert login akun."
        >
          <div id="security" className="space-y-0">
            <ProfileSettingRow
              title="Password"
              actionLabel="Ganti password"
              onAction={() => setActiveModal("password")}
            />

            <ProfileSettingRow
              title="Login alert"
              description="Terima notifikasi saat ada login dari perangkat baru."
              value={
                <span className="text-sm text-muted-foreground">
                  {loginAlertEnabled ? "Aktif" : "Nonaktif"}
                </span>
              }
            >
              <Switch
                checked={loginAlertEnabled}
                onCheckedChange={setLoginAlertEnabled}
                aria-label="Toggle login alert"
              />
            </ProfileSettingRow>
          </div>
        </ProfileSection>

        <ProfileSection
          title="Device Connected"
          description="Kelola perangkat yang sedang login menggunakan akun ini."
        >
          <div className="space-y-4">
            <ProfileDeviceItem
              icon={Laptop}
              deviceName="MacBook Pro 14"
              deviceInfo="Chrome on macOS Ventura"
              location="Bandung, Indonesia"
              lastActive="Active now"
            />
            <ProfileDeviceItem
              icon={Smartphone}
              deviceName="iPhone 15 Pro"
              deviceInfo="Safari on iOS 17"
              location="Jakarta, Indonesia"
              lastActive="Last active 12 minutes ago"
            />
            <ProfileDeviceItem
              icon={Monitor}
              deviceName="Windows Desktop"
              deviceInfo="Edge on Windows 11"
              location="Surabaya, Indonesia"
              lastActive="Last active 3 days ago"
            />
          </div>
        </ProfileSection>
      </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          {/* Modal Background Click to Close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setActiveModal(null)}
          />

          <div className="relative z-10 w-full max-w-md animate-in rounded-xl bg-white p-6 shadow-xl duration-200 zoom-in-95 fade-in">
            {/* Content: Ganti Foto */}
            {activeModal === "foto" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Ganti Foto Profil
                  </h2>
                  <p className="text-sm text-slate-500">
                    Unggah foto baru untuk profil Anda.
                  </p>
                </div>
                <div className="flex justify-center py-4">
                  <div className="group relative cursor-pointer">
                    <Avatar className="size-24 border border-dashed border-slate-300">
                      <AvatarFallback className="bg-slate-50 text-2xl text-slate-400">
                        ZA
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="mb-1 size-6 text-white" />
                      <span className="text-[10px] font-bold text-white">
                        Upload
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                  >
                    Batal
                  </Button>
                  <Button className="border-transparent bg-blue-600 text-white hover:bg-blue-700">
                    Simpan Profil
                  </Button>
                </div>
              </div>
            )}

            {/* Content: Ganti Nama */}
            {activeModal === "nama" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Ganti Nama
                  </h2>
                  <p className="text-sm text-slate-500">
                    Nama ini akan terlihat oleh pengguna lain.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="font-medium text-slate-700"
                    >
                      Nama Lengkap
                    </Label>
                    <Input
                      id="firstName"
                      defaultValue="Zipher Admin"
                      placeholder="Masukkan nama..."
                      className="bg-slate-50"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                  >
                    Batal
                  </Button>
                  <Button className="border-transparent bg-blue-600 text-white hover:bg-blue-700">
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            )}

            {/* Content: Ganti Email */}
            {activeModal === "email" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Ganti Email
                  </h2>
                  <p className="text-sm text-slate-500">
                    Pastikan email baru Anda aktif. Konfirmasi akan dikirimkan.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-slate-700">
                      Email Saat Ini
                    </Label>
                    <Input
                      value="satri@example.com"
                      disabled
                      className="bg-slate-100/50 text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="newEmail"
                      className="font-medium text-slate-700"
                    >
                      Email Baru <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="contoh@domain.com"
                      className="bg-slate-50 focus-visible:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                  >
                    Batal
                  </Button>
                  <Button className="border-transparent bg-blue-600 text-white hover:bg-blue-700">
                    Kirim Konfirmasi
                  </Button>
                </div>
              </div>
            )}

            {/* Content: Ganti Password */}
            {activeModal === "password" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Ganti Password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Amankan akun Anda dengan password yang kuat.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentPass"
                      className="font-medium text-slate-700"
                    >
                      Password Saat Ini
                    </Label>
                    <Input
                      id="currentPass"
                      type="password"
                      placeholder="••••••••"
                      className="bg-slate-50 focus-visible:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="newPass"
                      className="font-medium text-slate-700"
                    >
                      Password Baru
                    </Label>
                    <Input
                      id="newPass"
                      type="password"
                      placeholder="Min. 8 karakter"
                      className="bg-slate-50 focus-visible:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPass"
                      className="font-medium text-slate-700"
                    >
                      Konfirmasi Password Baru
                    </Label>
                    <Input
                      id="confirmPass"
                      type="password"
                      placeholder="Ulangi password baru"
                      className="bg-slate-50 focus-visible:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                  >
                    Batal
                  </Button>
                  <Button className="border-transparent bg-blue-600 text-white hover:bg-blue-700">
                    Perbarui Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
