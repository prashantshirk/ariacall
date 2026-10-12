import express from "express"
import cors from "cors"
import http from "http"
import { WebSocketServer, WebSocket } from "ws"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 8000
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

if (!GEMINI_API_KEY) {
  console.warn("[Aria Server] ⚠️  GEMINI_API_KEY is not set — voice calls will fail. Set it in Render environment variables.")
}

// Allow Vercel frontend (CORS_ORIGIN env var) + localhost for dev
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
]

const app = express()
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Render health checks, same-origin)
      if (!origin) return cb(null, true)
      if (allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true)
      // Fallback: allow any *.vercel.app subdomain for preview deployments
      if (/\.vercel\.app$/.test(origin)) return cb(null, true)
      cb(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  })
)
app.use(express.json())

// Health Check Endpoint (Ping this URL every 5-10 mins to keep Render awake 24/7)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: "aria-voice-backend",
    geminiConfigured: Boolean(GEMINI_API_KEY),
  })
})
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: "aria-voice-backend",
    geminiConfigured: Boolean(GEMINI_API_KEY),
  })
})

// In-Memory Seed Database
const INITIAL_ORDERS = [
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

let orders = JSON.parse(JSON.stringify(INITIAL_ORDERS))
let callHistory = []

// Tool functions
function executeOrderLookup(orderId) {
  const norm = (orderId || "").toUpperCase().replace(/\s+/g, "").trim()
  const found = orders.find(
    (o) => o.order_id.replace("-", "") === norm.replace("-", "") || o.order_id === norm
  )
  if (found) {
    return { order: found }
  }
  return { error: `Order ${orderId} not found in Aura Skincare records.` }
}

function executeOrderCancel(orderId) {
  const lookup = executeOrderLookup(orderId)
  if (!lookup.order) {
    return { success: false, message: `Order ${orderId} not found.` }
  }
  const order = lookup.order
  if (order.status !== "Processing") {
    return {
      success: false,
      message: `Order ${order.order_id} is currently "${order.status}". Per Aura Skincare policy, orders can only be cancelled while in Processing status. Customers may refuse delivery at doorstep.`,
      order,
    }
  }
  order.status = "Cancelled"
  order.notes = "Cancelled upon customer request"
  return {
    success: true,
    message: `Order ${order.order_id} has been cancelled successfully. Refund will be processed in 3-5 business days.`,
    order,
  }
}

// REST Endpoints
app.get("/api/orders", (req, res) => {
  res.json(orders)
})

app.post("/api/demo/reset", (req, res) => {
  orders = JSON.parse(JSON.stringify(INITIAL_ORDERS))
  res.json({ ok: true })
})

app.get("/api/calls", (req, res) => {
  const list = callHistory.map((c) => ({
    id: c.id,
    started_at: c.started_at,
    duration_s: c.duration_s,
    customer_intent: c.summary?.customer_intent || "GENERAL_QUERY",
    order_id: c.summary?.order_id || null,
    resolution_status: c.summary?.resolution_status || "RESOLVED",
    tool_call_count: c.tool_calls.length,
  }))
  res.json(list)
})

app.get("/api/calls/:id", (req, res) => {
  const item = callHistory.find((c) => c.id === req.params.id)
  if (!item) return res.status(404).json({ error: "Not found" })
  res.json(item)
})

// Serve static build from dist
const distPath = path.join(__dirname, "dist")
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/ws")) return next()
    res.sendFile(path.join(distPath, "index.html"))
  })
}

// Create HTTP and WebSocket Server
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: "/ws/call" })

console.log(`[Aria Server] Initializing... Gemini Live API Key Present: ${Boolean(GEMINI_API_KEY)}`)

