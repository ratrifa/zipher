"use client"

import { createContext, useContext, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AlertState = { title: string; message: string } | null
type ConfirmState = { title: string; message: string; destructive?: boolean; resolve: (v: boolean) => void } | null

const AppDialogContext = createContext<{
  showAlert: (title: string, message: string) => void
  showConfirm: (title: string, message: string, options?: { destructive?: boolean }) => Promise<boolean>
}>({
  showAlert: () => {},
  showConfirm: async () => false,
})

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const showAlert = useCallback((title: string, message: string) => {
    setAlert({ title, message })
  }, [])

  const showConfirm = useCallback(
    (title: string, message: string, options?: { destructive?: boolean }): Promise<boolean> =>
      new Promise((resolve) => {
        setConfirm({ title, message, destructive: options?.destructive, resolve })
      }),
    []
  )

  return (
    <AppDialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Dialog open={!!alert} onOpenChange={(open) => !open && setAlert(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{alert?.title}</DialogTitle>
            {alert?.message && <DialogDescription>{alert.message}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setAlert(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) { confirm?.resolve(false); setConfirm(null) }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            {confirm?.message && <DialogDescription>{confirm.message}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { confirm?.resolve(false); setConfirm(null) }}>
              Batal
            </Button>
            <Button
              variant={confirm?.destructive ? "destructive" : "default"}
              onClick={() => { confirm?.resolve(true); setConfirm(null) }}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  return useContext(AppDialogContext)
}
