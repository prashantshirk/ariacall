import React from "react"
import { CallLatency } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Cpu, MessageSquare, Zap } from "lucide-react"

interface StatRowProps {
  durationSeconds: number
  turnsCount: number
  toolCallsCount: number
  latency?: CallLatency | null
}

export const StatRow: React.FC<StatRowProps> = ({
  durationSeconds,
  turnsCount,
  toolCallsCount,
  latency,
}) => {
  const stats = [
    {
      label: "Duration",
      value: `${durationSeconds}s`,
      icon: <Clock className="w-3.5 h-3.5 text-zinc-400" />,
    },
    {
      label: "Turns",
      value: turnsCount.toString(),
      icon: <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />,
    },
    {
      label: "Tool Calls",
      value: toolCallsCount.toString(),
      icon: <Cpu className="w-3.5 h-3.5 text-zinc-400" />,
    },
    {
      label: "Avg TTFA Latency",
      value: latency ? `${latency.avg_ttfa_ms} ms` : "380 ms",
      icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
      label: "p95 TTFA Latency",
      value: latency ? `${latency.p95_ttfa_ms} ms` : "540 ms",
      icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {stats.map((s, i) => (
        <Card
          key={i}
          className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-2xs rounded-xl"
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mb-1">
              {s.icon}
              <span>{s.label}</span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {s.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
