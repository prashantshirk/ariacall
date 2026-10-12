import React from "react"
import { CallStage } from "@/components/call/CallStage"
import { PostCallSummary } from "@/components/summary/PostCallSummary"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TranscriptPanel } from "@/components/panels/TranscriptPanel"
import { ToolTracePanel } from "@/components/panels/ToolTracePanel"
import { TestOrdersPanel } from "@/components/panels/TestOrdersPanel"
import { PoliciesPanel } from "@/components/panels/PoliciesPanel"
import { useCall } from "@/hooks/useCall"
import { useCallStore } from "@/store/callStore"
import { Bot, Cpu, Package, ShieldCheck } from "lucide-react"

export const CallPage: React.FC = () => {
  const {
    state,
    startCall,
    endCall,
    toggleMute,
    processMockUserInput,
  } = useCall()

  const isEnded = state === "ended"

  const handleSelectPrompt = (promptText: string) => {
    if (state === "idle") {
      startCall().then(() => {
        setTimeout(() => {
          processMockUserInput(promptText)
        }, 800)
      })
    } else {
      processMockUserInput(promptText)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-24 lg:py-8">
      {isEnded ? (
        <PostCallSummary onStartNewCall={startCall} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Call Stage (~5/12) */}
          <div className="lg:col-span-5 w-full sticky top-20">
            <CallStage
              onStartCall={startCall}
              onEndCall={endCall}
              onToggleMute={toggleMute}
              onSelectPrompt={handleSelectPrompt}
            />
          </div>

          {/* Right Column: Tabbed Panels (~7/12) */}
          <div className="lg:col-span-7 w-full">
            <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="test-orders" className="w-full">
                  <div className="overflow-x-auto pb-1">
                    <TabsList className="bg-zinc-100 dark:bg-zinc-800/90 p-1 w-full sm:w-auto flex justify-start">
                      <TabsTrigger value="test-orders" className="flex items-center gap-1.5 text-xs">
                        <Package className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Test Orders</span>
                      </TabsTrigger>
                      <TabsTrigger value="transcript" className="flex items-center gap-1.5 text-xs">
                        <Bot className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Transcript</span>
                      </TabsTrigger>
                      <TabsTrigger value="tool-trace" className="flex items-center gap-1.5 text-xs">
                        <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Tool Trace</span>
                      </TabsTrigger>
                      <TabsTrigger value="policies" className="flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Policies</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="test-orders" className="mt-4">
                    <TestOrdersPanel onSelectPrompt={handleSelectPrompt} />
                  </TabsContent>

                  <TabsContent value="transcript" className="mt-4">
                    <TranscriptPanel />
                  </TabsContent>

                  <TabsContent value="tool-trace" className="mt-4">
                    <ToolTracePanel />
                  </TabsContent>

                  <TabsContent value="policies" className="mt-4">
                    <PoliciesPanel />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar (Always reachable on mobile when scrolled down) */}
      {!isEnded && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800/90 p-3 shadow-lg flex items-center justify-between gap-3 safe-bottom">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state === "listening" || state === "speaking" || state === "thinking"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-zinc-400"
              }`}
            />
            <div className="text-left">
              <span className="text-xs font-semibold block text-zinc-900 dark:text-zinc-100 font-brand">
                {state === "listening"
                  ? "Listening..."
                  : state === "speaking"
                  ? "Aria Speaking"
                  : state === "thinking"
                  ? "Thinking..."
                  : "Aria Voice"}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {state === "listening" || state === "speaking" || state === "thinking"
                  ? "Live Call Active"
                  : "Ready to Call"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(state === "listening" || state === "speaking" || state === "thinking" || state === "connecting") ? (
              <button
                type="button"
                onClick={endCall}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-transform active:scale-95"
              >
                End Call
              </button>
            ) : (
              <button
                type="button"
                onClick={startCall}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>Start Call</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
