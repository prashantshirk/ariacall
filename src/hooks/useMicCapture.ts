import { useState, useRef, useCallback } from "react"

interface UseMicCaptureProps {
  onPcmChunk?: (chunk: ArrayBuffer) => void
  onLevel?: (level: number) => void
}

export function useMicCapture({ onPcmChunk, onLevel }: UseMicCaptureProps = {}) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const stopCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsCapturing(false)
    if (onLevel) onLevel(0)
  }, [onLevel])

  const startCapture = useCallback(async () => {
    setPermissionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = ctx

      // Load Worklet
      try {
        await ctx.audioWorklet.addModule("/worklets/pcm-capture.js")
        const workletNode = new AudioWorkletNode(ctx, "pcm-capture")
        workletNodeRef.current = workletNode

        workletNode.port.onmessage = (event) => {
          if (event.data && event.data.type === "pcm") {
            if (onPcmChunk) onPcmChunk(event.data.buffer)
            if (onLevel && typeof event.data.rms === "number") {
              onLevel(event.data.rms)
            }
          }
        }

        const source = ctx.createMediaStreamSource(stream)
        source.connect(workletNode)
      } catch (workletErr) {
        console.warn("Worklet module load issue, using Analyser fallback:", workletErr)
        // Analyser fallback for metering
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser
        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)

        const pcmData = new Uint8Array(analyser.frequencyBinCount)
        const updateRms = () => {
          if (!streamRef.current) return
          analyser.getByteFrequencyData(pcmData)
          let sum = 0
          for (let i = 0; i < pcmData.length; i++) sum += pcmData[i]
          const avg = sum / pcmData.length / 255
          if (onLevel) onLevel(Math.min(1, avg * 2))
          animFrameRef.current = requestAnimationFrame(updateRms)
        }
        updateRms()
      }

      setIsCapturing(true)
      return true
    } catch (err: unknown) {
      console.error("Microphone capture error:", err)
      const error = err as Error
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionError("Microphone access was denied. Please allow microphone permissions in your browser bar.")
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setPermissionError("No microphone found. Please connect an audio input device.")
      } else {
        setPermissionError(error.message || "Could not access microphone.")
      }
      stopCapture()
      return false
    }
  }, [onPcmChunk, onLevel, stopCapture])

  return {
    isCapturing,
    permissionError,
    startCapture,
    stopCapture,
  }
}
