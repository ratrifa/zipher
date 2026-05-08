import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ProfileSectionProps = {
  title: string
  description: string
  children: ReactNode
}

export function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
