import React, { useEffect, useState } from "react"
import { Order } from "@/types"
import { fetchOrders } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Copy, Package, RefreshCw, Sparkles } from "lucide-react"

interface TestOrdersPanelProps {
  onSelectPrompt?: (text: string) => void
}

export const TestOrdersPanel: React.FC<TestOrdersPanelProps> = ({ onSelectPrompt }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await fetchOrders()
      setOrders(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // Poll orders every 4s to catch cancellations
    const interval = setInterval(loadOrders, 4000)
    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Out for Delivery":
        return <Badge variant="warning">{status}</Badge>
      case "Delivered":
        return <Badge variant="success">{status}</Badge>
      case "Processing":
        return <Badge variant="info">{status}</Badge>
      case "Cancelled":
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSuggestedUtterance = (order: Order) => {
    if (order.order_id === "ORD-101") return "Where is my order ORD-101?"
    if (order.order_id === "ORD-102") return "Can I return sunscreen ORD-102?"
    if (order.order_id === "ORD-103") return "Cancel my order ORD-103"
    return `Check status of ${order.order_id}`
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-brand">
              Sample Orders Database
            </h4>
            <p className="text-[11px] text-zinc-400">
              Click any ID to copy it, or click the test prompt to query Aria directly.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadOrders}
            className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {orders.map((order) => {
            const suggestion = getSuggestedUtterance(order)
            return (
              <Card
                key={order.order_id}
                className="overflow-hidden border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all rounded-xl"
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.order_id)}
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            <span>{order.order_id}</span>
                            {copiedId === order.order_id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {copiedId === order.order_id ? "Copied!" : "Click to copy Order ID"}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {order.customer}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                      <Package className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{order.product}</span>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      ₹{order.value}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    {order.notes}
                  </div>

                  {onSelectPrompt && (
                    <button
                      type="button"
                      onClick={() => onSelectPrompt(suggestion)}
                      className="w-full text-left pt-1 flex items-center justify-between text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium group transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Try asking:</span>
                        <span className="italic font-normal text-zinc-600 dark:text-zinc-400">
                          &ldquo;{suggestion}&rdquo;
                        </span>
                      </span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        Send &rarr;
                      </span>
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
