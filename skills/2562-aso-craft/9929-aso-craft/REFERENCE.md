# Store reference

Two stores, two different machines. Anything marked **[verify]** is relayed rather than
confirmed first-hand — check it before betting a submission on it.

## What each store indexes for search

| Surface | App Store | Google Play |
|---|---|---|
| name / title | indexed, position-weighted | indexed, position-weighted |
| subtitle | indexed | does not exist |
| short description | does not exist | indexed |
| keyword field | indexed, hidden, 100 chars | **does not exist** |
| description | **not indexed at all** | **indexed** |
| promotional text | not indexed | does not exist |

The consequence is a genuine strategy inversion, not a different constant:

- **Apple.** Three surfaces are indexed as one combined pool, so a phrase spent twice
  is budget burnt. Put each concept in exactly one place. The description is pure
  conversion copy — write it for humans, no keyword density games.
- **Play.** The description body *is* the index, so concepts need to appear in it
  naturally, and repeating a term across title, short description, and body is normal
  rather than wasteful. What is punished is a literal keyword list, which falls under
  Play's Store Listing and Promotion policy as spam.

Position weight is real on both: a keyword earlier in the title counts for more.
Leading with the brand instead of the descriptor is a vanity trade against installs —
make it deliberately, since nobody searches your brand until you are already known.

## Keyword data: free, dead, and paid

Verified August 2026. Re-check before trusting any of it — these are undocumented
endpoints and they rot.

| Source | State | Gives you |
|---|---|---|
| iTunes Search API (`itunes.apple.com/search`) | **works, free, no key** | competitor titles, genre, rating counts, price, per storefront via `country` + `lang` |
| Apple search hints (`MZSearchHints.woa`) | **returns an empty hints array** | nothing — was the only free autosuggest |
| Play autocomplete (`market.android.com/suggest`) | **404, dead** | nothing |
| Play store listing data | no free API | scrape HTML (fragile) or pay |
| AppFigures / Sensor Tower / AppTweak / Astro | paid | real popularity and difficulty scores |

So `keyword_probe.py` runs entirely off the iTunes Search API, and **Play research has
no free data path** — the method in SKILL.md is identical, you just supply the numbers
by hand or from a paid tool.

### Reading the three proxies honestly

None of them is search volume. Say so in any report rather than dressing them up.

- **Density** (share of top titles carrying the term) is a *conviction* signal:
  developers converge on terms that convert, so high density is indirect evidence of
  demand. It is also a warning — a commodity term is a fight you lose without
  authority. Zero density is genuinely ambiguous: a real gap and a dead term look
  identical from here.
- **Difficulty** (median rating count of the top 10) is an *authority* proxy, not a
  ranking-difficulty score. It correlates with how entrenched incumbents are, and it
  says nothing about how many people search the term. Rating counts also lag installs
  and vary wildly by category — a 1,000-review app is dominant in a niche and invisible
  in games.
- **Intent** (genre concentration of the top 20) is the most trustworthy of the three,
  because it measures what the store itself believes the query means. Scattered genres
  are a hard cut signal regardless of the other two numbers.

A term that passes all three still needs volume validation before it goes in the app
*name*, which is the one surface you cannot cheaply change later.

### The authority trap

An app with few installs ranking around 1000 for a term sitting in its own subtitle does
not have a keyword problem. Adding keywords will not move it. Authority compounds: the
same subtitle that did nothing at launch starts ranking after a few thousand installs.
Rule of thumb for a new listing: difficulty `low` is winnable now, `moderate` is a bet
on the next few months, `high` and `entrenched` are for later or never.

## Locale codes

The two stores do not agree, and neither accepts the other's list.

- **Apple** wants country suffixes in several places: `sl-SI`, `bn-BD`, `ur-PK`,
  `ar-SA`, and every Indian language (`gu-IN`, `kn-IN`, `ml-IN`, `mr-IN`, `or-IN`,
  `pa-IN`, `ta-IN`, `te-IN`). Chinese is `zh-Hans` / `zh-Hant`. Codes that look
  plausible and are rejected: `fil`, `az`, `bg`, `et`, `lt`, `lv`, `sq`, `sr`, `mk`,
  `kk`, `mn`, `hy`, `ka`, `is`, and bare `sl`. **[verify]** — sourced from vibe-aso's
  metadata guide, which claims the list was checked against Apple's API.
