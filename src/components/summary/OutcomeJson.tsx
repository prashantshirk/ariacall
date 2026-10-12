import React, { useState } from "react"
import { Outcome } from "@/types"
import { Button } from "@/components/ui/button"
import { Check, Copy, Download, FileCode } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface OutcomeJsonProps {
  summary: Outcome | null
  isLoading?: boolean
}

export const OutcomeJson: React.FC<OutcomeJsonProps> = ({ summary, isLoading = false }) => {
  const [copied, setCopied] = useState(false)

  if (isLoading || !summary) {
    return (
      <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  const jsonString = JSON.stringify(summary, null, 2)

  const copyJson = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aura-call-outcome-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-950 overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
          <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>structured_call_outcome.json</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={copyJson}
            className="h-7 px-2.5 text-xs flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadJson}
            className="h-7 px-2.5 text-xs flex items-center gap-1 border-zinc-300 dark:border-zinc-700"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
          {jsonString}
        </pre>
      </div>
    </div>
  )
}
