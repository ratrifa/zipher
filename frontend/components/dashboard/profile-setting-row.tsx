import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type ProfileSettingRowProps = {
  title: string
  description?: string
  value?: ReactNode
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function ProfileSettingRow({
  title,
  description,
  value,
  actionLabel,
  onAction,
  children,
}: ProfileSettingRowProps) {
  return (
    <div>
      <div className="flex flex-col gap-4 py-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1 md:max-w-[65%]">
          <p className="font-medium">{title}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {value ? <div>{value}</div> : null}
          {children}
          {actionLabel ? (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
      <Separator />
    </div>
  )
}
