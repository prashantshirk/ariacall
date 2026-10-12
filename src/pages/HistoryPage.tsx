import React, { useEffect, useState } from "react"
import { CallListItem } from "@/types"
import { fetchCalls } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronRight, History, PhoneCall, Sparkles } from "lucide-react"

export const HistoryPage: React.FC = () => {
  const [calls, setCalls] = useState<CallListItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const list = await fetchCalls()
        setCalls(list)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === "RESOLVED") return <Badge variant="success">RESOLVED</Badge>
    if (status === "ESCALATED") return <Badge variant="warning">ESCALATED</Badge>
    return <Badge variant="destructive">{status}</Badge>
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-brand text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Customer Call History</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Chronological log of past voice support conversations, order queries, and structured outcomes.
          </p>
        </div>

        <Button
          onClick={() => navigate("/")}
          className="text-xs flex items-center gap-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>New Voice Call</span>
        </Button>
      </div>

      <Card className="border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center p-6">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                No past call records
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                Completed voice calls will be automatically archived here with their full transcripts and JSON summaries.
              </p>
              <Button size="sm" onClick={() => navigate("/")} className="text-xs">
                Start your first call
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-50/70 dark:bg-zinc-950/40">
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead>Customer Intent</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    onClick={() => navigate(`/calls/${call.id}`)}
                    className="cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {new Date(call.started_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {call.customer_intent}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {call.order_id || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(call.resolution_status)}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {call.duration_s}s
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {call.tool_call_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium">
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
