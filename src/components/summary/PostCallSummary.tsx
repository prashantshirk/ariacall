import React from "react"
import { useCallStore } from "@/store/callStore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OutcomeJson } from "./OutcomeJson"
import { StatRow } from "./StatRow"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, History, MessageSquare, PhoneCall, Sparkles, User } from "lucide-react"

interface PostCallSummaryProps {
  onStartNewCall?: () => void
}

export const PostCallSummary: React.FC<PostCallSummaryProps> = ({ onStartNewCall }) => {
  const navigate = useNavigate()
  const {
    callId,
    durationSeconds,
    turns,
    toolCalls,
    currentSummary,
    isGeneratingSummary,
    latencyStats,
    resetCallState,
  } = useCallStore()

  const handleStartNew = () => {
    resetCallState()
    if (onStartNewCall) onStartNewCall()
  }

  const getResolutionBadge = (status?: string) => {
    const s = status || "RESOLVED"
    if (s === "RESOLVED") {
      return (
        <Badge variant="success" className="px-2.5 py-0.5 text-xs font-semibold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
          {s}
        </Badge>
      )
    }
    if (s === "ESCALATED") {
      return <Badge variant="warning">{s}</Badge>
    }
    return <Badge variant="destructive">{s}</Badge>
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in-0 duration-300">
      {/* Overview Card */}
      <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold font-brand text-zinc-900 dark:text-zinc-100">
                  Call Evaluation & Outcome Summary
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Session ID: <code className="font-mono text-zinc-700 dark:text-zinc-300">{callId}</code> • Aura Skincare D2C Support
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentSummary?.customer_intent && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {currentSummary.customer_intent}
                </Badge>
              )}
              {getResolutionBadge(currentSummary?.resolution_status)}
              {currentSummary?.order_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {currentSummary.order_id}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Summary Statement */}
          {currentSummary?.call_summary && (
            <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Executive Call Summary
              </span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                {currentSummary.call_summary}
              </p>
            </div>
          )}

          {/* Metrics Row */}
          <div className="mt-5">
            <StatRow
              durationSeconds={durationSeconds}
              turnsCount={turns.length}
              toolCallsCount={toolCalls.length}
              latency={latencyStats}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Chronological Transcript vs Structured JSON */}
      <Tabs defaultValue="structured-json" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="structured-json">Structured JSON Outcome</TabsTrigger>
            <TabsTrigger value="transcript">Final Transcript ({turns.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/history")}
              className="text-xs flex items-center gap-1.5 border-zinc-200 dark:border-zinc-700 rounded-lg"
            >
              <History className="w-3.5 h-3.5" />
              <span>Call History</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleStartNew}
              className="text-xs flex items-center gap-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Start New Call</span>
            </Button>
          </div>
        </div>

        <TabsContent value="structured-json" className="mt-3">
          <OutcomeJson summary={currentSummary} isLoading={isGeneratingSummary} />
        </TabsContent>

        <TabsContent value="transcript" className="mt-3">
          <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 rounded-2xl p-4">
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {turns.map((turn, i) => {
                const isAgent = turn.speaker === "agent"
                return (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${isAgent ? "justify-start" : "justify-end"}`}
                  >
                    {isAgent && (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}
                    <div className={`max-w-[80%] space-y-1 ${isAgent ? "text-left" : "text-right"}`}>
                      <div className="text-[10px] text-zinc-400">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300 mr-1.5">
                          {isAgent ? "Aria" : "Customer"}
                        </span>
                        <span>
                          {new Date(turn.ts).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isAgent
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                            : "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm"
                        }`}
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
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
