# Audio direction: <game name>

## Aesthetic

<2–4 sentences: genre, era, production style, references described in words (no "sounds like <song>"). Example:
"Energetic synth-funk and drum-and-bass flavoured chiptune-meets-modern-synth, in the spirit of 90s high-speed
platformers but produced cleanly.">

Generated procedurally by `tools/audio/` (Python, numpy) and exported as <OGG Vorbis 44.1 kHz> to `<runtime audio dir>`.

## Sonic identity

What makes this game sound like itself and not like another game built with the same toolkit. Mirror these in
`tools/audio/style.py` (`STYLE`) and in the music voices.

- Home key and scale: <e.g. F# minor pentatonic>. Reward/UI tones use its degrees; the music shares it.
- Source families: <e.g. FM bells + filtered noise; no pulses>. Families to avoid: <...>.
- Material: <glass / wood / metal / paper / water / digital / organic ...>, which shapes every transient.
- Brightness <0.5–1.5>, grit <0–1>, space <dry / small room / hall>, width <0–1.5>, pitch bias <± semitones>.
- Signature gesture(s): <e.g. every reward ends with a short upward glass flick; hazards share a detuned buzz>.
- Music palette: custom voices per role (lead/bass/pads/drums) and how they differ from the toolkit presets.

## Music

| ID          | Use          | Mood                | Tempo | Key   | Loop          |
| ----------- | ------------ | ------------------- | ----- | ----- | ------------- |
| `title`     | Title screen | Heroic, bright hook | 128   | D     | intro + loop  |
| `stage_1`   | Level 1      | ...                 | 150   | ...   | intro + loop  |
| `boss`      | Boss fights  | Urgent, heavy       | 165   | minor | loop          |
| `victory`   | Level clear  | Triumphant          | —     | —     | one-shot ~4 s |
| `game_over` | Game over    | Down                | —     | —     | one-shot ~5 s |

## SFX

| ID                | Game event           | Priority | Notes                  |
| ----------------- | -------------------- | -------- | ---------------------- |
| `jump`            | player leaves ground | react    | frequent, short        |
| `coin` / `coin_r` | pickup               | feedback | alternate per pickup   |
| `hurt`            | player damaged       | react    | must cut through music |
| `ui_move`         | menu cursor          | UI       | very quiet             |

Priority: **react** (the player must notice and respond), **feedback** (confirms an action), **UI**, **ambience**.

## Mix

- Music integrated loudness about -14 LUFS (calm/ambient -16 to -18), ceiling -1 dBTP.
- SFX max momentary loudness tiers: big events -9/-10, gameplay -11/-14, frequent -15/-17, UI -15/-19.
- Buses: Master, Music, SFX, UI, each with a player volume setting.
- Frequent SFX: short attack, short tails, round-robin or alternating variants.

## Platform and budget

Engine: <Godot 4 / Unity / web / ...>. Target platforms: <desktop/mobile/web>. Size budget: <MB>. Max simultaneous SFX
voices: <16>.
