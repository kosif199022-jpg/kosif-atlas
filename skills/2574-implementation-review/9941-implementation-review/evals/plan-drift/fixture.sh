#!/usr/bin/env bash
set -euo pipefail
git init -q -b main .
git config user.email eval@example.com
git config user.name eval
cat > CLAUDE.md <<'EOF'
# Repo conventions
- Conventional Commits.
- Never add a Co-Authored-By trailer to commit messages.
EOF
mkdir -p src/cart src/api src/db
cat > src/cart/total.ts <<'EOF'
export type Line = { sku: string; price: number; qty: number };
export function total(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
EOF
cat > src/api/routes.ts <<'EOF'
import { Router } from "./router";
export const routes = new Router();
routes.get("/cart", (req) => req.session.cart);
EOF
cat > src/db/schema.ts <<'EOF'
// Postgres schema (see docs/adr/0001)
export const tables = { users: "users", carts: "carts" };
EOF
mkdir -p docs/plans
cat > docs/plans/0001-cart-total-guard.md <<'EOF'
# Implementation Plan: Cart total guard

- **Status**: in-progress
- **Sources**: bug report #4821

## Summary
The cart total must never be NaN or negative.

## Files Affected
| File | Role | Action |
|------|------|--------|
| `src/cart/total.ts` | total computation | Mod |
| `src/cart/total.test.ts` | behavior tests | New |

## Implementation Phases
### Phase 1: Guard
- [ ] **Guard quantity** — treat empty/NaN quantity as 0. Touches: `src/cart/total.ts`. Done when: total of a line with qty "" is 0.
- [ ] **Tests** — cover the edge cases below. Touches: `src/cart/total.test.ts`.

## Acceptance Criteria
- [ ] A line with empty quantity contributes 0.
- [ ] A line with negative quantity contributes 0.

## Edge Cases
| Case | Decision | Covered by |
|------|----------|-----------|
| empty / NaN quantity | handle | Phase 1 + test |
| negative quantity | handle | Phase 1 + test |
| negative price | won't | prices are validated upstream |
EOF
git add -A && git commit -qm "feat: initial shop"
# Staged change: handles NaN but NOT negative quantity, and ships no test file.
cat > src/cart/total.ts <<'EOF'
export type Line = { sku: string; price: number; qty: number };
export function total(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.price * (Number(l.qty) || 0), 0);
}
EOF
git add src/cart/total.ts
