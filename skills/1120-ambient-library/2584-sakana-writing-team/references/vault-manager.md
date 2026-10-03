# Vault Manager — Angle Caching & Cross-Run Population Management

## Purpose

The vault is the skill's genome. It stores the full evolutionary population from each run so that angles, fitness data, and calibration signals compound across generations instead of being discarded after every article.

---

## Storage Structure

```
~/.sakana-writing-team/
├── vaults/
│   ├── {audience-slug}-{YYYY-MM-DD}.vault.json
│   ├── {audience-slug}-{YYYY-MM-DD}.vault.json
│   └── ...
├── calibration/
│   ├── {audience-slug}-retro.json
│   └── meta-evolution.json
└── voices/
    └── {voice-name}.json
```

### Path Construction
- `audience-slug`: lowercase, hyphens for spaces, max 30 chars. E.g., "aimm-knowledge-entrepreneurs"
- Date: ISO format YYYY-MM-DD of the run

### On First Run
If `~/.sakana-writing-team/` doesn't exist, create it with all subdirectories. Log: "Initialized Sakana Writing Team storage at ~/.sakana-writing-team/"

---

## Vault File Schema

```json
{
  "version": "2.0",
  "created": "YYYY-MM-DDTHH:MM:SSZ",
  "topic": "string",
  "mode": "FLAGSHIP | STANDARD",
  
  "audience": {
    "description": "string",
    "slug": "string",
    "sophistication": "naive | informed | practiced | expert",
    "activation_trigger": "string",
    "action_horizon": "string",
    "fitness_weights": {
      "novelty": 0.0,
      "tension": 0.0,
      "inevitability": 0.0,
      "generativity": 0.0,
      "structural_surprise": 0.0,
      "momentum": 0.0,
      "density": 0.0,
      "residue": 0.0
    },
    "boredom_map": ["string"]
  },
  
  "voice_fingerprint": "string | null",
  
  "seed_population": [
    {
      "id": "angle-01",
      "name": "string",
      "thesis": "string",
      "borrowed_lens": "string",
      "disrupted_belief": "string",
      "structural_shape": "string",
      "source": "ai | external | accident",
      "source_url": "string | null",
      "fitness_score": 0.0,
      "axis_scores": {
        "novelty": 0, "tension": 0, "inevitability": 0,
        "generativity": 0, "structural_surprise": 0
      },
      "tournament_tier": "survivor | merge_pool | eliminated",
      "drafted": false,
      "drafted_date": "string | null",
      "article_title": "string | null"
    }
  ],
  
  "merge_attempts": [
    {
      "parent_a": "angle-id",
      "parent_b": "angle-id",
      "operation": "A | B | C | D",
      "catalyst_framework": "string | null",
      "hybrid_name": "string",
      "hybrid_thesis": "string",
      "hybrid_score": 0.0,
      "emergence_detected": false,
      "emergence_description": "string | null",
      "derivation_proof": "string | null"
    }
  ],
  
  "finalists": [
    {
      "angle_id": "string",
      "origin": "survivor | hybrid",
      "post_challenge_status": "intact | transformed | collapsed",
      "transformation_description": "string | null",
      "drafted": false
    }
  ],
  
  "run_metadata": {
    "stress_test_results": {},
    "winning_draft": "string | null",
    "merge_added_value": false,
    "emergence_in_final": false,
    "controlled_accident_fate": "eliminated | merge_pool | survived | finalist"
  }
}
```

---

## Write Protocol

### When to Write

Auto-save a vault after Step 10 (SELECT) in FLAGSHIP and STANDARD modes. No user confirmation needed — the vault is internal infrastructure, not a deliverable.

### How to Write

```python
# Pseudocode
vault = construct_vault_from_run_data()
slug = slugify(audience_description)
date = today_iso()
path = f"~/.sakana-writing-team/vaults/{slug}-{date}.vault.json"
write_json(path, vault)
```

If a vault already exists for the same audience and date (multiple runs in one day), append a counter: `{slug}-{date}-02.vault.json`.

---

## Read Protocol

### Auto-Detection (every run)

At the start of every invocation:
1. Check if `~/.sakana-writing-team/vaults/` exists.
2. If so, scan for vaults matching the current audience slug.
3. If found, compute available undrafted angles across all matching vaults.
4. If undrafted angles exist, offer VAULT mode:
   ```
   "I found [n] vault(s) for this audience with [m] undrafted angles 
   across [k] topics. Want to draft from the vault, or start fresh?"
   ```

### Loading a Vault

When VAULT mode activates:
1. Load the most recent vault for this audience (or let user pick if multiple exist).
2. Reconstruct the audience fitness profile from the stored data.
3. Present undrafted angles sorted by fitness score.
4. Check staleness: if the vault is >30 days old, flag: "This vault is [n] days old. The boredom map and fitness profile may be outdated. Want me to refresh the audience profile before drafting?"

### Refreshing a Stale Vault

If user opts to refresh:
1. Re-run SENSE to update the boredom map (add any new saturated takes).
2. Re-score the undrafted angles against the updated fitness weights.
3. Rankings may shift. Present the re-ranked angles.
4. Save the refreshed scores back to the vault file.

---

## Cross-Run Population Management

### Boredom Map Compounding

When loading a vault, the boredom map should be extended with:
- Takes from articles the user has published since the vault was created (if known)
- Any takes from other vaults for the same audience
- The thesis of the article produced from this vault's previous drafts (to prevent self-repetition)

### Angle Deduplication Across Vaults

When multiple vaults exist for the same audience, angles may overlap in theme if not in exact wording. Before presenting VAULT mode options, check for semantic similarity between undrafted angles across vaults. Flag near-duplicates and recommend the highest-scoring variant.

### Vault Pruning

Vaults older than 6 months with no undrafted angles can be archived (moved to a `.archive/` subdirectory) to keep the active vault directory clean. Never delete — archived vaults still contain calibration data that meta-evolution can reference.

---

## Series Mode (built on VAULT)

When the user requests a series ("I want to write a 4-part series on X"):

1. Run FLAGSHIP or STANDARD with an enlarged population (12-16 angles instead of 8).
2. After EVOLVE + CHALLENGE, present all finalists and the strongest merge-pool angles.
3. User selects 4 complementary angles for the series — the system recommends selections that maximize diversity across the set (different borrowed lenses, different structural shapes, different disrupted beliefs).
4. Save all 4 as "series-reserved" in the vault.
5. Draft article 1 immediately. Articles 2-4 are drafted in subsequent VAULT mode sessions, pulling from the series-reserved angles.

The vault tracks series membership:
```json
{
  "series": {
    "name": "string",
    "total_planned": 4,
    "completed": 1,
    "angle_ids": ["angle-03", "angle-07", "angle-hybrid-01", "angle-12"]
  }
}
```

---

## Integration with Meta-Evolution

After each run, the vault's `run_metadata` feeds into `~/.sakana-writing-team/calibration/meta-evolution.json`:

- Which source types (AI/external/accident) produced finalists?
- Did merging add value?
- Did the controlled accident contribute genetic material?
- Which stress tests differentiated between candidates?
- Which persona produced the highest-scoring draft?

Over 5+ runs, meta-evolution.json contains enough signal to adjust defaults:
- Fitness weight overrides per audience type
- Population size recommendations
- Persona-angle pairing recommendations
- Controlled accident domain recommendations (which domains have produced value for this audience before)

This is the compounding flywheel: each run enriches the vault → the vault improves the next run → that run enriches the vault further. The 20th article for an audience is produced by a system with 19 generations of evolutionary data behind it.
