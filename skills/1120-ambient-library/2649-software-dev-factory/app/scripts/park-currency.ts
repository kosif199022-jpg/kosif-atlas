import type { RunEvent } from "../src/controller/sdlc/events.ts";

// OI-43, spec park-currency v3. A park is a MOMENT, not a state: monitor.ts used
// to take the last `stage-parked` line in the whole log as the run's park, so a
// stage that parked and then recovered painted red for the rest of the run.
//
// This lives in its own module for a MEASUREMENT reason, not a design one — do
// not inline it back into monitor.ts. A test that imports monitor.ts pulls 425
// lines of dashboard and server into the coverage denominator (branches fell
// 80.5 -> 74.6 against an 80 floor when v1 tried it). So: no server, no port,
// no filesystem, no git in here.

// Every event kind, partitioned by whether it supersedes an earlier park. The
// `Record<RunEvent["kind"], ...>` annotation is the compile-time tie the spec
// asks for: renaming, splitting, or adding a kind upstream fails the typecheck
// here instead of leaving this module green while the dashboard reverts to
// stale red. The import is type-only, so it is erased and adds no runtime
// dependency and no coverage.
// ponytail: tsconfig's `include` is `src/**/*.ts` only, so `pnpm typecheck`
// does not currently reach scripts/ — the tie holds in the editor and the
// moment the include widens. Widening it is not this packet's call.
const SUPERSEDES: Record<RunEvent["kind"], boolean> = {
  // `run-started` counts: drive.ts:1620 emits it before the retry loop's first
  // `stage-started`, and event appends are best-effort and swallowed, so a lost
  // `stage-started` would otherwise leave the stale park visible indefinitely.
  "run-started": true,
  "stage-started": true,
  "stage-advanced": true,
  "run-complete": true,
  // The park kinds themselves never supersede: `run-parked` always FOLLOWS the
  // `stage-parked` it reports, so "any later event supersedes" would report a
  // genuinely parked run as healthy — a false green, worse than the false red.
  "stage-parked": false,
  "run-parked": false,
};

export const SUPERSEDING_KINDS: ReadonlySet<RunEvent["kind"]> = new Set(
  (Object.keys(SUPERSEDES) as RunEvent["kind"][]).filter((kind) => SUPERSEDES[kind]),
);

const PARK_KIND: RunEvent["kind"] = "stage-parked";

// The park the run is currently in, or null if it recovered past it — or never
// parked. Malformed lines (readEvents maps every unparseable JSONL line to `{}`)
// carry no kind, so they neither supersede a park nor read as one.
export function currentPark<T extends { readonly kind?: string }>(
  events: readonly T[],
): T | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (SUPERSEDING_KINDS.has(event.kind as RunEvent["kind"])) return null;
    if (event.kind === PARK_KIND) return event;
  }
  return null;
}
