# conversational-ai-voice-engineering

Conversational voice-AI engineering team — agents for production real-time voice agents: voice-ai-architect (cascade STT->LLM->TTS vs speech-to-speech, the latency budget, turn-taking / barge-in / endpointing, channel choice, build-vs-platform across Twilio / Vapi / Retell / LiveKit / Pipecat, guardrails), speech-pipeline-engineer (ASR & TTS provider choice, streaming transcription, VAD/endpointing, diarization, prosody/SSML, codecs, noise, WER), and dialog-and-integration-engineer (state, LLM orchestration and mid-call tool calling, SIP/PSTN telephony, IVR/DTMF, call routing, flow testing and eval). Ships skills, a knowledge bank (Mermaid decision trees + a dated 2026 reference), best-practices, templates, commands. Engineering judgment, not legal/compliance advice; the ASR/TTS/platform/telephony landscape is volatile — versions and latency numbers carry a retrieval date + [verify-at-use]; no PII, and call audio/transcripts are sensitive. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/conversational-ai-voice-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **READ_ONLY_OK** (hooks: 0, MCP servers: 0, scripts: 0). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
