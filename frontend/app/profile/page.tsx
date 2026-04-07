"use client"

import { useState } from "react"
import { Laptop, Mail, Monitor, Smartphone } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProfileDeviceItem } from "@/components/dashboard/profile-device-item"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { ProfileSettingRow } from "@/components/dashboard/profile-setting-row"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(false)

  return (
    <DashboardShell >
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 pt-6 md:px-0">
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
                <Avatar className="size-14">
                  <AvatarFallback className="text-lg">ZA</AvatarFallback>
                </Avatar>
              }
              actionLabel="Ganti foto"
            />

            <ProfileSettingRow
              title="Nama"
              value={<span className="font-medium  text-foreground">Zipher Admin</span>}
              actionLabel="Ganti nama"
            />

            <ProfileSettingRow
              title="Email"
              value={
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Mail className="size-4 text-muted-foreground" />
                  satri@example.com
                </span>
              }
              actionLabel="Ganti email"
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
    </DashboardShell>
  )
}
