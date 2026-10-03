# Listing source format

One file per locale in a listing directory, named by locale stem: `en.md`, `es.md`,
`fr.md`, `pt-BR.md`, `de-DE.md`. The source locale (default `en`) is what every other
file is checked against.

The linter matches on the `##` heading prefix, so parenthetical notes are free — write
`## Subtitle (App Store)` or `## Subtitle`, both resolve to the same field. Headings it
does not recognise (`## Categories`, `## Content rating`, `## Support URL`) are ignored
and are a good place for anything the stores need that is not free text.

Copy this per locale:

```markdown
# Store listing — English (en)

## App name `[<=30 both stores]`

BrandName: Descriptor Keyword

## Subtitle (App Store) `[<=30]`

Second keyword, stated plainly

## Short description (Play Store) `[<=80]`

Keyword-led sentence. What it is, who it is for.

## Promotional text (App Store) `[<=170]`

The one field Apple lets you edit without shipping a new version. Use it for
launches, seasonal hooks, and anything time-bound.

## Long description `[<=4000 both stores]`

Opening paragraph carrying the main keywords in natural prose — this text is the
search index on Play and pure conversion copy on Apple.

**FEATURES**

- Feature lines, benefit first.

**WHO IT'S FOR**

- Concrete audience segments.

## Keywords (App Store only) `[<=100 comma-separated]`

no,spaces,after,commas,they,cost,one,character,each

## Target keywords

What this locale is trying to rank for, after research. The linter checks each one
lands on a surface that actually indexes it, per store; `keyword_probe.py --from`
reads this section directly. Re-research per market — do not translate this list.

- main keyword, second keyword
- supporting term, another one  # comments after # are ignored

## Categories

- Primary: **Music** / Play: **Music & Audio**
- Secondary: **Productivity** (App Store only)

## Content rating

- Apple: **4+**
- Google: **Everyone** (IARC questionnaire, Console-only)

## Support URL

https://example.com/support

## Marketing URL

https://example.com

## Privacy URL

https://example.com/privacy
```

## Recognised field headings

| Heading starts with | Field | Apple | Play |
|---|---|---|---|
| `App name` / `Title` | name | 30 | 30 |
| `Subtitle` | subtitle | 30 | — |
| `Short description` | short | — | 80 |
| `Promotional text` / `Promo text` | promo | 170 | — |
| `Long description` / `Full description` / `Description` | description | 4000 | 4000 |
| `Keywords` / `Keyword field` | keywords | 100 | — |
| `Target keywords` | targets | no limit — drives the coverage check | |

## Two things to keep out of the description

- **A trailing `Keywords: a, b, c` list.** Keyword spam under Play policy, and Apple
  does not index the description at all, so it buys nothing on either store.
- **Price claims.** "50% off", "free for a limited time" — both stores move prices
  independently of your copy, and Apple treats price claims in metadata as grounds for
  rejection. A FREE-vs-PRO feature breakdown is fine; a *number* is not.
