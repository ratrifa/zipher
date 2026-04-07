import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ProfileDeviceItemProps = {
  icon: LucideIcon
  deviceName: string
  deviceInfo: string
  location: string
  lastActive: string
}

export function ProfileDeviceItem({
  icon: Icon,
  deviceName,
  deviceInfo,
  location,
  lastActive,
}: ProfileDeviceItemProps) {
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" />
          </span>

          <div className="space-y-1">
            <p className="font-medium">{deviceName}</p>
            <p className="text-sm text-muted-foreground">{deviceInfo}</p>
            <p className="text-sm text-muted-foreground">
              {location} • {lastActive}
            </p>
          </div>
        </div>

        <Button variant="destructive" size="sm">
          Remove
        </Button>
      </CardContent>
    </Card>
  )
}
