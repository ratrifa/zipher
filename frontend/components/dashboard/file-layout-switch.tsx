"use client"

import { Check, LayoutGrid, List } from "lucide-react"

type FileLayoutSwitchProps = {
  isList: boolean
  onCheckedChange: (checked: boolean) => void
}

export function FileLayoutSwitch({
  isList,
  onCheckedChange,
}: FileLayoutSwitchProps) {
  const isGrid = !isList

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-400/60 bg-muted">
      <button
        type="button"
        onClick={() => onCheckedChange(true)}
        className={[
          "inline-flex h-8 items-center justify-center gap-1 px-3 transition-colors",
          isList ? "bg-sky-100 text-sky-900" : "bg-background text-foreground",
        ].join(" ")}
        aria-pressed={isList}
        aria-label="Tampilan daftar"
      >
        {isList ? <Check className="size-3.5" /> : null}
        <List className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onCheckedChange(false)}
        className={[
          "inline-flex h-8 items-center justify-center gap-1 border-l border-slate-400/60 px-3 transition-colors",
          isGrid ? "bg-sky-100 text-sky-900" : "bg-background text-foreground",
        ].join(" ")}
        aria-pressed={isGrid}
        aria-label="Tampilan grid"
      >
        {isGrid ? <Check className="size-3.5" /> : null}
        <LayoutGrid className="size-3.5" />
      </button>
    </div>
  )
}
