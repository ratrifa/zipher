"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type ReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  onSubmit: (reason: string) => Promise<void>
}

export function ReportDialog({ open, onOpenChange, fileName, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(reason.trim())
      setReason("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(val: boolean) {
    if (!isSubmitting) {
      if (!val) setReason("")
      onOpenChange(val)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Laporkan File</DialogTitle>
          <DialogDescription>
            Laporkan <span className="font-medium text-foreground">{fileName}</span> karena melanggar ketentuan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Alasan</Label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan laporan Anda..."
              rows={4}
              maxLength={500}
              required
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-right text-xs text-muted-foreground">{reason.length}/500</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={!reason.trim() || isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
