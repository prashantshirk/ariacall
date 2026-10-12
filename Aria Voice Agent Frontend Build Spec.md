# Aria Voice Agent: Frontend Build Spec

*A brief for a coding agent. Build the complete frontend described here, in the order given. Do not ask for clarification unless something is truly blocking; make sensible choices and note them in the README.*

## 1. Context

We are building a browser-based **AI voice customer support agent** called **Aria** for a fictional D2C skincare brand, **Aura Skincare** (premium organic Indian skincare). A customer clicks **Start Call**, speaks into their microphone, and hears Aria reply through their speakers. After the call, the page shows a transcript and a structured JSON outcome.

The backend (built separately) runs on a VM, relays audio to a speech-to-speech model, executes tools (order lookup, cancel, ticket) against SQLite, and streams events to the browser over a WebSocket. **Your job is the frontend only.** It must be beautiful, fast, accessible, and usable by an evaluator in under 10 seconds with no instructions.

### Must-have screens and features

1. **Start Call** and **End Call** buttons.
2. **Live state indicator**: Idle, Listening, Thinking, Speaking (plus Connecting, Busy and Error).
3. **Test Orders helper panel** on the page, showing ORD-101, ORD-102, ORD-103 with their details, with a one-click copy of each ID.
4. **Live transcript** during the call.
5. **Tool-call trace** during the call (each tool call, its arguments, result and latency).
6. **Post-call summary screen**: chronological transcript and the structured JSON outcome (with copy and download).
7. **Call history page** listing past calls.
8. **Demo controls**: a Reset demo data button.

## 2. Tech stack (fixed)

- **Vite + React 18 + TypeScript** (the build output is static files served by the backend)
- **Tailwind CSS v4** (via the `@tailwindcss/vite` plugin)
- **shadcn/ui** for all base components
- **lucide-react** for icons
- **framer-motion** for animation
- **react-router-dom** for routing (`/` and `/history` and `/calls/:id`)
- **sonner** (shadcn Sonner) for toasts
- **zustand** for client state
- No other UI libraries. No CSS frameworks besides Tailwind.

## 3. Project setup commands

Run these exactly, then follow the current shadcn Vite installation docs if any prompt differs.

```bash
npm create vite@latest aria-frontend -- --template react-ts
cd aria-frontend
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom zustand framer-motion lucide-react sonner clsx tailwind-merge
npm install -D @types/node
```

Configure the `@` path alias in `vite.config.ts` and `tsconfig.json` / `tsconfig.app.json` (`"@/*": ["./src/*"]`), add the Tailwind plugin, and add a dev proxy:

```ts
// vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
})
```

Initialise shadcn and add every component we will use:

```bash
npx shadcn@latest init
npx shadcn@latest add button card badge tabs scroll-area separator sonner dialog sheet tooltip skeleton progress alert avatar table accordion switch select dropdown-menu hover-card collapsible
```

Create `.env.example`:

```bash
# Leave empty to use same-origin (production, served by the backend)
VITE_API_BASE=
# Set to 1 to run the whole UI against a built-in fake backend (no server needed)
VITE_MOCK=0
```

## 4. Design direction

The look should feel like a premium wellness brand, calm and modern, not a generic dashboard.

- **Theme:** dark by default with a light-mode toggle (shadcn theme provider, class strategy). Both themes must look finished.
- **Palette (define as CSS variables in the shadcn theme):** deep ink background (`#0B0F0E`), surface cards slightly lighter with a subtle 1px border, primary **sage green** (`#8FB8A0`), warm **cream** text (`#F4EFE6`), soft **gold** accent (`#D9B779`) for highlights, and muted rose (`#E7A8A0`) for destructive and error states.
- **Typography:** `Fraunces` (serif) for headings and the brand name, `Inter` for UI text, `JetBrains Mono` for IDs, JSON and tool traces. Load via `@fontsource` packages.
- **Surfaces:** rounded-2xl cards, soft glass effect (backdrop blur) on the header and the call stage, a faint radial gradient glow behind the central orb, and a subtle noise or grain overlay at very low opacity.
- **Motion:** smooth, restrained. Use framer-motion for panel transitions, message entrance, and the orb. Respect `prefers-reduced-motion`.
- **Layout:** max width 1400px. Two columns on desktop (call stage on the left about 5/12, tabbed panels on the right about 7/12), stacked on mobile. The call stage stays visible and the Start/End button is always reachable on mobile (sticky bottom bar).

## 5. Information architecture

