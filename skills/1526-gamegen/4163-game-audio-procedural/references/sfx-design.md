# SFX design

## Anatomy

Most game sounds are three layers mixed on a canvas (`_place(total, [(time, signal, pan), ...])`):

| Layer     | Time       | Purpose                                    | Typical sources                                                      |
| --------- | ---------- | ------------------------------------------ | -------------------------------------------------------------------- |
| Transient | 0–20 ms    | makes it read instantly, sets "material"   | highpassed noise burst, rim click, short sine ping, bitcrushed click |
| Body      | 20–300 ms  | carries the meaning (pitch motion, weight) | glided pulse/saw/FM, pitch-dropping sine thump, swept band noise     |
| Tail      | 100 ms–2 s | size and space, decay character            | reverb, chime ring, noise sweep, scattered particles                 |

**Sync to the action.** When animations record event markers (contact, apex, release), the transient must land on that
frame: start the file at the transient (no leading silence; `build.py` trims only the tail) and trigger it from the
marker, not the clip start. Wind-ups (charge, telegraph) are separate cues triggered earlier, so the hit stays tight
when timing changes.

Always end with an envelope that reaches exactly zero (`_env` forces the last 4 ms to 0). `build.py` also trims trailing
silence and applies 0.5 ms / ≤15 ms fades.

## Semantics that players read without thinking

- **Rising pitch**: positive, upward, gaining (jump, pickup, power-up, charge). **Falling**: negative, downward, losing
  (hurt, death, fail, power-down, landing).
- **Major intervals and bells**: reward. Fourths and fifths: neutral confirmation. Minor seconds, tritones, buzz: danger
  and error.
- **Low thump under a sound**: weight and impact. Remove it for light, small or UI sounds.
- **Brightness**: closeness and energy. Low-pass for distance, softness, underwater, muffled states.
- **Duration** follows frequency of use: the more often a sound plays, the shorter it must be.
- **Stereo motion** (panned sweep or `autopan`): speed and direction. Keep frequent sounds near centre.

## Loudness tiers (target max momentary LUFS, `@sfx(loudness=...)`)

| Tier             | LUFS       | Examples                                       |
| ---------------- | ---------- | ---------------------------------------------- |
| Big rare events  | -9 to -10  | explosion, death, key item, boss hit           |
| Gameplay actions | -11 to -14 | jump, dash, hurt, enemy defeat, spring         |
| Frequent         | -15 to -17 | coin, land, footstep (peak-limited if <100 ms) |
| UI               | -15 to -19 | move -18, back -16, select -15                 |

Danger cues must cut through the music: give them midrange content (1–4 kHz) and a hard transient, not just low end.

## Anti-fatigue

- **Round-robin**: `@sfx("footstep", variants=4)` renders `footstep_1..4` from `fn(variant=i)`. Vary seed, filter
  frequency ±15 % and pitch ±1 semitone. At runtime pick a random variant that is not the previous one.
- **Alternating pairs**: mirrored stereo (`coin` and `coin_r = coin()[:, ::-1]`) or two pitches, toggled per trigger.
- **Runtime pitch jitter**: ±3–5 % `pitch_scale` per play. Avoid it on musical/tonal reward sounds that must stay in
  key.
- **Pitch ladders**: one charge or combo sound re-triggered with stepped pitch (e.g. ×2^(n/12)) in code beats N separate
  files.
- Keep tails short on anything that can retrigger within 200 ms; cap simultaneous instances per cue in the engine.

## Seamless SFX loops (engines, grinds, ambience, hums)

Use `@sfx(..., loop=True)`; build then skips trimming and fades, removes DC by mean and limits circularly. The recipe is
responsible for periodicity (worked example: `grind_loop` in `examples/sfx_examples.py`):

1. Every modulation rate is a whole multiple of `SR / n` (the loop rate).
2. Filter the signal three times concatenated and keep the middle copy: `circ(func, x)`.
3. Random events wrap with modulo indexing: `buf[(start + np.arange(m)) % n] += ...`.
4. Oscillator pitches: choose frequencies that complete whole cycles in n samples, or derive them from the noise and
   filters only.

Check `seam_ratio` in the build output: under ~1.5 is inaudible, and well-built loops land under 0.1.

## Pattern cookbook

Each row is a _pattern_: the layers and gestures that make an event readable, plus the dimensions to set from
`style.STYLE` so the result belongs to this game. Ranges are starting points, not values to copy.
`examples/sfx_examples.py` shows one concrete rendering of most rows for a bright synth-platformer palette; read it to
learn the toolkit, then write your own (`build.py` rejects unmodified copies).

