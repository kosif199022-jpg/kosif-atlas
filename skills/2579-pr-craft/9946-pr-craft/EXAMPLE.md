# Worked example

Context: marketing consent checkbox on a BigCommerce signup page was optional; needed to be required (compliance). Fixed across template + JS validator + lang files.

## Commit

```bash
git commit -F - <<'EOF'
fix(auth): enforce required marketing consent on signup

Marketing consent checkbox on the create-account form was purely
optional: no `required` attribute, not registered with the nod
validator, and the consent handler silently no-oped when unchecked.
Accounts could be created without consent — a compliance/regulatory
risk since the implicit audit trail is "account exists = box checked".

- Add native `required` to the checkbox (no-JS submit gate)
- Register a nod validator entry to block submit and show a themed
  inline error, clearing on tick
- Add `marketing_consent_required` to all validation message blocks

Refs task 29376269
EOF
```

## PR

```bash
gh pr create --base staging --head fix/marketing-consent-required-signup \
  --title "fix(auth): enforce required marketing consent on signup" \
  --body "$(cat <<'EOF'
## Problem

During QA, the marketing consent checkbox on the customer signup page could be bypassed — accounts created without checking it. Compliance/regulatory risk (FTC audit), since BigCommerce stores no separate consent flag and the implicit audit trail is *"account exists = box checked"* — only valid if enforcement is airtight.

## Root cause

The checkbox was purely optional across all three layers:
- **Template** — no `required` attribute, no `data-validation`; invisible to native HTML and the nod validator.
- **JS validator** (`registerCreateAccountValidator`) — checkbox never registered, so `areAll('valid')` ignored it.
- **Consent handler** (`handleMarketingEmailConsent`) — ran after validation passed; unchecked = silent early return, form submitted anyway.

## Fix

- Add native `required` to the checkbox — no-JS submit gate (airtight even if JS fails/disabled).
- Register a nod validator entry — blocks submit and shows a themed inline error, clearing on tick.
- Add `marketing_consent_required` to all three validation message blocks in `lang/en.json`.

Side benefit: required → consent handler always fires → every new account is subscribed, consistent with the audit-trail assumption.

## Test

1. `npm start`, open the signup page.
2. Submit with the box unchecked → blocked, inline error shown.
3. Tick the box → error clears, account creates.

## Out of scope (flag to compliance)

- Other lang files (`fr/pt/es/...`) fall back to the default EN string until translated.
- Accounts created during the bug window have no proof of consent.

Refs task 29376269
EOF
)"
```

---

# Worked example — stacked PR

Context: add promo-code support at checkout. One giant PR would touch a migration, a new endpoint, and the checkout UI at once — hard to review, and the schema is ready to merge long before the UI is. Split into three ordered *dependent* layers, each its own small PR. Base is `staging`.

```
staging
  └─ feat/promo-schema   (L1: table + model)
       └─ feat/promo-api   (L2: validate/apply endpoint, depends on L1)
            └─ feat/promo-ui   (L3: checkout input + display, depends on L2)
```

## Build the stack

```bash
gh extension install github/gh-stack   # once per machine

# L1 — bottom layer, branches off staging
gh stack init feat/promo-schema
git add migrations/2026_08_add_promo_codes.sql src/models/promo.ts
git commit -F - <<'EOF'
feat(promo): add promo_codes table and model

New promo_codes table (code, kind, amount, expires_at, usage_cap) plus
a Promo model. No behavior yet — foundation the API and UI build on.

Refs task 30112044
EOF

# L2 — stacks on top of L1
gh stack add feat/promo-api
git add src/api/promo/validate.ts src/api/promo/apply.ts src/api/routes.ts
git commit -F - <<'EOF'
feat(promo): validate + apply endpoints

POST /promo/validate checks code exists, unexpired, under usage_cap.
POST /promo/apply reserves a use and returns the discounted total.
Reads the Promo model from L1.

Refs task 30112044
EOF

# L3 — stacks on top of L2
gh stack add feat/promo-ui
git add src/checkout/PromoField.tsx src/checkout/Summary.tsx lang/en.json
git commit -F - <<'EOF'
feat(promo): checkout promo-code field

Input on the checkout summary that calls /promo/validate on blur and
/promo/apply on submit, showing the discounted total and inline errors.
Consumes the L2 endpoints.

Refs task 30112044
EOF

# push all three branches, open one linked PR per layer
gh stack submit
gh stack view   # prints the stack map
```

## PR body per layer

Each PR gets the same structured body as a single PR, scoped to *only its own layer's* diff. L2's body, for example:

```md
## Problem
Checkout has no way to validate or apply a promo code. This layer adds the server side; the UI (L3) sits on top of it.

## Fix
- `POST /promo/validate` — code exists, unexpired, under `usage_cap` → 200, else themed error.
- `POST /promo/apply` — reserves a use (atomic decrement) and returns the discounted total.

## Test
1. `npm start`.
2. `curl -XPOST /promo/validate -d '{"code":"SAVE10"}'` → 200 with discount.
3. Repeat past `usage_cap` → 409.

## Depends on
#<L1 PR number> (promo_codes table + model). Review/merge L1 first.

Refs task 30112044
```

## Merge

Review each layer in parallel. When approved, merge the **bottom** PR (`feat/promo-schema`) — it lands, and every unmerged layer below any PR you merge lands with it in one operation. The PRs above stay open and auto-rebase/retarget onto the new base on GitHub's servers; `staging`'s branch protections and required checks still gate each one. Report the three PR URLs and the merge order (L1 → L2 → L3).
