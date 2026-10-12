import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AriaOrb } from "./AriaOrb"
import { StateBadge } from "./StateBadge"
import { LiveCaption } from "./LiveCaption"
import { CallControls } from "./CallControls"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { useCallStore } from "@/store/callStore"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CallStageProps {
  onStartCall: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onSelectPrompt: (prompt: string) => void
}

export const CallStage: React.FC<CallStageProps> = ({
  onStartCall,
  onEndCall,
  onToggleMute,
  onSelectPrompt,
}) => {
  const state = useCallStore((s) => s.state)
  const errorMessage = useCallStore((s) => s.errorMessage)

  const isLive =
    state === "listening" ||
    state === "thinking" ||
    state === "speaking" ||
    state === "connecting"

  return (
    <Card className="w-full relative overflow-hidden bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all rounded-2xl">
      {/* Subtle modern radial background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-emerald-100/40 via-zinc-50/20 to-transparent dark:from-emerald-950/20 dark:via-zinc-900/10 pointer-events-none rounded-full blur-2xl" />

      <CardContent className="p-6 md:p-8 flex flex-col items-center relative z-10">
        {/* Header / State indicator */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 font-brand">
              Aria Voice CX
            </span>
          </div>
          <StateBadge state={state} />
        </div>

        {/* The Animated Visualizer Orb */}
        <div className="my-3 py-2 flex items-center justify-center">
          <AriaOrb size={210} />
        </div>

        {/* Live Caption Utterance */}
        <div className="w-full mb-6">
          <LiveCaption />
        </div>

        {/* Error or Busy Alert if present */}
        {errorMessage && (
          <div className="w-full mb-4">
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Microphone or Audio Notice</AlertTitle>
              <AlertDescription className="text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartCall}
                  className="h-6 text-[11px] ml-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {state === "busy" && (
          <div className="w-full mb-4">
            <Alert variant="warning" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Line Busy</AlertTitle>
              <AlertDescription className="text-xs flex items-center justify-between">
                <span>Aria is currently assisting another caller. Please retry in a moment.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartCall}
                  className="h-6 text-[11px] ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Call Controls */}
        <div className="w-full">
          <CallControls
            onStartCall={onStartCall}
            onEndCall={onEndCall}
            onToggleMute={onToggleMute}
          />
        </div>

        {/* Suggested Prompts Helper */}
        <SuggestedPrompts
          onSelectPrompt={onSelectPrompt}
          disabled={!isLive && state !== "idle"}
        />
      </CardContent>
    </Card>
  )
}
