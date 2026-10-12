export type OrderStatus =
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"

export interface Order {
  order_id: string
  customer: string
  product: string
  value: number
  status: OrderStatus
  notes: string
}

export type Speaker = "customer" | "agent"

export interface Turn {
  id?: string
  speaker: Speaker
  text: string
  ts: number
  final?: boolean
}

export type ToolStatus = "running" | "success" | "error" | "not_eligible"

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown> | unknown
  result?: Record<string, unknown> | unknown
  status: ToolStatus
  latency_ms?: number
  ts: number
}

export interface Outcome {
  customer_intent: string
  order_id: string | null
  resolution_status: "RESOLVED" | "ESCALATED" | "UNRESOLVED" | string
  call_summary: string
  [key: string]: unknown
}

export interface CallLatency {
  avg_ttfa_ms: number
  p95_ttfa_ms: number
}

export interface CallDetail {
  id: string
  started_at: number
  duration_s: number
  turns: Turn[]
  tool_calls: ToolCall[]
  summary: Outcome | null
  latency: CallLatency
}

export interface CallListItem {
  id: string
  started_at: number
  duration_s: number
  customer_intent: string
  order_id: string | null
  resolution_status: string
  tool_call_count: number
}

export type AgentState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "busy"
  | "error"
  | "ended"

export type WsClientMessage =
  | { type: "start" }
  | { type: "end" }
  | { type: "mute"; value: boolean }

export type WsServerMessage =
  | { type: "state"; state: "idle" | "listening" | "thinking" | "speaking" }
  | { type: "busy" }
  | { type: "transcript"; speaker: "customer" | "agent"; text: string; final: boolean; ts: number }
  | { type: "tool_call"; id: string; name: string; args?: unknown; result?: unknown; status: ToolStatus; latency_ms?: number; ts?: number }
  | { type: "interrupted" }
  | { type: "error"; message: string }
  | { type: "ended"; call_id: string }