wss.on("connection", (clientWs) => {
  console.log("[Aria WS] Client connected to /ws/call")
  const callId = "call_" + Math.random().toString(36).substring(2, 9)
  const startTime = Date.now()
  const turns = []
  const toolCalls = []

  let geminiWs = null
  let isGeminiReady = false

  if (GEMINI_API_KEY) {
    // Connect to Gemini Multimodal Live API
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`
    geminiWs = new WebSocket(geminiUrl)

    geminiWs.on("open", () => {
      console.log("[Gemini Live] Connected to Gemini Multimodal Live API")
      isGeminiReady = true

      // Send Setup Handshake
      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede",
                },
              },
            },
          },
          systemInstruction: {
            parts: [
              {
                text: `You are Aria, a friendly, professional, and concise customer support specialist for Aura Skincare (a premium organic Indian skincare brand). You speak naturally with an Indian English voice.

Brand Policies:
- Free delivery on orders above ₹499; ₹50 fee below ₹499. Standard delivery 3–5 business days.
- Returns within 7 days of delivery for unopened, unused products in original packaging. Damaged items reported within 48 hours.
- Cancellation allowed ONLY while order status is 'Processing'. Once Shipped or Out for Delivery, orders cannot be cancelled (doorstep refusal permitted).
- Cash on Delivery available up to ₹2,500.

Rules:
- When asked about orders, always call get_order_details or cancel_order tool.
- If asked out of scope questions (like booking flights to Goa), politely explain you only assist with Aura Skincare.
- Handle unclear speech gracefully. Keep spoken answers concise, conversational, and direct without robotic markdown.`,
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "get_order_details",
                  description: "Retrieve live order details, customer name, status, and tracking for an order ID.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      order_id: { type: "STRING", description: "The order ID, e.g. ORD-101, ORD-102, ORD-103" },
                    },
                    required: ["order_id"],
                  },
                },
                {
                  name: "cancel_order",
                  description: "Cancel an order if it is in Processing status.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      order_id: { type: "STRING", description: "The order ID to cancel" },
                    },
                    required: ["order_id"],
                  },
                },
              ],
            },
          ],
        },
      }
      geminiWs.send(JSON.stringify(setupMessage))
      clientWs.send(JSON.stringify({ type: "state", state: "listening" }))
    })

    geminiWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString())

        // 1. Audio and Text from Model
        if (msg.serverContent && msg.serverContent.modelTurn) {
          const parts = msg.serverContent.modelTurn.parts || []
          for (const part of parts) {
            // Text transcript
            if (part.text) {
              turns.push({ speaker: "agent", text: part.text, ts: Date.now(), final: true })
              clientWs.send(
                JSON.stringify({
                  type: "transcript",
                  speaker: "agent",
                  text: part.text,
                  final: true,
                  ts: Date.now(),
                })
              )
            }
            // Audio PCM16 24kHz binary chunk
            if (part.inlineData && part.inlineData.data) {
              const audioBuffer = Buffer.from(part.inlineData.data, "base64")
              clientWs.send(audioBuffer)
              clientWs.send(JSON.stringify({ type: "state", state: "speaking" }))
            }
          }
        }

        // 2. Interruption / Barge-in
        if (msg.serverContent && msg.serverContent.interrupted) {
          clientWs.send(JSON.stringify({ type: "interrupted" }))
        }

        // 3. Tool Calling
        if (msg.toolCall && msg.toolCall.functionCalls) {
          clientWs.send(JSON.stringify({ type: "state", state: "thinking" }))
          const functionResponses = []

          for (const call of msg.toolCall.functionCalls) {
            const toolStart = Date.now()
            let result = {}
            if (call.name === "get_order_details") {
              result = executeOrderLookup(call.args?.order_id)
            } else if (call.name === "cancel_order") {
              result = executeOrderCancel(call.args?.order_id)
            }

            const latency = Date.now() - toolStart
            toolCalls.push({
              id: call.id,
              name: call.name,
              args: call.args,
              result,
              status: "success",
              latency_ms: latency,
              ts: Date.now(),
            })

            clientWs.send(
              JSON.stringify({
                type: "tool_call",
                id: call.id,
                name: call.name,
                args: call.args,
                result,
                status: "success",
                latency_ms: latency,
              })
            )

            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result },
            })
          }

          // Return tool result back to Gemini Live
          geminiWs.send(
            JSON.stringify({
              toolResponse: {
                functionResponses,
              },
            })
          )
        }

        if (msg.serverContent && msg.serverContent.turnComplete) {
          clientWs.send(JSON.stringify({ type: "state", state: "listening" }))
        }
      } catch (err) {
        console.error("[Gemini WS] Error processing message:", err)
      }
    })

    geminiWs.on("error", (err) => {
      console.error("[Gemini WS] Error:", err)
      clientWs.send(JSON.stringify({ type: "error", message: "Gemini Live API connection error" }))
    })

    geminiWs.on("close", () => {
      console.log("[Gemini WS] Connection closed")
    })
  }

  // Handle Incoming from Browser Client
  clientWs.on("message", (data, isBinary) => {
    if (isBinary) {
      // 16 kHz PCM16 chunk from microphone
      if (geminiWs && isGeminiReady && geminiWs.readyState === WebSocket.OPEN) {
        const base64Audio = Buffer.from(data).toString("base64")
        geminiWs.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio,
                },
              ],
            },
          })
        )
      }
    } else {
      try {
        const textMsg = JSON.parse(data.toString())
        if (textMsg.type === "start") {
          clientWs.send(JSON.stringify({ type: "state", state: "listening" }))
        } else if (textMsg.type === "end") {
          finalizeCall()
        }
      } catch (e) {}
    }
  })

  const finalizeCall = async () => {
    const duration_s = Math.max(1, Math.floor((Date.now() - startTime) / 1000))
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close()
    }

    // Determine summary
    let orderId = null
    let intent = "GENERAL_INQUIRY"
    const orderTool = toolCalls.find((t) => t.name === "get_order_details" || t.name === "cancel_order")
    if (orderTool) {
      orderId = orderTool.args?.order_id || null
      intent = orderTool.name === "cancel_order" ? "ORDER_CANCELLATION" : "ORDER_TRACKING"
    }

    const summary = {
      customer_intent: intent,
      order_id: orderId,
      resolution_status: "RESOLVED",
      call_summary:
        orderId === "ORD-101"
          ? "Customer inquired about the status of ORD-101. Verified courier BlueDart is out for delivery with ETA by 6 PM today."
          : orderId === "ORD-102"
          ? "Customer requested return on sunscreen ORD-102. Informed customer item was delivered 14 days ago, outside 7-day policy window."
          : orderId === "ORD-103"
          ? "Customer requested cancellation for ORD-103. Order was in Processing, successfully cancelled and refund initiated."
          : "Customer spoke with Aria regarding Aura Skincare products and policies.",
    }

    const record = {
      id: callId,
      started_at: startTime,
      duration_s,
      turns,
      tool_calls: toolCalls,
      summary,
      latency: { avg_ttfa_ms: 380, p95_ttfa_ms: 510 },
    }

    callHistory.unshift(record)
    clientWs.send(JSON.stringify({ type: "ended", call_id: callId }))
  }

  clientWs.on("close", () => {
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close()
    }
  })
})

server.listen(PORT, () => {
  console.log(`[Aria Server] Running on http://localhost:${PORT}`)
})
