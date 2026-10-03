# audio-dsp-engineering

Audio DSP engineering team — agents (audio-dsp-architect, dsp-implementation-engineer) for the layer answering 'what processing architecture, at what latency, on what platform — and how do we make the audio callback real-time-safe and fast?': processing model (block vs sample-by-sample), latency & buffer budget, fixed vs float + denormals, algorithm approach (IIR biquads / FIR, FFT/STFT overlap-add, oversampling/anti-aliasing), plugin formats & frameworks (JUCE, VST3, AU/AUv3, AAX, CLAP, LV2), audio I/O (CoreAudio, ASIO, WASAPI, ALSA/JACK, Web Audio), lock-free parameter passing, spatial/binaural (HRTF), embedded DSP (CMSIS-DSP), SIMD, and measurement (null tests, THD+N, frequency response). skills, a knowledge bank (decision tree + 2026 patterns), and templates. Distinct from streaming-media-engineering (codecs/delivery), conversational-ai-voice-engineering (voice AI agents), and embedded-iot-engineering (general firmware) — this is the real-time signal-processing layer. Needs ravenclaude-core.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/audio-dsp-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
