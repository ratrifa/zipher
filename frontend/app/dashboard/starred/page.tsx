import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StarredSection } from "@/components/dashboard/starred"

export default function StarredPage() {
  return (
    <DashboardShell>
      <StarredSection />
    </DashboardShell>
  )
}
