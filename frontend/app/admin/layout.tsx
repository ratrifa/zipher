import { AdminNavbar } from "@/components/admin/admin-navbar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-svh overflow-hidden bg-background">
      <div className="grid h-full md:grid-cols-[280px_1fr]">
        <div className="hidden h-svh border-r border-sidebar-border md:sticky md:top-0 md:block">
          <AdminSidebar />
        </div>

        <div className="flex h-svh flex-col overflow-hidden">
          <AdminNavbar />
          <main className="flex-1 overflow-y-auto px-4 pb-4 md:px-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
