# Aria - Aura Skincare Voice Support

Aria is a browser based voice support demo for Aura Skincare, a fictional Indian skincare brand. A customer can ask about a product, shipping, returns, or an order. Aria can look up sample orders, explain the brand policies, and show a transcript and summary after the call.

## Try the app

The app has a **Start Call** button, live call status, sample order cards, a transcript, and a tool activity panel. Allow microphone access, use headphones if possible, and ask about one of the sample orders:

| Order | Customer | Product | Status |
| --- | --- | --- | --- |
| ORD-101 | Priya Sharma | Vitamin C Serum | Out for Delivery; expected by 6 PM today |
| ORD-102 | Rahul Verma | Hydrating Sunscreen SPF 50 | Delivered 14 days ago |
| ORD-103 | Ananya Patel | Green Tea Face Wash + Toner | Processing; eligible for cancellation |

Aria follows these policies:

- Delivery is free for orders over ₹499. Smaller orders have a ₹50 delivery fee. Delivery usually takes 3–5 business days.
- Unopened, unused products can be returned within 7 days of delivery. Damage must be reported within 48 hours with photos.
- Orders can only be cancelled while their status is Processing.
- Cash on Delivery is available for orders up to ₹2,500.
- Aria only handles Aura Skincare questions. She should ask for clarification when she cannot understand a request or find an order.

## How it works

The frontend is built with React, TypeScript, and Vite. It captures microphone audio in the browser and sends short 16 kHz audio chunks to the backend over a WebSocket. It plays Aria's 24 kHz audio response as it arrives. Zustand keeps the call status, transcript, and tool activity in sync with the interface.

The backend uses Node.js, Express, and WebSockets. It keeps the Gemini API key on the server and relays audio to Gemini Live. Gemini handles the conversation and can request order tools. The backend looks up or cancels orders in a small in-memory sample database, then sends the result back to Gemini so Aria can explain it. The order data and call history are for this demo and reset when the server restarts.

For quick local demos, `VITE_MOCK=1` uses the browser's speech recognition and speech synthesis instead of the live Gemini backend. Set `VITE_MOCK=0` to use the live service.

## Run locally

You need Node.js and npm. From the project folder, install the packages:

```bash
npm install
```

Create a `.env` file using `.env.example` as a guide. For live calls, set your Gemini API key:

```env
GEMINI_API_KEY=your_key
VITE_API_BASE=
VITE_MOCK=0
```

Start the backend and frontend in separate terminals:

```bash
npm run start
```

```bash
npm run dev
```

Open `http://localhost:5173`. Keep the Gemini key on the backend; do not add it as a `VITE_` variable or commit it to GitHub.

## Deploy

The frontend can run on Vercel and the backend on Render.

**Render backend**

1. Create a Node web service from this repository.
2. Use `npm install` for the build command and `npm run start` for the start command.
3. Add `GEMINI_API_KEY` and `CORS_ORIGIN` in the Render environment settings. `CORS_ORIGIN` should be the Vercel site URL, such as `https://your-app.vercel.app`.
4. Check that `https://your-render-service.onrender.com/health` returns a status of `ok`.

**Vercel frontend**

1. Import the same repository and choose the Vite framework preset.
2. Set the build command to `npm run build` and the output folder to `dist`.
3. Set `VITE_API_BASE` to the Render service URL, such as `https://your-render-service.onrender.com`, and set `VITE_MOCK=0`.
4. Redeploy after changing environment variables.

## Assessment questions

### 1. Why did you choose this architecture and technology stack?

I used React and TypeScript for the browser interface because they make it straightforward to build and update the call screen. The browser sends audio to a small Node.js WebSocket server, which connects to Gemini Live. Keeping the Gemini key on the server is safer than putting it in the website. Gemini handles the live conversation, while the server handles the order lookup and cancellation tools.

### 2. What was the most difficult part, and how did you solve it?

The hardest part was getting audio to move both ways reliably while keeping the call responsive. I capture microphone audio in small chunks, send it through the WebSocket, and schedule the returned audio for playback in the browser. I also added an interruption check so Aria can stop speaking when the customer talks. The interruption check needs to ignore short background noises, so it waits for several speech-level audio frames before stopping playback.

### 3. What would you improve first with one more week?

I would test the live voice flow across more browsers, microphones, and network conditions, then improve how the app handles unclear speech and reconnects. I would also replace the sample in-memory order data with a database so orders and call records survive a server restart.

### 4. What would need to change for 1,000 conversations a day?

I would move order data and call records to a reliable database, add monitoring for audio delays and failed calls, and set limits so one user cannot consume all the service capacity. I would also run multiple backend instances and make sure a call can stay connected to the right instance for its full duration. Before launch, I would add stronger access controls and a clear policy for storing call audio and transcripts.

## Short approach note

I built a browser voice agent for Aura Skincare using Gemini Live for conversation and a Node.js WebSocket server to relay audio and run order tools. The app can look up or cancel sample orders, follow the brand policies, and show a transcript and structured call summary.

## Three-minute demo video script

Text in **[brackets]** is an on-screen action, not something to read aloud. Let Aria finish each answer before moving on. The exact timing depends on the live response, but this is written for about three minutes.

### 0:00–0:25 — Introduction

**[Show the app's call screen.]**

Hi, I’m going to show my AI voice support agent for Aura Skincare. The agent is called Aria. She can answer questions about the brand, check sample orders, and explain the return and cancellation policies. I’ll show a short customer call and then explain how the app is put together.

### 0:25–1:10 — Order lookup

**[Click Start Call, allow microphone access if prompted, and ask:]**

Hi Aria, can you check the status of order ORD-101?

**[Wait for the reply. Show the tool activity or order result.]**

Aria looked up the order and explained that Priya Sharma’s Vitamin C Serum is out for delivery with BlueDart and is expected by 6 PM today. The order information comes from the sample order database. The tool panel shows when the lookup runs and what result it returns.

### 1:10–1:45 — Policy question

**[Ask Aria:]**

I received order ORD-102 two weeks ago. Can I return the sunscreen?

**[Wait for the reply.]**

Aria explains that this order was delivered 14 days ago, while the return window is 7 days. The agent should follow the policy instead of promising a return that the brand does not allow.

### 1:45–2:10 — Call summary

**[End the call and show the transcript and summary.]**

When I end the call, the app shows the conversation transcript and a structured summary. It records the customer’s intent, the order ID when one was found, the resolution status, and a short summary of what happened.

### 2:10–3:00 — Technology and wrap-up

The website uses React, TypeScript, and Vite. The browser captures microphone audio and sends it in small chunks over a WebSocket. A Node.js server relays that audio to Gemini Live and keeps the API key out of the browser. Gemini handles the conversation and decides when it needs an order tool. The server runs that tool and returns the result, and the browser plays Aria’s audio reply.

I chose this setup to keep the call in the browser while giving the backend control of the API key and order actions. The hardest part was making the two-way audio responsive and handling interruptions without reacting to every small background noise. With more time, I’d test more devices and network conditions and move the sample data into a persistent database. Thanks for watching.
