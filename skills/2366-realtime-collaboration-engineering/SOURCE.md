# realtime-collaboration-engineering

Realtime-collaboration-engineering team — agents (collab-architect, sync-engine-engineer, presence-and-transport-engineer) for multiplayer / collaborative-editing systems (Figma/Notion/Docs): the merge model (CRDT vs OT vs last-writer-wins, by data shape), the shared-document model, offline edits + reconnection/merge, presence & awareness kept OUT of the persisted document, transport (WebSocket vs WebRTC, client-server vs SFU vs mesh), and scaling the sync server (doc sharding, snapshots/compaction, access control at the boundary). skills, a knowledge bank (CRDT-vs-OT + transport/topology Mermaid trees, durable consistency concepts, a dated 2026 tooling map), best-practices, templates, commands, an advisory hook. Engineering craft, not legal/product advice; library specifics carry a date + verify-at-use. Seams: UI -> frontend-engineering; sync service/store -> backend-engineering; op-log fan-out -> data-streaming-engineering; latency -> performance-engineering. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/realtime-collaboration-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
