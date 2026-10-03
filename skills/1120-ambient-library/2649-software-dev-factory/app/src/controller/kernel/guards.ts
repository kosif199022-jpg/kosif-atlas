// Shared runtime type guards. Lives in the kernel so both kernel/ and sdlc/
// may import it (kernel/ must never import from sdlc/). Only byte-equivalent
// duplicates were consolidated here; divergent local variants stay local with
// a comment naming the divergence.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// L-031/L-036: strings handed to process APIs must be nonempty and NUL-free,
// otherwise spawnSync throws outside the result boundary. Allows
// whitespace-only strings; use isProcessSafe where those must be rejected too.
export function isProcessString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !value.includes("\0");
}

// Stricter variant for identifiers (runId, specId, refs): also rejects
// whitespace-only strings. Formerly exported from kernel/resume.ts.
export function isProcessSafe(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("\0");
}