| Event                           | Pattern (layers)                                                                     | Set per project                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Jump                            | upward pitch gesture (80–200 ms, 1–1.6 octaves) + optional air layer                 | source family, interval (tonal: `STYLE.tone`), glide curve, air amount, grit                 |
| Land / footstep                 | short low thump (pitch drop) + material tick                                         | material of the tick (noise band, click, wood/stone resonance), weight, round-robin variants |
| Dash / swing / throw            | fast noise sweep (direction = motion) + optional shimmer and sub                     | sweep range and Q, stereo travel, shimmer source, length                                     |
| Charge / wind-up                | rising tone with flutter or tremolo; re-triggered up a pitch ladder                  | source, flutter rate, ladder intervals in key                                                |
| Release / launch                | thump + falling bright layer + optional chirp                                        | which layers, falling range, length                                                          |
| Skid / scrape / friction        | band noise × slow random jitter (+ squeal)                                           | bands (material), jitter rate, squeal on/off                                                 |
| Hurt                            | downward, rough gesture + noise hit                                                  | roughness tool (FM index, crush, fold, drive), range, grit                                   |
| Death / fail                    | long downward gesture with closing filter, optional wobble                           | length, wobble, degradation style                                                            |
| Pickup / coin                   | two quick tonal notes rising, panned or alternating                                  | source, key degrees (`STYLE.tone`), spacing 30–80 ms, variants/alternation                   |
| Lose collectibles               | scattered cascade of pickup-like notes, accelerating, random pans                    | scale (`STYLE.scale`), density, spread, fall gesture                                         |
| Power-up / buff                 | rising swell with modulation (chorus/detune) + low support                           | source, swell length, modulation type                                                        |
| Key item / unlock               | short arpeggio in key + pad or shimmer + space                                       | chord colour (add9, sus, modal), length, `STYLE.space`                                       |
| Checkpoint / save               | two bell-like tones (4th/5th) + soft air                                             | source, interval, room size                                                                  |
| Container break                 | material crack + debris pings + optional reward tone                                 | material, debris count/pitch range                                                           |
| Spring / bounce                 | fast rise + decaying pitch wobble                                                    | wobble rate/depth, source, comic vs. mechanical                                              |
| Speed boost                     | rising wide tone + noise sweep, modulated                                            | source, width, modulation                                                                    |
| Enemy defeat                    | pop/chirp + crunchy noise burst + thump                                              | crunch tool, pitch of pop, weight                                                            |
| Armoured / boss hit             | inharmonic partial stack (metal) or resonant body (wood/stone) + thump + smack       | partial ratios (material), decay, weight                                                     |
| Telegraph / big attack          | rising tone with accelerating tremolo + riser                                        | length must match the gameplay telegraph                                                     |
| Shot / beam                     | fast downward zap (FM index decay or filter drop)                                    | start/end pitch, buzz amount, length                                                         |
| Electric                        | mains-like buzz + gated crackle + zap                                                | buzz frequency, gate density                                                                 |
| Explosion                       | sub drop + decorrelated noise body with closing filter + crackles                    | size (length, sub depth), noise colour, debris density                                       |
| Water                           | falling filtered noise + plunk + bubble chirps rising                                | droplet count, pitch range                                                                   |
| Crumble / collapse              | low rumble + accelerating cracks + final thud                                        | crack material, timing curve                                                                 |
| Ambience / machine loop         | periodic layered noise bands + slow modulation (see loops above)                     | bands, modulation multiples, length 1–4 s                                                    |
| UI move / select / back / error | tiny tonal blips: neutral (move), rising (select), falling (back), dissonant (error) | source, key degrees, length 40–200 ms, quietness                                             |
| 8-bit palettes                  | pulse duty 12.5/25/50 %, 16-step volume, LFSR-like noise, quantised triangle         | which channels, duty per role                                                                |

Sameness check before shipping: if two games built with this toolkit would share a sound for the same event, change at
least the source family, the key/intervals and the signature chain (`STYLE.finish`).

## Design checklist per cue

- Does the first 20 ms identify it? Does the pitch direction match the meaning?
- Is the length appropriate for how often it plays? Does the tail end exactly at zero?
- Is the tier loudness set, and does a danger cue cut through the music's midrange?
- Frequent cue: variants or alternation planned? Loop cue: `seam_ratio` < 1.5?
- `notes=` says how the game should trigger it (alternate, pitch ladder, random variant, loop).