```
/                  Call page (idle -> live -> post-call summary)
/history           Past calls table
/calls/:id         Past call detail (same summary view as post-call)
```

### Header

Brand mark (a small leaf or droplet icon) with "Aura Skincare" and a subtle "Aria · Voice Support Demo" tag, nav links (Call, History), a theme toggle, and a **Reset demo data** button inside a dropdown menu with a confirmation `Dialog`.

### Call page, left column: the Call Stage (Card)

- **Aria avatar orb**: a large animated orb (SVG or CSS gradient circle) that visibly changes by state:
  - *Idle*: slow gentle breathing glow, muted sage.
  - *Connecting*: spinning ring.
  - *Listening*: pulses in sync with the **microphone input level**, sage green.
  - *Thinking*: swirling or shimmering gradient, gold.
  - *Speaking*: waveform ripples synced to the **agent output level**, bright sage to cream.
  - *Busy / Error*: rose tint with an icon.
- **State badge** (shadcn `Badge`) with a colored dot and text: Idle / Connecting / Listening / Thinking / Speaking.
- **Call timer** (mm:ss) and a small connection-quality dot.
- **Live caption line** under the orb showing the latest partial or final utterance (customer in cream, Aria in sage).
- **Controls**: a big primary **Start Call** button (mic icon). While live it is replaced by a destructive **End Call** button. Add a **Mute** toggle. Keyboard shortcut: `Space` starts or ends the call when focus is not in an input.
- **Suggested prompts card** (collapsed by default, `Collapsible`): short example things to say, such as "Where is my order ORD-101?", "Can I return my sunscreen? It's ORD-102", "Cancel ORD-103", "Do you charge for shipping?", "Can you book me a flight to Goa?". Each chip is just a hint, not clickable.

### Call page, right column: Tabs (shadcn `Tabs`)

1. **Transcript** (`ScrollArea`): chat-bubble style, customer right-aligned, Aria left-aligned with the avatar, timestamps, auto-scroll that pauses if the user scrolls up (show a "Jump to latest" button). Partial utterances render in a lighter style and are replaced when final. Show a typing/thinking indicator while the state is Thinking.
2. **Tool Trace**: one `Card` per tool call with the tool name, a status badge (Running spinner / Success / Error / Not eligible), collapsible arguments and result rendered as pretty JSON in monospace, and the latency in ms. Order newest at the bottom. Show an empty state explaining that tool calls appear here.
3. **Test Orders**: three `Card`s, one per order, with ID (copy button using a `Tooltip` "Copied"), customer, product, value, status as a colored `Badge` (Out for Delivery = gold, Delivered = sage, Processing = blue-ish, Cancelled = rose), and notes. Data comes from `GET /api/orders` so it reflects live DB changes (for example after a cancellation). Add a small "Try saying" line under each card.
4. **Brand Policies** (`Accordion`): Shipping, Returns & Refunds, Cancellation, Cash on Delivery, with the policy text below. This helps evaluators craft test cases.

Policy text to hardcode in the Accordion:

- **Shipping:** Free delivery above ₹499; ₹50 fee below ₹499; standard delivery 3-5 business days.
- **Returns & Refunds:** Returns within 7 days of delivery for unopened, unused products in original packaging. Damaged or defective items must be reported within 48 hours of delivery with photos for replacement.
- **Cancellation:** Only while status is Processing. Once Shipped or Out for Delivery it cannot be cancelled (customer may refuse delivery at the doorstep).
- **Cash on Delivery:** Available for orders up to ₹2,500, payable by cash or UPI at the door.

### Post-call summary view (replaces the call stage content when a call ends)

Use a clean full-width layout with a `Card` header showing: outcome badges (customer intent, resolution status with color: RESOLVED sage, ESCALATED gold, UNRESOLVED rose), order ID chip, duration, and number of tool calls. Then two columns or tabs:

- **Transcript**: the final, chronological transcript.
- **Structured outcome**: syntax-highlighted JSON in a monospace block with **Copy JSON** and **Download .json** buttons. Show a `Skeleton` while the summary is generating (it arrives asynchronously after the call ends).

Buttons: **Start new call** and **View history**. Per-turn latency stats (average and p95 time-to-first-audio) go in a small stat row.

Example outcome JSON the UI must render (the schema may gain extra fields; render unknown fields gracefully):

```json
{
  "customer_intent": "ORDER_TRACKING",
  "order_id": "ORD-101",
  "resolution_status": "RESOLVED",
  "call_summary": "Customer asked about the delivery status of ORD-101. The order is out for delivery and expected by 6 PM today."
}
```

