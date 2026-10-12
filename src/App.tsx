import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Header } from "./components/layout/Header"
import { CallPage } from "./pages/CallPage"
import { HistoryPage } from "./pages/HistoryPage"
import { CallDetailPage } from "./pages/CallDetailPage"
import { Toaster } from "sonner"

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-100 bg-grid-subtle">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CallPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/calls/:id" element={<CallDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xs">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-brand font-semibold text-zinc-700 dark:text-zinc-300">Aura Skincare</span>
            <span>•</span>
            <span>Aria AI Voice Customer Experience Agent</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Datastraw AI Voice Assessment</span>
            <span>•</span>
            <span>16kHz Capture / 24kHz Gapless Playback</span>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App
