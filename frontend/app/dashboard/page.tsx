import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Selamat datang di dashboard zipher.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