### History page

A shadcn `Table` with columns: Date/time, Customer intent, Order ID, Status badge, Duration, Tool calls. Rows are clickable and open `/calls/:id`. Include a loading `Skeleton` state and a friendly empty state.

## 6. Backend contract (frontend must implement exactly this)

### REST

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/orders` | `Order[]` |
| POST | `/api/demo/reset` | `{ ok: true }` |
| GET | `/api/calls` | `CallListItem[]` |
| GET | `/api/calls/:id` | `CallDetail` (transcript, tool calls, summary or `null` if still generating) |

```ts
type Order = {
  order_id: string; customer: string; product: string; value: number;
  status: "Processing" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  notes: string;
}
type Turn = { speaker: "customer" | "agent"; text: string; ts: number }
type ToolCall = { id: string; name: string; args: unknown; result?: unknown; status: "running" | "success" | "error" | "not_eligible"; latency_ms?: number; ts: number }
type Outcome = { customer_intent: string; order_id: string | null; resolution_status: string; call_summary: string; [k: string]: unknown }
type CallDetail = { id: string; started_at: number; duration_s: number; turns: Turn[]; tool_calls: ToolCall[]; summary: Outcome | null; latency: { avg_ttfa_ms: number; p95_ttfa_ms: number } }
```

### WebSocket: `/ws/call` (use `wss://` automatically when the page is https)

**Client to server**

- Binary frames: raw **PCM16 little-endian, mono, 16 kHz** microphone audio, about 20-40 ms per frame.
- Text JSON: `{"type":"start"}` once after the socket opens, `{"type":"end"}` to finish, `{"type":"mute","value":true|false}`.

**Server to client**

- Binary frames: raw **PCM16 little-endian, mono, 24 kHz** agent audio.
- Text JSON events:
  - `{"type":"state","state":"listening|thinking|speaking|idle"}`
  - `{"type":"busy"}` (another call holds the single free session): show a friendly "Aria is helping another caller, please retry in a minute" `Alert` with a retry button.
  - `{"type":"transcript","speaker":"customer|agent","text":"...","final":true|false,"ts":123}`
  - `{"type":"tool_call","id":"t1","name":"get_order_details","args":{},"status":"running"}` then the same `id` with `status` and `result`, `latency_ms`
  - `{"type":"interrupted"}` (barge-in): immediately flush and stop all queued agent audio
  - `{"type":"error","message":"..."}`
  - `{"type":"ended","call_id":"abc"}`: navigate to the summary view and poll `GET /api/calls/:id` every 1.5 s (up to 30 s) until `summary` is non-null

## 7. Audio implementation requirements

This is the most technical part. Do it carefully.

**Capture (`useMicCapture` hook)**

- `navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`.
- Use an **AudioWorklet** (`public/worklets/pcm-capture.js`) to read Float32 samples, **downsample to 16 kHz**, convert to Int16, and post \~30 ms chunks to the main thread, which sends them as binary WebSocket frames.
- Expose a smoothed RMS **input level** (0-1) for the orb.
- Handle permission denied with a clear `Alert` that explains how to enable the microphone, and a retry button.

```js
// public/worklets/pcm-capture.js (sketch; finish and harden it)
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = []; this.ratio = sampleRate / 16000; this.acc = 0; }
  process(inputs) {
    const ch = inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += 1;
      if (this.acc >= this.ratio) { this.acc -= this.ratio; this.buf.push(ch[i]); }
    }
    if (this.buf.length >= 480) { // 30 ms at 16 kHz
      const out = new Int16Array(this.buf.length);
      for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, this.buf[i])) * 0x7fff;
      this.port.postMessage(out.buffer, [out.buffer]);
      this.buf = [];
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
```

**Playback (`usePcmPlayer` hook)**

- Create an `AudioContext({ sampleRate: 24000 })` after the user gesture (the Start Call click).
- Convert incoming Int16 frames to Float32 and **schedule gapless playback** with `AudioBufferSourceNode`s using a running `nextStartTime`.
- On `interrupted`: stop all scheduled sources immediately, clear the queue, reset `nextStartTime`.
- Use an `AnalyserNode` to expose the agent **output level** for the orb.
- Call `audioContext.resume()` where needed for autoplay policies.

**Call lifecycle (`useCall` hook, state in zustand)**

