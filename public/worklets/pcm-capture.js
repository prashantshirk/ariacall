/**
 * PCM Capture AudioWorkletProcessor
 * Downsamples audio from native browser sampleRate (44.1k/48k) to 16 kHz PCM16 (little-endian).
 * Emits ~30ms frames (480 samples @ 16kHz) as transferable ArrayBuffers.
 */
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.ratio = sampleRate / 16000;
    this.accum = 0;
    this.frameSize = 480; // 30ms @ 16kHz
    this.levelAccum = 0;
    this.sampleCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const len = channelData.length;

    for (let i = 0; i < len; i++) {
      const sample = channelData[i];
      this.levelAccum += sample * sample;
      this.sampleCount++;

      this.accum += 1;
      if (this.accum >= this.ratio) {
        this.accum -= this.ratio;
        this.buffer.push(sample);
      }
    }

    // Flush 30ms PCM16 chunks
    while (this.buffer.length >= this.frameSize) {
      const chunk = this.buffer.splice(0, this.frameSize);
      const pcm16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        // Clamp to [-1.0, 1.0] and convert to 16-bit integer
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Compute RMS level for this chunk
      let rms = 0;
      if (this.sampleCount > 0) {
        // Keep true RMS in a stable scale; gain multiplication made room noise
        // look like speech and triggered false barge-ins.
        rms = Math.min(1, Math.sqrt(this.levelAccum / this.sampleCount));
        this.levelAccum = 0;
        this.sampleCount = 0;
      }

      this.port.postMessage(
        {
          type: "pcm",
          buffer: pcm16.buffer,
          rms: rms,
        },
        [pcm16.buffer]
      );
    }

    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
