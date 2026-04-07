import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/30 p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">zipher.</h1>
        <br />
      </div>
      <Card className="w-full max-w-sm py-6">
        <CardHeader>
          <CardTitle className="text-center text-xl">Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2 pb-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Lupa password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground hover:underline"
                >
                  Daftar
                </Link>
              </p>
            </div>

            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