- **Play** uses its own set: `pt-BR` and `pt-PT`, `es-419` for Latin American Spanish,
  `zh-CN` / `zh-TW` / `zh-HK` rather than script subtags, and supports considerably
  more languages than the App Store does.

Do not assume a locale file maps to both stores. Keep the union in your listing
directory and let each uploader take the subset it accepts.

## Write models

**Apple — App Store Connect API.** Per-resource `PATCH` against
`api.appstoreconnect.apple.com`. Auth is an ES256 JWT signed with a `.p8` private key
(key id + issuer id), 20-minute expiry, `aud: appstoreconnect-v1`.

- name, subtitle, keywords and description **only change with a new app version**.
  Promotional text is the one field editable in place on a live listing. Plan copy
  changes to ride the next release.
- Per-locale privacy policy URL is required, or submission fails with per-locale
  errors.
- Locales without their own screenshots fall back to the en-US set automatically.
- A version created through the API does not carry localized text forward the way the
  web UI does — non-source locales come up blank, and Apple will fill them with en-US
  if you submit like that. Re-push and read back per locale. **[verify]**

**Play — Android Publisher API v3.** Transactional. `edits.insert` opens an edit,
mutations land inside it (`edits.listings.patch`, `edits.images.*`,
`edits.details.patch`), then `edits.commit` applies the whole thing atomically. Auth is
a Google service account JSON, granted permissions in Play Console and linked to a
Google Cloud project with the API enabled.

- **A 2xx on a mutate means nothing.** It is scoped to an uncommitted edit. Only
  `commit` publishes, and an edit can be invalidated by a concurrent change.
- Commit puts the release into review; the listing is not live at commit time.
- Data safety form and content rating (IARC) questionnaire are Console-only. No API.
- Play has native store listing experiments — real traffic-split A/B testing of titles,
  icons, screenshots, and descriptions. Free, and worth using before hand-tuning copy.

## Upload tooling

`fastlane` covers both and is usually less work than either API directly:

```bash
fastlane deliver --skip-binary-upload --skip-screenshots --force   # Apple
fastlane supply --skip_upload_apk --metadata_path ./metadata       # Play
```

Both want their own on-disk layout (`<locale>/<field>.txt` for deliver,
`<locale>/full-description.txt` etc. for supply), so a per-locale Markdown source needs
a small emitter per store. That emitter is the only genuinely store-specific code in a
dual-store setup.

Apple's locale list in fastlane was stale before 2.234.0 — older versions silently miss
the Indian-subcontinent locales. **[verify]**

## Asset requirements

| | App Store | Google Play |
|---|---|---|
| screenshots | per device class, portrait or landscape | min 2 per type, 320–3840 px per side |
| phone aspect | fixed per device generation | 16:9 or 9:16 |
| feature graphic | none | **1024×500, required** |
| icon | in the binary | 512×512 PNG in Console |

Apple rejects a submission when the app supports a device class and screenshots for it
are missing — discover that before upload day, not during.

## Localization rules that hold on both stores

- Localize the **descriptor**, keep the **brand** as the author styles it. In non-Latin
  scripts, transliterating the brand generally beats leaving a Latin string sitting in
  Devanagari or Thai copy — but that is the author's brand call, not the linter's.
- Research each market rather than translating keywords. Germans do not search a
  translation of an English phrase; they search what Germans type. Where you have no
  data for a locale, translate the *concept* and say plainly that the locale is
  unverified.
- Compounding languages (de, fi, tr, hu, ta, ml) routinely blow a 30-char limit that
  English fits comfortably. A source name over ~22 chars is a translation risk.
- Verbatim atoms: URLs, support emails, file extensions, version numbers, platform
  product names. The linter derives URLs and emails from the source automatically; pass
  anything else with `--atom`.

## Prior art

Several Apple-side specifics here — the rejected locale codes, the version-gating of
metadata fields, the fastlane 2.234.0 floor — come from
[Kronop/vibe-aso](https://github.com/Kronop/vibe-aso) (MIT), an Apple-only ASO skill
worth reading if you are doing a full iOS launch. This skill covers both stores and
stays narrower: source format, keyword probing, linting, and the rules. It does no
screenshot rendering and no uploading.
