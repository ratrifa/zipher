import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { MyFilesSection } from "@/components/dashboard/my-files"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <MyFilesSection />
    </DashboardShell>
  )
}
