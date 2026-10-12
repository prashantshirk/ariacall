import React from "react"
import { useCallStore } from "@/store/callStore"
import { Sparkles, User } from "lucide-react"

export const LiveCaption: React.FC = () => {
  const liveCaption = useCallStore((s) => s.liveCaption)
  const state = useCallStore((s) => s.state)

  if (state === "idle") {
    return (
      <div className="min-h-[48px] flex items-center justify-center text-xs text-zinc-400 text-center px-4">
        Press &ldquo;Start Call&rdquo; or hit <kbd className="mx-1 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">Space</kbd> to begin speaking with Aria.
      </div>
    )
  }

  if (!liveCaption) {
    return (
      <div className="min-h-[48px] flex items-center justify-center text-xs text-zinc-400 text-center px-4 animate-pulse">
        {state === "connecting"
          ? "Establishing secure audio connection..."
          : state === "listening"
          ? "Aria is listening to your microphone..."
          : state === "thinking"
          ? "Processing query with brand knowledge..."
          : "..."}
      </div>
    )
  }

  const isAgent = liveCaption.speaker === "agent"

  return (
    <div
      className="min-h-[48px] w-full flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs transition-all"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">
        {isAgent ? (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="w-3 h-3" />
          </span>
        ) : (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            <User className="w-3 h-3" />
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5 font-medium text-[11px] text-zinc-500 mb-0.5">
          <span>{isAgent ? "Aria (Aura Skincare)" : "You"}</span>
          {!liveCaption.final && (
            <span className="text-[10px] text-zinc-400 italic">(listening...)</span>
          )}
        </div>
        <p className={`line-clamp-2 leading-relaxed ${isAgent ? "text-zinc-900 dark:text-zinc-100 font-normal" : "text-zinc-700 dark:text-zinc-300"}`}>
          &ldquo;{liveCaption.text}&rdquo;
        </p>
      </div>
    </div>
  )
}
