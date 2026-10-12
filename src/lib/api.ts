import { Order, CallListItem, CallDetail } from "@/types"
import {
  getMockOrders,
  resetMockOrders,
  getMockCallList,
  getMockCallById,
} from "./mockEngine"

const API_BASE = import.meta.env.VITE_API_BASE || ""
const IS_MOCK = import.meta.env.VITE_MOCK === "1"

export async function fetchOrders(): Promise<Order[]> {
  if (IS_MOCK) {
    return getMockOrders()
  }
  try {
    const res = await fetch(`${API_BASE}/api/orders`)
    if (!res.ok) throw new Error("Failed to fetch orders from server")
    return await res.json()
  } catch (err) {
    console.warn("Backend unavailable, falling back to mock orders:", err)
    return getMockOrders()
  }
}

export async function resetDemoData(): Promise<{ ok: boolean }> {
  if (IS_MOCK) {
    resetMockOrders()
    return { ok: true }
  }
  try {
    const res = await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" })
    if (!res.ok) throw new Error("Failed to reset demo data")
    return await res.json()
  } catch (err) {
    console.warn("Backend unavailable, resetting local mock data:", err)
    resetMockOrders()
    return { ok: true }
  }
}

export async function fetchCalls(): Promise<CallListItem[]> {
  if (IS_MOCK) {
    return getMockCallList()
  }
  try {
    const res = await fetch(`${API_BASE}/api/calls`)
    if (!res.ok) throw new Error("Failed to fetch calls from server")
    return await res.json()
  } catch (err) {
    console.warn("Backend unavailable, falling back to mock call list:", err)
    return getMockCallList()
  }
}

export async function fetchCallDetail(id: string): Promise<CallDetail | null> {
  if (IS_MOCK) {
    return getMockCallById(id)
  }
  try {
    const res = await fetch(`${API_BASE}/api/calls/${id}`)
    if (!res.ok) throw new Error("Failed to fetch call detail")
    return await res.json()
  } catch (err) {
    console.warn("Backend unavailable, falling back to mock call detail:", err)
    return getMockCallById(id)
  }
}
