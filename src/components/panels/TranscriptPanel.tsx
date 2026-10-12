import React, { useEffect, useRef, useState } from "react"
import { useCallStore } from "@/store/callStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowDown, Bot, Sparkles, User } from "lucide-react"

export const TranscriptPanel: React.FC = () => {
  const turns = useCallStore((s) => s.turns)
  const state = useCallStore((s) => s.state)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const isAutoScrollPausedRef = useRef(false)

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      })
      isAutoScrollPausedRef.current = false
      setShowScrollBottom(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    if (distanceToBottom > 80) {
      isAutoScrollPausedRef.current = true
      setShowScrollBottom(true)
    } else {
      isAutoScrollPausedRef.current = false
      setShowScrollBottom(false)
    }
  }

  useEffect(() => {
    if (!isAutoScrollPausedRef.current && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [turns, state])

  return (
    <div className="relative h-[480px] flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-brand">
          <Bot className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live Conversation Transcript</span>
        </div>
        <span className="text-[11px] text-zinc-400">
          {turns.length} {turns.length === 1 ? "utterance" : "utterances"}
        </span>
      </div>

      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pr-2 py-4 space-y-3.5"
      >
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              No conversation transcript yet
            </p>
            <p className="text-[11px] max-w-xs text-zinc-400">
              Start a call and speak to Aria. Real-time customer and agent utterances will stream here live.
            </p>
          </div>
        ) : (
          turns.map((turn, i) => {
            const isAgent = turn.speaker === "agent"
            return (
              <div
                key={i}
                className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
              >
                {isAgent && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-1 ${isAgent ? "text-left" : "text-right"}`}>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                      {isAgent ? "Aria" : "Customer"}
                    </span>
                    <span>
                      {new Date(turn.ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    {!turn.final && (
                      <span className="italic text-zinc-400">(speaking...)</span>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isAgent
                        ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200/60 dark:border-zinc-700/60"
                        : "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm shadow-2xs"
                    } ${!turn.final ? "opacity-75" : ""}`}
                  >
                    {turn.text}
                  </div>
                </div>

                {!isAgent && (
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Thinking Indicator */}
        {state === "thinking" && (
          <div className="flex gap-2.5 justify-start animate-in fade-in-0">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3 h-3 animate-spin" />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-2xl rounded-tl-sm border border-zinc-200/60 dark:border-zinc-700/60 text-xs flex items-center gap-1.5 text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1">Aria is checking brand info & tools...</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      {showScrollBottom && (
        <Button
          size="sm"
          variant="secondary"
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md rounded-full text-xs py-1 px-3 flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700"
        >
          <ArrowDown className="w-3 h-3" />
          <span>Jump to latest</span>
        </Button>
      )}
    </div>
  )
}
