import { create } from "zustand"
import { AgentState, Turn, ToolCall, Outcome, CallLatency } from "@/types"

interface CallState {
  state: AgentState
  callId: string | null
  startedAt: number | null
  durationSeconds: number
  isMuted: boolean
  connectionQuality: "good" | "fair" | "poor"
  turns: Turn[]
  liveCaption: Turn | null
  toolCalls: ToolCall[]
  currentSummary: Outcome | null
  isGeneratingSummary: boolean
  latencyStats: CallLatency | null
  micLevel: number
  agentLevel: number
  errorMessage: string | null

  // Actions
  setState: (state: AgentState) => void
  setMicLevel: (level: number) => void
  setAgentLevel: (level: number) => void
  setMuted: (isMuted: boolean) => void
  setConnectionQuality: (quality: "good" | "fair" | "poor") => void
  setErrorMessage: (msg: string | null) => void
  startCallSession: (id: string) => void
  updateDuration: () => void
  addOrUpdateTranscript: (speaker: "customer" | "agent", text: string, final: boolean, ts: number) => void
  addOrUpdateToolCall: (toolCall: Partial<ToolCall> & { id: string; name?: string }) => void
  finishCall: (callId: string, summary?: Outcome | null, latency?: CallLatency) => void
  setSummary: (summary: Outcome) => void
  resetCallState: () => void
}

export const useCallStore = create<CallState>((set, get) => ({
  state: "idle",
  callId: null,
  startedAt: null,
  durationSeconds: 0,
  isMuted: false,
  connectionQuality: "good",
  turns: [],
  liveCaption: null,
  toolCalls: [],
  currentSummary: null,
  isGeneratingSummary: false,
  latencyStats: null,
  micLevel: 0,
  agentLevel: 0,
  errorMessage: null,

  setState: (state) => set({ state }),
  setMicLevel: (micLevel) => set({ micLevel }),
  setAgentLevel: (agentLevel) => set({ agentLevel }),
  setMuted: (isMuted) => set({ isMuted }),
  setConnectionQuality: (connectionQuality) => set({ connectionQuality }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),

  startCallSession: (id) =>
    set({
      state: "listening",
      callId: id,
      startedAt: Date.now(),
      durationSeconds: 0,
      turns: [],
      liveCaption: null,
      toolCalls: [],
      currentSummary: null,
      isGeneratingSummary: false,
      latencyStats: null,
      errorMessage: null,
      isMuted: false,
    }),

  updateDuration: () => {
    const started = get().startedAt
    if (started) {
      set({ durationSeconds: Math.floor((Date.now() - started) / 1000) })
    }
  },

  addOrUpdateTranscript: (speaker, text, final, ts) => {
    const current = get().turns
    const newTurn: Turn = { speaker, text, ts, final }

    set({ liveCaption: newTurn })

    if (final) {
      set({
        turns: [...current, newTurn],
      })
    } else {
      // If there's an ongoing partial utterance by the same speaker, replace it or append
      const last = current[current.length - 1]
      if (last && last.speaker === speaker && !last.final) {
        const updated = [...current]
        updated[updated.length - 1] = newTurn
        set({ turns: updated })
      } else {
        set({ turns: [...current, newTurn] })
      }
    }
  },

  addOrUpdateToolCall: (incoming) => {
    const current = get().toolCalls
    const index = current.findIndex((tc) => tc.id === incoming.id)

    if (index >= 0) {
      const updated = [...current]
      updated[index] = {
        ...updated[index],
        ...incoming,
      } as ToolCall
      set({ toolCalls: updated })
    } else {
      const full: ToolCall = {
        id: incoming.id,
        name: incoming.name || "tool_call",
        args: incoming.args || {},
        result: incoming.result,
        status: incoming.status || "running",
        latency_ms: incoming.latency_ms,
        ts: incoming.ts || Date.now(),
      }
      set({ toolCalls: [...current, full] })
    }
  },

  finishCall: (callId, summary = null, latency) => {
    set({
      state: "ended",
      callId,
      currentSummary: summary,
      isGeneratingSummary: summary === null,
      latencyStats: latency || { avg_ttfa_ms: 380, p95_ttfa_ms: 540 },
    })
  },

  setSummary: (summary) => {
    set({
      currentSummary: summary,
      isGeneratingSummary: false,
    })
  },

  resetCallState: () => {
    set({
      state: "idle",
      callId: null,
      startedAt: null,
      durationSeconds: 0,
      isMuted: false,
      turns: [],
      liveCaption: null,
      toolCalls: [],
      currentSummary: null,
      isGeneratingSummary: false,
      latencyStats: null,
      micLevel: 0,
      agentLevel: 0,
      errorMessage: null,
    })
  },
}))