- States: `idle`, `connecting`, `listening`, `thinking`, `speaking`, `busy`, `error`, `ended`.
- On Start Call: create the AudioContext, request the mic, open the socket, send `start`, begin streaming. On End Call or `ended`: stop the mic tracks, close the socket, stop playback, clear timers.
- Auto-reconnect is **not** required; on unexpected socket close show an error `Alert` with **Start again**.
- Always clean up on unmount and on `beforeunload`.

## 8. Mock mode (build this first)

With `VITE_MOCK=1` the app must run end to end with **no backend**, using a fake client that:

- Returns the three seed orders (ORD-101 Priya Sharma, Vitamin C Serum 30ml, ₹699, Out for Delivery, BlueDart BD-982103, expected by 6 PM today; ORD-102 Rahul Verma, Hydrating Sunscreen SPF 50, ₹499, Delivered, Delhivery DL-441029, delivered 14 days ago; ORD-103 Ananya Patel, Green Tea Face Wash + Toner, ₹850, Processing, ordered 3 hours ago, eligible for cancellation).
- Simulates a scripted call: state transitions on a timer, partial then final transcripts, one tool call going Running to Success, an orb level driven by a sine wave, then an `ended` event and a canned summary.

This lets design work and screenshots proceed independently of the backend.

## 9. Suggested file structure

```
src/
  main.tsx, App.tsx, routes.tsx
  components/
    layout/ Header.tsx, ThemeToggle.tsx, ResetDemoDialog.tsx
    call/ CallStage.tsx, AriaOrb.tsx, StateBadge.tsx, CallControls.tsx,
          LiveCaption.tsx, SuggestedPrompts.tsx
    panels/ TranscriptPanel.tsx, ToolTracePanel.tsx, TestOrdersPanel.tsx, PoliciesPanel.tsx
    summary/ SummaryView.tsx, OutcomeJson.tsx, StatRow.tsx
    ui/ (shadcn generated)
  hooks/ useCall.ts, useMicCapture.ts, usePcmPlayer.ts, useOrders.ts
  lib/ api.ts, ws-protocol.ts, mock.ts, format.ts, utils.ts
  store/ callStore.ts
  pages/ CallPage.tsx, HistoryPage.tsx, CallDetailPage.tsx
public/worklets/pcm-capture.js
```

## 10. Quality bar

- **Accessibility:** all controls keyboard reachable with visible focus rings, `aria-live="polite"` on the state badge and live caption, sufficient color contrast in both themes, the orb is decorative (`aria-hidden`) with the state conveyed by text.
- **Responsiveness:** works from 360px wide phones up to desktop; the mic works on mobile Safari and Chrome.
- **Performance:** no re-render storms from audio levels. Drive the orb with `requestAnimationFrame` and refs or CSS variables, not React state per frame.
- **Empty, loading and error states** everywhere: no orders, no history, socket failure, mic denied, busy, summary still generating.
- **No secrets in the frontend.** The API key never appears in client code.
- TypeScript strict mode, no `any` where a type is easy to write, ESLint clean.

## 11. Build, deploy and README

```bash
npm run build          # outputs ./dist
# the backend serves ./dist as static files and handles /api and /ws on the same origin
```

Add a `README.md` section for the frontend covering: setup, env vars, mock mode, the WebSocket protocol, the audio pipeline (capture to 16 kHz PCM16, playback at 24 kHz with barge-in flush), and design decisions. Keep it concise and accurate, because the author must be able to explain it in an interview.

## 12. Execution order

1. Project setup, Tailwind, shadcn init, theme and fonts.
2. Layout, header, theme toggle, routing.
3. Static versions of all panels with mock data (Test Orders, Policies, Transcript, Tool Trace).
4. The orb and call stage with the state machine in **mock mode**.
5. Post-call summary view and History pages.
6. Real audio hooks (capture worklet, PCM player) and the WebSocket client.
7. Barge-in flush, busy state, error and permission states.
8. Polish: motion, responsive pass, accessibility pass, README.

## 13. Definition of done

- [ ] Start Call opens the mic, streams audio, and Aria's replies play with no gaps or clicks.
- [ ] The state indicator and orb correctly show Listening, Thinking and Speaking.
- [ ] Interrupting Aria stops her audio immediately.
- [ ] Transcript and tool trace update live; the summary and JSON appear after the call.
- [ ] The Test Orders panel is visible on the main page, with copyable IDs and live status.
- [ ] Reset demo data works; History and call detail pages work.
- [ ] Looks polished in dark and light themes, on mobile and desktop.
- [ ] `VITE_MOCK=1` runs the entire UI without a backend.
- [ ] `npm run build` succeeds with no type errors.
