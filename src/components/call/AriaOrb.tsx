import React, { useEffect, useRef } from "react"
import { useCallStore } from "@/store/callStore"
import { AgentState } from "@/types"
import { AlertCircle, Clock, Radio } from "lucide-react"

interface AriaOrbProps {
  size?: number
}

export const AriaOrb: React.FC<AriaOrbProps> = ({ size = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const state = useCallStore((s) => s.state)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let angle = 0
    let breath = 0

    const render = () => {
      const { state, micLevel, agentLevel } = useCallStore.getState()
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      const centerX = width / 2
      const centerY = height / 2
      const baseRadius = size * 0.35

      ctx.clearRect(0, 0, width, height)

      angle += 0.03
      breath += 0.02
      const breathingScale = 1 + Math.sin(breath) * 0.04

      // Color scheme based on state
      let primaryColor = "rgba(24, 24, 27, 0.95)" // Deep zinc/black
      let glowColor = "rgba(24, 24, 27, 0.08)"
      let waveColor = "rgba(24, 24, 27, 0.15)"

      if (state === "listening") {
        primaryColor = "rgba(16, 185, 129, 0.9)" // Modern Emerald
        glowColor = "rgba(16, 185, 129, 0.2)"
        waveColor = "rgba(16, 185, 129, 0.35)"
      } else if (state === "thinking") {
        primaryColor = "rgba(217, 119, 6, 0.9)" // Amber/Gold
        glowColor = "rgba(245, 158, 11, 0.25)"
        waveColor = "rgba(217, 119, 6, 0.3)"
      } else if (state === "speaking") {
        primaryColor = "rgba(14, 165, 233, 0.9)" // Modern Sky/Blue-Green
        glowColor = "rgba(14, 165, 233, 0.25)"
        waveColor = "rgba(14, 165, 233, 0.4)"
      } else if (state === "error" || state === "busy") {
        primaryColor = "rgba(239, 68, 68, 0.9)" // Rose/Red
        glowColor = "rgba(239, 68, 68, 0.2)"
        waveColor = "rgba(239, 68, 68, 0.25)"
      }

      // Outer audio reactivity scale
      let activeLevel = 0
      if (state === "listening") activeLevel = micLevel
      else if (state === "speaking") activeLevel = agentLevel
      else if (state === "connecting") activeLevel = 0.3

      const dynamicRadius = baseRadius * (breathingScale + activeLevel * 0.45)

      // Outer Soft Glow Ring 1
      const gradGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        dynamicRadius * 1.6
      )
      gradGlow.addColorStop(0, glowColor)
      gradGlow.addColorStop(1, "transparent")

      ctx.fillStyle = gradGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, dynamicRadius * 1.6, 0, Math.PI * 2)
      ctx.fill()

      // Interactive Dynamic Waves (when speaking or listening)
      if (activeLevel > 0.05 || state === "speaking" || state === "listening") {
        const numWaves = 3
        for (let i = 0; i < numWaves; i++) {
          const ringRad = dynamicRadius + (i + 1) * 16 * (0.8 + activeLevel)
          ctx.strokeStyle = waveColor
          ctx.lineWidth = 1.5 - i * 0.3
          ctx.beginPath()
          ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Rotating dashed ring for Connecting / Thinking
      if (state === "connecting" || state === "thinking") {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)
        ctx.setLineDash([8, 12])
        ctx.strokeStyle = state === "thinking" ? "rgba(245, 158, 11, 0.6)" : "rgba(113, 113, 122, 0.5)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, dynamicRadius * 1.25, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // Core Orb with Multi-stop Gradient
      const orbGrad = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.3,
        centerY - dynamicRadius * 0.3,
        dynamicRadius * 0.1,
        centerX,
        centerY,
        dynamicRadius
      )

      if (state === "speaking") {
        orbGrad.addColorStop(0, "#ffffff")
        orbGrad.addColorStop(0.4, "#38bdf8")
        orbGrad.addColorStop(1, "#0284c7")
      } else if (state === "listening") {
        orbGrad.addColorStop(0, "#ffffff")
        orbGrad.addColorStop(0.4, "#34d399")
        orbGrad.addColorStop(1, "#059669")
      } else if (state === "thinking") {
        orbGrad.addColorStop(0, "#fffbeb")
        orbGrad.addColorStop(0.4, "#fcd34d")
        orbGrad.addColorStop(1, "#d97706")
      } else if (state === "error" || state === "busy") {
        orbGrad.addColorStop(0, "#fee2e2")
        orbGrad.addColorStop(0.5, "#f87171")
        orbGrad.addColorStop(1, "#dc2626")
      } else {
        // Idle: Minimalist white-silver pearl orb
        orbGrad.addColorStop(0, "#ffffff")
        orbGrad.addColorStop(0.5, "#f4f4f5")
        orbGrad.addColorStop(0.85, "#e4e4e7")
        orbGrad.addColorStop(1, "#71717a")
      }

      ctx.save()
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 24
      ctx.fillStyle = orbGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Inner Specular Highlight (glass reflection)
      const highlight = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.25,
        centerY - dynamicRadius * 0.3,
        2,
        centerX - dynamicRadius * 0.25,
        centerY - dynamicRadius * 0.3,
        dynamicRadius * 0.6
      )
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.75)")
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = highlight
      ctx.beginPath()
      ctx.arc(centerX, centerY, dynamicRadius * 0.9, 0, Math.PI * 2)
      ctx.fill()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [size])

  // Canvas DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(dpr, dpr)
  }, [size])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="pointer-events-none select-none transition-transform duration-300"
      />
      {state === "busy" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 font-medium text-xs">
          <Clock className="w-6 h-6 mb-1 animate-pulse" />
          <span>Line Busy</span>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600 font-medium text-xs">
          <AlertCircle className="w-6 h-6 mb-1" />
          <span>Error</span>
        </div>
      )}
    </div>
  )
}
