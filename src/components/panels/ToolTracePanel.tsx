import React, { useState } from "react"
import { useCallStore } from "@/store/callStore"
import { ToolCall, ToolStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, ChevronDown, Clock, Code2, Cpu, Loader2, XCircle } from "lucide-react"

export const ToolTracePanel: React.FC = () => {
  const toolCalls = useCallStore((s) => s.toolCalls)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusBadge = (status: ToolStatus) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="warning" className="flex items-center gap-1 font-mono text-[10px]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Running</span>
          </Badge>
        )
      case "success":
        return (
          <Badge variant="success" className="flex items-center gap-1 font-mono text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Success</span>
          </Badge>
        )
      case "not_eligible":
        return (
          <Badge variant="warning" className="flex items-center gap-1 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Not Eligible</span>
          </Badge>
        )
      case "error":
      default:
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-mono text-[10px]">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Error</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-brand flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Agent Tool Invocations</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Real-time trace of function calls executed by Aria against the backend database.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {toolCalls.length} executed
        </span>
      </div>

      {toolCalls.length === 0 ? (
        <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2.5 text-zinc-400">
            <Code2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            No tools invoked yet
          </p>
          <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
            When you ask about orders (e.g. &ldquo;Where is ORD-101?&rdquo;), Aria will autonomously trigger the <code className="text-zinc-700 dark:text-zinc-300 font-mono">get_order_details</code> tool.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {toolCalls.map((tc) => {
            const isExpanded = expandedIds[tc.id] ?? true // expanded by default
            return (
              <Card
                key={tc.id}
                className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/70 shadow-2xs rounded-xl"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{tc.name}</span>
                      </span>
                      {getStatusBadge(tc.status)}
                    </div>

                    <div className="flex items-center gap-2">
                      {tc.latency_ms && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {tc.latency_ms} ms
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExpand(tc.id)}
                        className="text-zinc-400 hover:text-zinc-600 p-0.5"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5">
                          Arguments:
                        </span>
                        <pre className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto border border-zinc-100 dark:border-zinc-800/60">
                          {JSON.stringify(tc.args, null, 2)}
                        </pre>
                      </div>

                      {Boolean(tc.result) && (
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5">
                            Result:
                          </span>
                          <pre className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 text-[11px] text-emerald-700 dark:text-emerald-400 overflow-x-auto border border-zinc-100 dark:border-zinc-800/60">
                            {JSON.stringify(tc.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
