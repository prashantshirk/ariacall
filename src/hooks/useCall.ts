import { useEffect, useRef, useCallback } from "react"
import { useCallStore } from "@/store/callStore"
import { useMicCapture } from "./useMicCapture"
import { usePcmPlayer } from "./usePcmPlayer"
import { fetchCallDetail, fetchOrders } from "@/lib/api"
import {
  executeMockOrderLookup,
  executeMockOrderCancellation,
  saveMockCall,
} from "@/lib/mockEngine"
import { Outcome, CallDetail } from "@/types"

const IS_MOCK = import.meta.env.VITE_MOCK === "1"

export function useCall() {
  const {
    state,
    callId,
    durationSeconds,
    isMuted,
    errorMessage,
    turns,
    toolCalls,
    setState,
    setMicLevel,
    setAgentLevel,
    setMuted,
    setErrorMessage,
    startCallSession,
    updateDuration,
    addOrUpdateTranscript,
    addOrUpdateToolCall,
    finishCall,
    setSummary,
    resetCallState,
  } = useCallStore()

  const socketRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<number | null>(null)
  const pollTimerRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mockScriptTimeoutRef = useRef<number[]>([])

  // PCM player for agent audio
  const pcmPlayer = usePcmPlayer({
    onLevel: (level) => {
      setAgentLevel(level)
    },
  })

  // PCM capture for microphone audio
  const micCapture = useMicCapture({
    onPcmChunk: (chunk) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isMuted) {
        socketRef.current.send(chunk)
      }
    },
    onLevel: (level) => {
      if (!isMuted) {
        setMicLevel(level)
      } else {
        setMicLevel(0)
      }
    },
  })

  // Call timer effect
  useEffect(() => {
    if (state !== "idle" && state !== "ended" && state !== "error" && state !== "busy") {
      timerRef.current = window.setInterval(() => {
        updateDuration()
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state, updateDuration])

  // Cleanup on unmount or beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      endCall()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      mockScriptTimeoutRef.current.forEach(clearTimeout)
      pcmPlayer.stop()
      micCapture.stopCapture()
    }
  }, [])

  // Web Speech synthesis for mock mode (Indian accent preferred)
  const speakMockResponse = useCallback(
    (text: string, onDone?: () => void) => {
      if (!("speechSynthesis" in window)) {
        if (onDone) setTimeout(onDone, 2000)
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthRef.current = utterance

      // Try selecting Indian English or female voice
      const voices = window.speechSynthesis.getVoices()
      const indianVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("en-in") ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("neerja") ||
          v.name.toLowerCase().includes("priya")
      ) || voices.find((v) => v.lang.toLowerCase().startsWith("en"))

      if (indianVoice) utterance.voice = indianVoice
      utterance.rate = 1.05
      utterance.pitch = 1.0

      // Mock audio visualizer level while speaking
      let animId: number
      const startSimulatingLevel = () => {
        const loop = () => {
          if (window.speechSynthesis.speaking) {
            const simulatedLevel = 0.35 + Math.random() * 0.45
            setAgentLevel(simulatedLevel)
            animId = requestAnimationFrame(loop)
          } else {
            setAgentLevel(0)
          }
        }
        loop()
      }

      utterance.onstart = () => {
        setState("speaking")
        startSimulatingLevel()
      }

      utterance.onend = () => {
        cancelAnimationFrame(animId)
        setAgentLevel(0)
        setState("listening")
        if (onDone) onDone()
      }

      utterance.onerror = () => {
        cancelAnimationFrame(animId)
        setAgentLevel(0)
        setState("listening")
        if (onDone) onDone()
      }

      window.speechSynthesis.speak(utterance)
    },
    [setAgentLevel, setState]
  )

  // Handle mock conversation response
  const processMockUserInput = useCallback(
    async (userInput: string) => {
      const lower = userInput.toLowerCase()
      addOrUpdateTranscript("customer", userInput, true, Date.now())
      setState("thinking")

      // Detect Intent and Tool calls
      if (lower.includes("101") || lower.includes("ord-101") || lower.includes("serum")) {
        const toolId = "tc_" + Date.now()
        addOrUpdateToolCall({
          id: toolId,
          name: "get_order_details",
          args: { order_id: "ORD-101" },
          status: "running",
          ts: Date.now(),
        })

        setTimeout(() => {
          const lookup = executeMockOrderLookup("ORD-101")
          addOrUpdateToolCall({
            id: toolId,
            status: "success",
            result: lookup.order,
            latency_ms: 320,
          })

          const reply =
            "I checked order ORD-101 for Priya Sharma. Your Vitamin C Serum is out for delivery with BlueDart and is scheduled to reach you by 6 PM today!"
          addOrUpdateTranscript("agent", reply, true, Date.now())
          speakMockResponse(reply)
        }, 900)
      } else if (lower.includes("102") || lower.includes("sunscreen") || lower.includes("return")) {
        const toolId = "tc_" + Date.now()
        addOrUpdateToolCall({
          id: toolId,
          name: "get_order_details",
          args: { order_id: "ORD-102" },
          status: "running",
          ts: Date.now(),
        })

        setTimeout(() => {
          const lookup = executeMockOrderLookup("ORD-102")
          addOrUpdateToolCall({
            id: toolId,
            status: "success",
            result: lookup.order,
            latency_ms: 290,
          })

          const reply =
            "I see order ORD-102 for Rahul Verma was delivered 14 days ago. Per Aura Skincare's policy, returns are only accepted within 7 days of delivery for unopened, unused products. We cannot process a return for this item, but I'm happy to help with anything else!"
          addOrUpdateTranscript("agent", reply, true, Date.now())
          speakMockResponse(reply)
        }, 900)
      } else if (lower.includes("103") || lower.includes("cancel")) {
        const toolId = "tc_" + Date.now()
        addOrUpdateToolCall({
          id: toolId,
          name: "cancel_order",
          args: { order_id: "ORD-103" },
          status: "running",
          ts: Date.now(),
        })

        setTimeout(() => {
          const res = executeMockOrderCancellation("ORD-103")
          addOrUpdateToolCall({
            id: toolId,
            status: res.success ? "success" : "not_eligible",
            result: res,
            latency_ms: 410,
          })

          const reply = res.success
            ? "Your order ORD-103 for the Green Tea Face Wash has been successfully cancelled as it was in Processing. Any prepaid amount will be refunded within 3 to 5 business days."
            : res.message
          addOrUpdateTranscript("agent", reply, true, Date.now())
          fetchOrders() // refresh order cards
          speakMockResponse(reply)
        }, 1100)
      } else if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("charge")) {
        setTimeout(() => {
          const reply =
            "At Aura Skincare, delivery is free on all orders above ₹499! For orders below ₹499, there is a nominal ₹50 shipping charge. Standard delivery takes 3 to 5 business days."
          addOrUpdateTranscript("agent", reply, true, Date.now())
          speakMockResponse(reply)
        }, 800)
      } else if (lower.includes("flight") || lower.includes("goa") || lower.includes("hotel") || lower.includes("ticket")) {
        // Out of scope guardrail test
        setTimeout(() => {
          const reply =
            "I'm sorry, but I can only assist with Aura Skincare products, policies, and orders. I'm not able to book flights or external travel services."
          addOrUpdateTranscript("agent", reply, true, Date.now())
          speakMockResponse(reply)
        }, 700)
      } else {
        // Graceful general response
        setTimeout(() => {
          const reply =
            "Namaste! Welcome to Aura Skincare support. You can ask me to track your orders, inquire about our shipping and return policies, or cancel an order."
          addOrUpdateTranscript("agent", reply, true, Date.now())
          speakMockResponse(reply)
        }, 800)
      }
    },
    [addOrUpdateTranscript, addOrUpdateToolCall, speakMockResponse, setState]
  )

  // Start Call
  const startCall = useCallback(async () => {
    resetCallState()
    setState("connecting")
    const newCallId = "call_" + Math.random().toString(36).substring(2, 9)

    // Initialise audio playback context
    pcmPlayer.initContext()

    // Capture microphone
    const micStarted = await micCapture.startCapture()
    if (!micStarted) {
      setState("error")
      setErrorMessage(micCapture.permissionError || "Microphone permission required.")
      return
    }

    startCallSession(newCallId)

    // Check if connecting to live WebSocket backend or Mock mode
    if (!IS_MOCK) {
      try {
        const apiBase = import.meta.env.VITE_API_BASE || ""
        let wsUrl: string
        if (apiBase) {
          const parsed = new URL(apiBase.startsWith("http") ? apiBase : `https://${apiBase}`)
          const wsProto = parsed.protocol === "https:" ? "wss:" : "ws:"
          wsUrl = `${wsProto}//${parsed.host}/ws/call`
        } else {
          const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
          wsUrl = `${proto}//${window.location.host}/ws/call`
        }
        console.log(`[Aria] Connecting voice WebSocket to: ${wsUrl}`)
        const ws = new WebSocket(wsUrl)
        ws.binaryType = "arraybuffer"
        socketRef.current = ws

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "start" }))
          setState("listening")
        }

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Agent audio PCM16 24kHz
            pcmPlayer.playPcmChunk(event.data)
            setState("speaking")
          } else if (typeof event.data === "string") {
            try {
              const msg = JSON.parse(event.data)
              switch (msg.type) {
                case "state":
                  setState(msg.state)
                  break
                case "busy":
                  setState("busy")
                  break
                case "transcript":
                  addOrUpdateTranscript(msg.speaker, msg.text, msg.final, msg.ts)
                  break
                case "tool_call":
                  addOrUpdateToolCall(msg)
                  break
                case "interrupted":
                  pcmPlayer.flush()
                  break
                case "error":
                  setErrorMessage(msg.message)
                  setState("error")
                  break
                case "ended":
                  handleCallEndedOnServer(msg.call_id)
                  break
              }
            } catch (parseErr) {
              console.error("WS Parse error:", parseErr)
            }
          }
        }

        ws.onerror = (e) => {
          console.warn("WebSocket error, falling back to mock engine:", e)
          initMockCall(newCallId)
        }

        ws.onclose = () => {
          // If socket closed unexpectedly while in active call
          if (state !== "idle" && state !== "ended") {
            // gracefully close
          }
        }
        return
      } catch (wsErr) {
        console.warn("Live WS connection failed, activating standalone mock engine:", wsErr)
      }
    }

    // Standalone Mock Mode
    initMockCall(newCallId)
  }, [
    resetCallState,
    setState,
    pcmPlayer,
    micCapture,
    startCallSession,
    setErrorMessage,
    addOrUpdateTranscript,
    addOrUpdateToolCall,
    state,
  ])

  // Mock call setup with Web Speech API for interactive testing
  const initMockCall = useCallback(
    (newCallId: string) => {
      setState("listening")

      // Welcome message from Aria
      const welcome =
        "Namaste! Welcome to Aura Skincare. My name is Aria. How may I assist you with your orders or skincare today?"
      setTimeout(() => {
        addOrUpdateTranscript("agent", welcome, true, Date.now())
        speakMockResponse(welcome)
      }, 700)

      // Start Browser Speech Recognition if supported
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = "en-IN"

          recognition.onresult = (event: any) => {
            let interim = ""
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                const finalTranscript = event.results[i][0].transcript.trim()
                if (finalTranscript) {
                  // User interrupted or finished speaking
                  pcmPlayer.flush()
                  window.speechSynthesis?.cancel()
                  processMockUserInput(finalTranscript)
                }
              } else {
                interim += event.results[i][0].transcript
                addOrUpdateTranscript("customer", interim, false, Date.now())
              }
            }
          }

          recognition.onerror = (event: any) => {
            console.log("Speech recognition notice:", event.error)
          }

          recognition.start()
          recognitionRef.current = recognition
        } catch (e) {
          console.log("Speech recognition initialization note:", e)
        }
      }
    },
    [setState, addOrUpdateTranscript, speakMockResponse, pcmPlayer, processMockUserInput]
  )

  // End Call
  const endCall = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      recognitionRef.current = null
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "end" }))
      socketRef.current.close()
    }

    pcmPlayer.stop()
    micCapture.stopCapture()

    const currentCallId = callId || "call_" + Math.random().toString(36).substring(2, 9)
    const finalTurns = useCallStore.getState().turns
    const finalTools = useCallStore.getState().toolCalls

    // Generate outcome summary
    let orderIdDetected: string | null = null
    let intentDetected = "GENERAL_INQUIRY"
    let statusDetected = "RESOLVED"

    // Check if order was touched
    const orderTool = finalTools.find((t) => t.name === "get_order_details" || t.name === "cancel_order")
    if (orderTool) {
      const args = orderTool.args as any
      orderIdDetected = args?.order_id || "ORD-101"
      if (orderTool.name === "cancel_order") {
        intentDetected = "ORDER_CANCELLATION"
      } else {
        intentDetected = "ORDER_TRACKING"
      }
    } else {
      // Check transcript text for order keywords
      const textAll = finalTurns.map((t) => t.text).join(" ")
      if (textAll.includes("101")) {
        orderIdDetected = "ORD-101"
        intentDetected = "ORDER_TRACKING"
      } else if (textAll.includes("102") || textAll.toLowerCase().includes("return")) {
        orderIdDetected = "ORD-102"
        intentDetected = "RETURN_REQUEST"
      } else if (textAll.includes("103") || textAll.toLowerCase().includes("cancel")) {
        orderIdDetected = "ORD-103"
        intentDetected = "ORDER_CANCELLATION"
      }
    }

    const mockSummary: Outcome = {
      customer_intent: intentDetected,
      order_id: orderIdDetected,
      resolution_status: statusDetected,
      call_summary:
        orderIdDetected === "ORD-101"
          ? "Customer inquired about delivery status of ORD-101. Verified courier BlueDart is out for delivery and expected by 6 PM today."
          : orderIdDetected === "ORD-102"
          ? "Customer requested return on ORD-102 (SPF 50 sunscreen). Informed customer that order was delivered 14 days ago, outside 7-day policy window."
          : orderIdDetected === "ORD-103"
          ? "Customer requested cancellation for ORD-103 (Green Tea Face Wash + Toner). Successfully cancelled order and initiated refund."
          : "Customer inquired about Aura Skincare brand policies. Agent provided clear details regarding shipping and delivery guidelines.",
    }

    const callDetail: CallDetail = {
      id: currentCallId,
      started_at: useCallStore.getState().startedAt || Date.now() - 35000,
      duration_s: useCallStore.getState().durationSeconds || 35,
      turns: finalTurns,
      tool_calls: finalTools,
      summary: mockSummary,
      latency: {
        avg_ttfa_ms: 385,
        p95_ttfa_ms: 540,
      },
    }

    saveMockCall(callDetail)
    finishCall(currentCallId, mockSummary, callDetail.latency)
  }, [callId, pcmPlayer, micCapture, finishCall])

  const handleCallEndedOnServer = useCallback(
    (endedCallId: string) => {
      finishCall(endedCallId, null)
      // Poll server for summary every 1.5s up to 30s
      let elapsed = 0
      pollTimerRef.current = window.setInterval(async () => {
        elapsed += 1.5
        const detail = await fetchCallDetail(endedCallId)
        if (detail && detail.summary) {
          setSummary(detail.summary)
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        } else if (elapsed >= 30) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
      }, 1500)
    },
    [finishCall, setSummary]
  )

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setMuted(nextMuted)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "mute", value: nextMuted }))
    }
  }, [isMuted, setMuted])

  // Keyboard shortcut: Spacebar to toggle call
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const target = e.target as HTMLElement
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return
        }
        e.preventDefault()
        if (state === "idle" || state === "ended") {
          startCall()
        } else if (
          state === "listening" ||
          state === "thinking" ||
          state === "speaking" ||
          state === "connecting"
        ) {
          endCall()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state, startCall, endCall])

  return {
    state,
    callId,
    durationSeconds,
    isMuted,
    errorMessage,
    turns,
    toolCalls,
    startCall,
    endCall,
    toggleMute,
    processMockUserInput,
    resetCallState,
  }
}
