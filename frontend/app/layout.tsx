import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { UploadProvider } from "@/hooks/use-upload"
import { AppDialogProvider } from "@/hooks/use-app-dialog"
import { cn } from "@/lib/utils"

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <UploadProvider>
            <AppDialogProvider>
              {children}
            </AppDialogProvider>
          </UploadProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
