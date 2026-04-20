"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TriangleAlert, ChevronDown, FolderOpen } from "lucide-react"

const REPORTS_DATA = Array(6).fill(null).map((_, i) => ({
  id: i + 1,
  file: "video.mp4",
  owner: "Pa Aji",
  reason: "Berisi konten berbahaya",
  reportedBy: "Alivio The GOAT",
  time: "2m ago",
}))

export default function ReportsPage() {
  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Review dan moderasi laporan konten.</p>
      </div>

      <div className="w-full rounded-2xl border bg-card p-5 shadow-sm xl:w-4/5">
        <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Search Filters
            <ChevronDown className="size-4" />
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md bg-primary/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
              REPORT COUNT: 67
            </div>
            <Input
              placeholder="Search report..."
              className="h-8 w-full max-w-55 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full min-w-245 border-collapse text-center text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase">
                <th className="py-3 px-2 font-bold w-12">No</th>
                <th className="py-3 px-2 font-bold text-left">File</th>
                <th className="py-3 px-2 font-bold text-left">Owner</th>
                <th className="py-3 px-2 font-bold text-left">Reason</th>
                <th className="py-3 px-2 font-bold text-left">Reported By</th>
                <th className="py-3 px-2 font-bold text-left">Time</th>
                <th className="py-3 px-2 font-bold text-right w-[320px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS_DATA.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/70 bg-card transition-colors hover:bg-muted/30 last:border-b-0"
                >
                  <td className="py-3 px-2 text-center text-muted-foreground">{item.id}</td>
                  <td className="py-3 px-2 text-left font-semibold">{item.file}</td>
                  <td className="py-3 px-2 text-left text-[11px] font-semibold text-muted-foreground">{item.owner}</td>
                  <td className="py-3 px-2 text-left">
                    <span className="rounded-sm bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                      {item.reason}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-left text-[11px] text-muted-foreground">{item.reportedBy}</td>
                  <td className="py-3 px-2 text-left text-[11px] font-medium text-muted-foreground">{item.time}</td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-7 rounded-full px-3 text-[10px] font-bold"
                      >
                        Ignore
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-7 rounded-full border-primary/30 px-3 text-[10px] font-bold text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <FolderOpen className="size-3.5" />
                        View file
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="h-7 rounded-full border-destructive/30 px-3 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <TriangleAlert className="size-3.5" />
                        Ban
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
