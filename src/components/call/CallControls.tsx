import React from "react"
import { Button } from "@/components/ui/button"
import { useCallStore } from "@/store/callStore"
import { Mic, MicOff, PhoneCall, PhoneOff, Signal } from "lucide-react"

interface CallControlsProps {
  onStartCall: () => void
  onEndCall: () => void
  onToggleMute: () => void
}

export const CallControls: React.FC<CallControlsProps> = ({
  onStartCall,
  onEndCall,
  onToggleMute,
}) => {
  const state = useCallStore((s) => s.state)
  const isMuted = useCallStore((s) => s.isMuted)
  const durationSeconds = useCallStore((s) => s.durationSeconds)

  const isLive =
    state === "listening" ||
    state === "thinking" ||
    state === "speaking" ||
    state === "connecting"

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Timer & Connection Status */}
      <div className="flex items-center gap-3 text-xs font-mono font-medium text-zinc-500">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80">
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          />
          <span className="text-zinc-700 dark:text-zinc-300">{formatTimer(durationSeconds)}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <Signal className="w-3.5 h-3.5 text-emerald-500" />
          <span>HD Audio (16k/24k)</span>
        </div>
      </div>

      {/* Main Buttons */}
      <div className="flex items-center gap-3 w-full max-w-sm">
        {isLive && (
          <Button
            type="button"
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={onToggleMute}
            className="rounded-xl px-4 flex items-center gap-2 border-zinc-300 dark:border-zinc-700 transition-transform active:scale-95"
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            <span className="text-xs">{isMuted ? "Muted" : "Mute"}</span>
          </Button>
        )}

        {!isLive ? (
          <Button
            type="button"
            size="lg"
            onClick={onStartCall}
            className="flex-1 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-md transition-all active:scale-98 flex items-center justify-center gap-2.5 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 py-6 font-semibold"
          >
            <PhoneCall className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            <span>Start Voice Call</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="flex-1 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2.5 py-6 font-semibold bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </Button>
        )}
      </div>

      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-600 dark:text-zinc-300 shadow-2xs">
          Space
        </kbd>
        <span>to {isLive ? "end call" : "start call"}</span>
      </div>
    </div>
  )
}
