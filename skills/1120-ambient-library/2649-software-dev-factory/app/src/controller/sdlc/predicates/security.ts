import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

import { observeEffectViolations } from "../../kernel/invariants/observed-effects.ts";
import { isProcessString, isStringArray } from "../../kernel/guards.ts";

// Untrusted-result evaluation (§11, FR-S2). Findings carry redacted metadata
// only: never raw secrets, never raw proposed command strings. Prose text is
// never a quarantine cause; only tracked effects, proposed commands, and
// secrets in diff/outputs are.

export interface UntrustedResultInput {
  readonly repositoryPath: string;
  readonly baseSha: string;
  readonly resultSha: string;
  readonly refsBefore: string;
  readonly refsAfter: string;
  readonly allowedPaths: readonly string[];
  readonly protectedPaths: readonly string[];
  readonly text?: string;
  readonly proposedCommands?: readonly string[];
  readonly outputs?: readonly string[];
}

export interface SecurityFinding {
  readonly kind: string;
  readonly redacted: true;
  readonly [key: string]: unknown;
}

export interface SecurityEvaluation {
  readonly disposition: "accepted" | "quarantine";
  readonly findings: readonly SecurityFinding[];
}

const SHA_PATTERN = /^[0-9a-f]{40}$/;

// L-038: untrusted command strings are bounded before any backtracking regex
// runs. Real proposals are a few hundred bytes; anything larger is itself a
// finding and is never scanned.
const MAX_COMMAND_LENGTH = 4096;

// Command-authority families the factory never lets an agent request.
const AUTHORITY_COMMANDS: ReadonlyArray<readonly [string, RegExp]> = [
  ["git-push", /\bgit\b[^\n|;&]*\bpush\b/],
  ["git-merge", /\bgit\b[^\n|;&]*\bmerge\b/],
  ["git-tag", /\bgit\b[^\n|;&]*\btag\b/],
  ["git-commit", /\bgit\b[^\n|;&]*\bcommit\b/],
  ["git-update-ref", /\bgit\b[^\n|;&]*\bupdate-ref\b/],
  ["gh-merge", /\bgh\s+pr\s+merge\b/],
  ["gh-release", /\bgh\s+release\b/],
  ["gh-approve", /\bgh\s+pr\s+review\b[^\n]*--approve/],
];

// ponytail: vendor-shape secret patterns; extend the table when a real leak
// shows a shape not covered here.
const SECRET_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["github-fine-grained", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["slack-token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ["generic-assignment", /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"'\s]{16,}["']/i],
];

function gitRead(cwd: string, args: readonly string[]): string | null {
  try {
    const result = spawnSync("git", [...args], { cwd, encoding: "utf8" });
    return result.status === 0 ? result.stdout : null;
  } catch {
    return null;
  }
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function quarantine(findings: readonly SecurityFinding[]): SecurityEvaluation {
  return {
    disposition: findings.length === 0 ? "accepted" : "quarantine",
    findings,
  };
}

export function evaluateUntrustedResult(input: unknown): SecurityEvaluation {
  const invalid = quarantine([{ kind: "security.invalid-input", redacted: true }]);
  if (typeof input !== "object" || input === null) return invalid;
  const i = input as Partial<UntrustedResultInput>;
  if (
    !isProcessString(i.repositoryPath) ||
    typeof i.baseSha !== "string" ||
    !SHA_PATTERN.test(i.baseSha) ||
    typeof i.resultSha !== "string" ||
    !SHA_PATTERN.test(i.resultSha) ||
    typeof i.refsBefore !== "string" ||
    typeof i.refsAfter !== "string" ||
    !isStringArray(i.allowedPaths) ||
    !isStringArray(i.protectedPaths) ||
    (i.text !== undefined && typeof i.text !== "string") ||
    (i.proposedCommands !== undefined && !isStringArray(i.proposedCommands)) ||
    (i.outputs !== undefined && !isStringArray(i.outputs))
  ) {
    return invalid;
  }

  const findings: SecurityFinding[] = [];

  // Tracked effects: read-only diff, then the pure kernel invariant.
  const names = gitRead(i.repositoryPath, // L-038: --no-renames so a moved protected/stray path reports both sides.
    ["diff", "--no-renames", "--name-only", "-z", i.baseSha, i.resultSha]);
  if (names === null) {
    findings.push({ kind: "effect.unreadable-diff", redacted: true });
  } else {
    const changedPaths = names.split("\0").filter((p) => p.length > 0);
    for (const v of observeEffectViolations({
      refsBefore: i.refsBefore,
      refsAfter: i.refsAfter,
      changedPaths,
      allowedPaths: i.allowedPaths,
      protectedPaths: i.protectedPaths,
    }).violations) {
      findings.push({ kind: v.kind, count: v.count, redacted: true });
    }
  }

  // Authority: proposed commands only; prose never counts (owner decision 3).
  for (const command of i.proposedCommands ?? []) {
    if (command.length > MAX_COMMAND_LENGTH) {
      findings.push({
        kind: "authority.oversized-command",
        redacted: true,
        length: command.length,
        sha256Prefix: digest(command),
      });
      continue;
    }
    const family = AUTHORITY_COMMANDS.find(([, re]) => re.test(command))?.[0];
    if (family !== undefined) {
      findings.push({
        kind: "authority.command-proposed",
        redacted: true,
        family,
        length: command.length,
        sha256Prefix: digest(command),
      });
    }
  }

  // Secrets: diff content plus outputs. Never the prose text.
  const patch =
    names === null
      ? null
      : gitRead(i.repositoryPath, ["diff", "--no-renames", "--no-color", i.baseSha, i.resultSha]);
  if (patch === null && names !== null) {
    findings.push({ kind: "effect.unreadable-diff", redacted: true });
  }
  const scan: ReadonlyArray<readonly [string, string]> = [
    ...(patch === null ? [] : [["diff", patch] as const]),
    ...(i.outputs ?? []).map((o, n) => [`output:${n}`, o] as const),
  ];
  for (const [source, content] of scan) {
    for (const [shape, re] of SECRET_PATTERNS) {
      const match = re.exec(content);
      if (match) {
        findings.push({
          kind: "secret.detected",
          redacted: true,
          source,
          shape,
          length: match[0].length,
          sha256Prefix: digest(match[0]),
        });
        break; // one finding per source; the first matching shape names it
      }
    }
  }

  return quarantine(findings);
}
