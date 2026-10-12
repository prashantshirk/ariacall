import { useRef, useCallback } from "react"

interface UsePcmPlayerProps {
  onLevel?: (level: number) => void
  onPlaybackEnd?: () => void
}

export function usePcmPlayer({ onLevel, onPlaybackEnd }: UsePcmPlayerProps = {}) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const animFrameRef = useRef<number | null>(null)

  const initContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.connect(ctx.destination)
      analyserRef.current = analyser

      // Level meter loop
      const pcmData = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(pcmData)
        let sum = 0
        for (let i = 0; i < pcmData.length; i++) sum += pcmData[i]
        const avg = sum / pcmData.length / 255
        if (onLevel) onLevel(Math.min(1, avg * 2.2))
        animFrameRef.current = requestAnimationFrame(loop)
      }
      loop()
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {})
    }
    return audioContextRef.current
  }, [onLevel])

  const playPcmChunk = useCallback(
    (arrayBuffer: ArrayBuffer) => {
      const ctx = initContext()
      if (!ctx || !analyserRef.current) return

      const int16Array = new Int16Array(arrayBuffer)
      const float32Array = new Float32Array(int16Array.length)

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000)
      audioBuffer.copyToChannel(float32Array, 0)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(analyserRef.current)

      const currentTime = ctx.currentTime
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.02 // 20ms lead-in
      }

      source.start(nextStartTimeRef.current)
      nextStartTimeRef.current += audioBuffer.duration

      activeSourcesRef.current.push(source)
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source)
        if (activeSourcesRef.current.length === 0) onPlaybackEnd?.()
      }
    },
    [initContext, onPlaybackEnd]
  )

  // Barge-in flush: stops all scheduled sources immediately
  const flush = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop()
        src.disconnect()
      } catch (e) {}
    })
    activeSourcesRef.current = []
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime
    } else {
      nextStartTimeRef.current = 0
    }
    if (onLevel) onLevel(0)
  }, [onLevel])

  const stop = useCallback(() => {
    flush()
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [flush])

  return {
    initContext,
    playPcmChunk,
    flush,
    stop,
  }
}
