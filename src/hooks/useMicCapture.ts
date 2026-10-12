import { useState, useRef, useCallback } from "react"

interface UseMicCaptureProps {
  onPcmChunk?: (chunk: ArrayBuffer, rms: number) => void
  onLevel?: (level: number) => void
}

export function useMicCapture({ onPcmChunk, onLevel }: UseMicCaptureProps = {}) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null)
  const silentGainRef = useRef<GainNode | null>(null)
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

    if (scriptNodeRef.current) {
      scriptNodeRef.current.onaudioprocess = null
      scriptNodeRef.current.disconnect()
      scriptNodeRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (silentGainRef.current) {
      silentGainRef.current.disconnect()
      silentGainRef.current = null
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

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      // Request native 16 kHz capture so the worklet does not have to discard
      // samples from a 44.1/48 kHz stream. Fall back for browsers that reject it.
      let ctx: AudioContext
      try {
        ctx = new AudioCtx({ sampleRate: 16000 })
      } catch {
        ctx = new AudioCtx()
      }
      audioContextRef.current = ctx
      if (ctx.state === "suspended") {
        await ctx.resume()
      }

      const source = ctx.createMediaStreamSource(stream)
      sourceNodeRef.current = source

      // Silent gain to destination to keep Chrome audio graph alive
      const silentGain = ctx.createGain()
      silentGain.gain.value = 0
      silentGain.connect(ctx.destination)
      silentGainRef.current = silentGain

      // Level analyser
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      const pcmData = new Uint8Array(analyser.frequencyBinCount)
      const updateRms = () => {
        if (!streamRef.current || !analyserRef.current) return
        analyserRef.current.getByteFrequencyData(pcmData)
        let sum = 0
        for (let i = 0; i < pcmData.length; i++) sum += pcmData[i]
        const avg = sum / pcmData.length / 255
        if (onLevel) onLevel(Math.min(1, avg * 2.5))
        animFrameRef.current = requestAnimationFrame(updateRms)
      }
      updateRms()

      let workletStarted = false
      try {
        await ctx.audioWorklet.addModule("/worklets/pcm-capture.js")
        const workletNode = new AudioWorkletNode(ctx, "pcm-capture")
        workletNodeRef.current = workletNode

        workletNode.port.onmessage = (event) => {
          if (event.data && event.data.type === "pcm") {
            if (onPcmChunk) onPcmChunk(event.data.buffer, event.data.rms || 0)
          }
        }

        source.connect(workletNode)
        workletNode.connect(silentGain)
        workletStarted = true
        console.log("[Mic] AudioWorklet capture active @ 16kHz PCM")
      } catch (workletErr) {
        console.warn("[Mic] AudioWorklet failed, activating ScriptProcessor fallback:", workletErr)
      }

      if (!workletStarted) {
        // Fallback: ScriptProcessorNode downsamples directly to 16kHz PCM16
        const bufferSize = 4096
        const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1)
        scriptNodeRef.current = scriptNode
        const ratio = ctx.sampleRate / 16000
        let accum = 0
        const pcmBuffer: number[] = []

        scriptNode.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          for (let i = 0; i < input.length; i++) {
            accum += 1
            if (accum >= ratio) {
              accum -= ratio
              pcmBuffer.push(input[i])
            }
          }

          while (pcmBuffer.length >= 480) {
            const chunk = pcmBuffer.splice(0, 480)
            const pcm16 = new Int16Array(chunk.length)
            let squareSum = 0
            for (let i = 0; i < chunk.length; i++) {
              const val = Math.max(-1, Math.min(1, chunk[i]))
              squareSum += val * val
              pcm16[i] = val < 0 ? val * 0x8000 : val * 0x7fff
            }
            if (onPcmChunk) onPcmChunk(pcm16.buffer, Math.sqrt(squareSum / chunk.length))
          }
        }

        source.connect(scriptNode)
        scriptNode.connect(silentGain)
        console.log("[Mic] ScriptProcessor capture active @ 16kHz PCM")
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
