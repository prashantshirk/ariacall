import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { CallDetail } from "@/types"
import { fetchCallDetail } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OutcomeJson } from "@/components/summary/OutcomeJson"
import { StatRow } from "@/components/summary/StatRow"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CheckCircle2, Cpu, History, MessageSquare, Sparkles, User } from "lucide-react"

export const CallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchCallDetail(id)
        setCall(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!call) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h3 className="text-lg font-bold">Call record not found</h3>
        <p className="text-xs text-zinc-500">The requested call session could not be located.</p>
        <Button onClick={() => navigate("/history")}>Back to History</Button>
      </div>
    )
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
    if (s === "ESCALATED") return <Badge variant="warning">{s}</Badge>
    return <Badge variant="destructive">{s}</Badge>
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/history")}
          className="text-xs flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to History</span>
        </Button>
      </div>

      <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold font-brand text-zinc-900 dark:text-zinc-100">
                  Archived Call Record: {call.id}
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Started on {new Date(call.started_at).toLocaleString()} • Duration: {call.duration_s}s
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {call.summary?.customer_intent && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {call.summary.customer_intent}
                </Badge>
              )}
              {getResolutionBadge(call.summary?.resolution_status)}
              {call.summary?.order_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {call.summary.order_id}
                </Badge>
              )}
            </div>
          </div>

          {call.summary?.call_summary && (
            <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Call Summary
              </span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {call.summary.call_summary}
              </p>
            </div>
          )}

          <div className="mt-5">
            <StatRow
              durationSeconds={call.duration_s}
              turnsCount={call.turns.length}
              toolCallsCount={call.tool_calls.length}
              latency={call.latency}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="structured-json" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 mb-2">
          <TabsTrigger value="structured-json">Structured Outcome JSON</TabsTrigger>
          <TabsTrigger value="transcript">Transcript ({call.turns.length})</TabsTrigger>
          <TabsTrigger value="tools">Tool Invocations ({call.tool_calls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="structured-json" className="mt-3">
          <OutcomeJson summary={call.summary} isLoading={false} />
        </TabsContent>

        <TabsContent value="transcript" className="mt-3">
          <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 rounded-2xl p-4">
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {call.turns.map((turn, i) => {
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

        <TabsContent value="tools" className="mt-3">
          <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 rounded-2xl p-4">
            {call.tool_calls.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                No tool calls recorded for this session.
              </div>
            ) : (
              <div className="space-y-3">
                {call.tool_calls.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 font-mono text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{tc.name}</span>
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        {tc.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Arguments:</span>
                      <pre className="p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200/60 dark:border-zinc-800 text-[11px]">
                        {JSON.stringify(tc.args, null, 2)}
                      </pre>
                    </div>
                    {Boolean(tc.result) && (
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-0.5">Result:</span>
                        <pre className="p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-emerald-600 dark:text-emerald-400">
                          {JSON.stringify(tc.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
