import { Order, CallDetail, CallListItem, Turn, ToolCall, Outcome } from "@/types"

export const INITIAL_ORDERS: Order[] = [
  {
    order_id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    value: 699,
    status: "Out for Delivery",
    notes: "BlueDart — BD-982103. Expected by 6 PM today",
  },
  {
    order_id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    value: 499,
    status: "Delivered",
    notes: "Delhivery — DL-441029. Delivered 14 days ago",
  },
  {
    order_id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    value: 850,
    status: "Processing",
    notes: "Ordered 3 hours ago. Eligible for cancellation",
  },
]

const ORDERS_KEY = "aria_orders"
const CALLS_KEY = "aria_calls"

export function getMockOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // fallback
  }
  return [...INITIAL_ORDERS]
}

export function saveMockOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch (e) {}
}

export function resetMockOrders(): Order[] {
  const fresh = JSON.parse(JSON.stringify(INITIAL_ORDERS))
  saveMockOrders(fresh)
  return fresh
}

export function executeMockOrderLookup(orderId: string): { order?: Order; error?: string } {
  const normalized = orderId.toUpperCase().replace(/\s+/g, "").trim()
  const orders = getMockOrders()
  const found = orders.find(
    (o) => o.order_id.replace("-", "") === normalized.replace("-", "") || o.order_id === normalized
  )
  if (found) {
    return { order: found }
  }
  return { error: `I couldn't locate an order with ID ${orderId}. Could you please verify or repeat the order number?` }
}

export function executeMockOrderCancellation(orderId: string): { success: boolean; message: string; order?: Order } {
  const lookup = executeMockOrderLookup(orderId)
  if (!lookup.order) {
    return { success: false, message: `Order ${orderId} not found.` }
  }
  const order = lookup.order
  if (order.status !== "Processing") {
    return {
      success: false,
      message: `Order ${order.order_id} is currently "${order.status}". Per Aura Skincare policy, orders can only be cancelled while in Processing status. You may refuse delivery at the doorstep.`,
      order,
    }
  }

  // Update order
  const orders = getMockOrders()
  const idx = orders.findIndex((o) => o.order_id === order.order_id)
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], status: "Cancelled", notes: "Cancelled upon customer request" }
    saveMockOrders(orders)
    return {
      success: true,
      message: `Order ${order.order_id} has been cancelled successfully. Any payment made will be refunded within 3-5 business days.`,
      order: orders[idx],
    }
  }
  return { success: false, message: "Failed to update order status." }
}

// Initial mock call history
const INITIAL_CALLS: CallDetail[] = [
  {
    id: "call_m101",
    started_at: Date.now() - 1000 * 60 * 45, // 45 mins ago
    duration_s: 42,
    turns: [
      {
        speaker: "customer",
        text: "Hi, can you tell me where my order ORD-101 is?",
        ts: 1000,
        final: true,
      },
      {
        speaker: "agent",
        text: "Namaste! I'd be happy to check that for you. Let me look up order ORD-101 right away.",
        ts: 2800,
        final: true,
      },
      {
        speaker: "agent",
        text: "Thank you for waiting, Priya. Your Vitamin C Serum is currently out for delivery with BlueDart and is expected to arrive by 6 PM today.",
        ts: 5100,
        final: true,
      },
      {
        speaker: "customer",
        text: "Great, thank you so much!",
        ts: 7200,
        final: true,
      },
      {
        speaker: "agent",
        text: "You're most welcome! Have a wonderful day, and thank you for choosing Aura Skincare.",
        ts: 9300,
        final: true,
      },
    ],
    tool_calls: [
      {
        id: "tool_tc01",
        name: "get_order_details",
        args: { order_id: "ORD-101" },
        result: {
          order_id: "ORD-101",
          customer: "Priya Sharma",
          product: "Vitamin C Serum (30ml)",
          status: "Out for Delivery",
          tracking: "BlueDart — BD-982103",
          eta: "Today by 6:00 PM",
        },
        status: "success",
        latency_ms: 380,
        ts: 2900,
      },
    ],
    summary: {
      customer_intent: "ORDER_TRACKING",
      order_id: "ORD-101",
      resolution_status: "RESOLVED",
      call_summary:
        "Customer asked for tracking status on ORD-101. Verified courier BlueDart is out for delivery with expected delivery by 6 PM today.",
    },
    latency: {
      avg_ttfa_ms: 420,
      p95_ttfa_ms: 610,
    },
  },
  {
    id: "call_m102",
    started_at: Date.now() - 1000 * 60 * 180, // 3 hours ago
    duration_s: 58,
    turns: [
      {
        speaker: "customer",
        text: "I bought the sunscreen 14 days ago and opened it. Can I return it for a refund?",
        ts: 1100,
        final: true,
      },
      {
        speaker: "agent",
        text: "Hello! I understand you'd like to return your sunscreen. Let me check our policy details for you.",
        ts: 3200,
        final: true,
      },
      {
        speaker: "agent",
        text: "Per Aura Skincare's policy, returns are accepted within 7 days of delivery for unopened, unused products in original packaging. Since the product has been opened and delivered 14 days ago, we unfortunately cannot accept a return.",
        ts: 6400,
        final: true,
      },
      {
        speaker: "customer",
        text: "Understood, thanks for clarifying.",
        ts: 9500,
        final: true,
      },
      {
        speaker: "agent",
        text: "You're welcome! Please let us know if you need any skincare advice or help with anything else.",
        ts: 11800,
        final: true,
      },
    ],
    tool_calls: [
      {
        id: "tool_tc02",
        name: "get_order_details",
        args: { order_id: "ORD-102" },
        result: {
          order_id: "ORD-102",
          customer: "Rahul Verma",
          product: "Hydrating Sunscreen SPF 50",
          status: "Delivered",
          delivered_days_ago: 14,
        },
        status: "success",
        latency_ms: 410,
        ts: 3300,
      },
    ],
    summary: {
      customer_intent: "RETURN_REQUEST",
      order_id: "ORD-102",
      resolution_status: "RESOLVED",
      call_summary:
        "Customer inquired regarding return of opened sunscreen after 14 days. Explained 7-day unopened policy and politely declined return.",
    },
    latency: {
      avg_ttfa_ms: 460,
      p95_ttfa_ms: 680,
    },
  },
]

export function getMockCalls(): CallDetail[] {
  try {
    const raw = localStorage.getItem(CALLS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return [...INITIAL_CALLS]
}

export function saveMockCall(call: CallDetail): void {
  try {
    const calls = getMockCalls()
    const filtered = calls.filter((c) => c.id !== call.id)
    localStorage.setItem(CALLS_KEY, JSON.stringify([call, ...filtered]))
  } catch (e) {}
}

export function getMockCallById(id: string): CallDetail | null {
  const calls = getMockCalls()
  return calls.find((c) => c.id === id) || null
}

export function getMockCallList(): CallListItem[] {
  const calls = getMockCalls()
  return calls.map((c) => ({
    id: c.id,
    started_at: c.started_at,
    duration_s: c.duration_s,
    customer_intent: c.summary?.customer_intent || "GENERAL_QUERY",
    order_id: c.summary?.order_id || null,
    resolution_status: c.summary?.resolution_status || "RESOLVED",
    tool_call_count: c.tool_calls.length,
  }))
}
