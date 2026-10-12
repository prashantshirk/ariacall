import React from "react"
import { Badge } from "@/components/ui/badge"
import { AgentState } from "@/types"

interface StateBadgeProps {
  state: AgentState
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case "listening":
        return {
          variant: "success" as const,
          label: "Listening",
          dotClass: "bg-emerald-500 animate-pulse",
        }
      case "thinking":
        return {
          variant: "warning" as const,
          label: "Thinking...",
          dotClass: "bg-amber-500 animate-ping",
        }
      case "speaking":
        return {
          variant: "info" as const,
          label: "Aria Speaking",
          dotClass: "bg-sky-500 animate-pulse",
        }
      case "connecting":
        return {
          variant: "secondary" as const,
          label: "Connecting...",
          dotClass: "bg-zinc-400 animate-ping",
        }
      case "busy":
        return {
          variant: "destructive" as const,
          label: "Line Busy",
          dotClass: "bg-red-500",
        }
      case "error":
        return {
          variant: "destructive" as const,
          label: "Call Error",
          dotClass: "bg-red-500",
        }
      case "ended":
        return {
          variant: "outline" as const,
          label: "Call Completed",
          dotClass: "bg-zinc-400",
        }
      case "idle":
      default:
        return {
          variant: "secondary" as const,
          label: "Ready to Call",
          dotClass: "bg-zinc-400",
        }
    }
  }

  const config = getBadgeConfig()

  return (
    <Badge
      variant={config.variant}
      className="px-3 py-1 font-medium text-xs tracking-wide shadow-2xs"
      aria-live="polite"
    >
      <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${config.dotClass}`} />
      <span>{config.label}</span>
    </Badge>
  )
}
