import React from "react"
import { Link, useLocation } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"
import { ResetDemoDialog } from "./ResetDemoDialog"
import { Badge } from "@/components/ui/badge"
import { Droplet, History, PhoneCall, Sparkles } from "lucide-react"

export const Header: React.FC = () => {
  const location = useLocation()
  const isCall = location.pathname === "/"
  const isHistory = location.pathname.startsWith("/history") || location.pathname.startsWith("/calls")

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Droplet className="w-4 h-4 fill-emerald-400 text-emerald-400 dark:fill-emerald-600 dark:text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-brand font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  Aura Skincare
                </span>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-normal border-zinc-300 dark:border-zinc-700 text-zinc-500"
                >
                  Voice CX
                </Badge>
              </div>
              <span className="text-[11px] text-zinc-400 hidden sm:block">
                Aria · AI Customer Support
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isCall
                ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Agent Call</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              isHistory
                ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </Link>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ResetDemoDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
