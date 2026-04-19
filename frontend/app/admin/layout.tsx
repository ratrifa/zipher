import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh w-full flex-col bg-slate-50">
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-[260px] md:block bg-background">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
