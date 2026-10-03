import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SDLC_ROLES } from "../lifecycle.ts";
import { isRecord } from "../../kernel/guards.ts";

// P14 (FR-K13; spec §7 role package contract, §11 untrusted results, §14
// invocation version/digest). Read-only validation of factory-owned role
// packages under .ailib/factory/roles/<name>/{role.json,ROLE.md}. Nothing here
// throws across the public seams: malformed input becomes findings.

export type FindingKind =
  | "eligibility"
  | "authority"
  | "provenance"
  | "identity"
  | "malformed_result"
  | "undeclared_effect";

export interface Finding {
  readonly kind: FindingKind;
  readonly path?: string;
  readonly reason: string;
}

export interface RoleSource {
  readonly repository: string;
  readonly revision: string;
  readonly license: string;
  readonly licenseFile: string;
  readonly path: string;
  readonly upstreamDigest: string;
}

export interface RoleIdentity {
  readonly name: string;
  readonly version: string;
  readonly digest: string;
}

export interface PackageValidation {
  readonly ok: boolean;
  readonly role?: RoleIdentity;
  readonly findings: readonly Finding[];
}

export interface CorpusValidation {
  readonly ok: boolean;
  readonly roles: readonly (RoleIdentity & { readonly provenance: readonly RoleSource[] })[];
  readonly findings: readonly Finding[];
}

export interface ResultValidation {
  readonly accepted: boolean;
  readonly findings: readonly Finding[];
}

export const REQUIRED_AUTHORITY_EXCLUSIONS = [
  "git_write",
  "github_write",
  "approval",
  "policy_change",
] as const;

const BOOTSTRAP_ROOT = fileURLToPath(
  new URL("../../../../.agents/skills/factory-bootstrap/", import.meta.url),
);
const LOCK_PATH = join(BOOTSTRAP_ROOT, "source-lock.yaml");
const ROLE_NAMES = new Set(SDLC_ROLES.map((r) => r.name));

const sha256 = (...parts: Buffer[]): string => {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  return h.digest("hex");
};

// Diverge from kernel/guards.ts: isNonEmptyString trims (approval.ts's does
// not) and isStringArray narrows to mutable string[], so this cluster stays local.
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");
const isNonEmptyStringArray = (v: unknown): v is string[] =>
  isStringArray(v) && v.length > 0 && v.every(isNonEmptyString);

interface LockSource {
  readonly repository: string;
  readonly revision: string;
  readonly license: string;
  readonly licenseFile: string;
}

// Strict line reader for the top-level `sources:` block only. Anything it does
// not recognise is ignored, so an unexpected lock layout yields zero sources and
// derived provenance fails closed.
export function readLockSources(lockPath: string = LOCK_PATH): readonly LockSource[] {
  let text: string;
  try {
    text = readFileSync(lockPath, "utf8");
  } catch {
    return [];
  }
  const out: LockSource[] = [];
  let inSources = false;
  let cur: Partial<Record<keyof LockSource, string>> | null = null;
  const flush = () => {
    if (cur?.repository && cur.revision && cur.license && cur.licenseFile) {
      out.push(cur as LockSource);
    }
    cur = null;
  };
  for (const line of text.split(/\r?\n/)) {
    if (/^sources:\s*$/.test(line)) {
      inSources = true;
      continue;
    }
    if (inSources && /^\S/.test(line)) {
      flush();
      inSources = false;
    }
    if (!inSources) continue;
    if (/^  [^\s:][^:]*:\s*$/.test(line)) {
      flush();
      cur = {};
      continue;
    }
    const m = /^    (repository|revision|license|license_file):\s*(\S+)\s*$/.exec(line);
    if (m && cur) {
      cur[m[1] === "license_file" ? "licenseFile" : (m[1] as keyof LockSource)] = m[2];
    }
  }
  flush();
  return out;
}

function readSource(raw: unknown, idx: number, lock: readonly LockSource[], findings: Finding[]): RoleSource | null {
  const at = `provenance.sources[${idx}]`;
  if (!isRecord(raw)) {
    findings.push({ kind: "provenance", path: at, reason: "source must be an object" });
    return null;
  }
  const fields = ["repository", "revision", "license", "licenseFile", "path", "upstreamDigest"] as const;
  for (const f of fields) {
    if (!isNonEmptyString(raw[f])) {
      findings.push({ kind: "provenance", path: `${at}.${f}`, reason: "missing or empty" });
      return null;
    }
  }
  const s = raw as unknown as RoleSource;
  const entry = lock.find(
    (l) => l.repository === s.repository && l.revision === s.revision && l.license === s.license,
  );
  if (!entry) {
    findings.push({ kind: "provenance", path: at, reason: "repository/revision/license not in source-lock.yaml" });
    return null;
  }
  if (entry.licenseFile !== s.licenseFile) {
    findings.push({ kind: "provenance", path: `${at}.licenseFile`, reason: `expected ${entry.licenseFile}` });
    return null;
  }
  if (s.path.includes("..") || s.path.startsWith("/")) {
    findings.push({ kind: "provenance", path: `${at}.path`, reason: "path must be relative within the vendored tree" });
    return null;
  }
  const vendored = join(BOOTSTRAP_ROOT, dirname(entry.licenseFile), s.path);
  let digest: string | null = null;
  try {
    digest = sha256(readFileSync(vendored));
  } catch {
    digest = null;
  }
  if (digest === null) {
    findings.push({ kind: "provenance", path: `${at}.path`, reason: "vendored file not readable" });
    return null;
  }
  if (digest !== s.upstreamDigest) {
    findings.push({ kind: "provenance", path: `${at}.upstreamDigest`, reason: "does not match vendored file sha256" });
    return null;
  }
  return s;
}

interface Checked {
  readonly identity: RoleIdentity;
  readonly provenance: readonly RoleSource[];
  readonly sideEffects: readonly string[];
}

function checkPackage(packagePath: string, findings: Finding[]): Checked | null {
  const dirName = basename(packagePath);
  let jsonBytes: Buffer;
  let mdBytes: Buffer;
  try {
    jsonBytes = readFileSync(join(packagePath, "role.json"));
    mdBytes = readFileSync(join(packagePath, "ROLE.md"));
  } catch {
    findings.push({ kind: "identity", path: packagePath, reason: "role.json and ROLE.md are required" });
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(jsonBytes.toString("utf8"));
  } catch {
    findings.push({ kind: "identity", path: "role.json", reason: "not valid JSON" });
    return null;
  }
  if (!isRecord(json)) {
    findings.push({ kind: "identity", path: "role.json", reason: "must be an object" });
    return null;
  }

  // identity
  const name = json.name;
  if (!isNonEmptyString(name)) {
    findings.push({ kind: "identity", path: "name", reason: "missing" });
  } else {
    if (name !== dirName) findings.push({ kind: "identity", path: "name", reason: `must equal directory name ${dirName}` });
    if (!ROLE_NAMES.has(name)) findings.push({ kind: "identity", path: "name", reason: "not a lifecycle role" });
  }
  if (!isNonEmptyString(json.version)) findings.push({ kind: "identity", path: "version", reason: "missing" });
  const md = mdBytes.toString("utf8");
  if (md.trim() === "") findings.push({ kind: "identity", path: "ROLE.md", reason: "empty" });
  else {
    if (isNonEmptyString(name) && !md.includes(name)) findings.push({ kind: "identity", path: "ROLE.md", reason: "must contain the role name" });
    if (!/^## Authority exclusions\s*$/m.test(md)) findings.push({ kind: "authority", path: "ROLE.md", reason: "missing '## Authority exclusions' heading" });
  }

  // eligibility
  const el = json.eligibility;
  if (!isRecord(el) || !isNonEmptyStringArray(el.triggers)) findings.push({ kind: "eligibility", path: "eligibility.triggers", reason: "non-empty string[] required" });
  if (!isRecord(el) || !isNonEmptyStringArray(el.antiTriggers)) findings.push({ kind: "eligibility", path: "eligibility.antiTriggers", reason: "non-empty string[] required" });

  // typed io
  const io = json.io;
  const port = (v: unknown) => isRecord(v) && isNonEmptyString(v.name) && isNonEmptyString(v.type);
  for (const side of ["inputs", "outputs"] as const) {
    const list = isRecord(io) ? io[side] : undefined;
    if (!Array.isArray(list) || list.length === 0 || !list.every(port)) {
      findings.push({ kind: "identity", path: `io.${side}`, reason: "non-empty [{name,type}] required" });
    }
  }

  // allowed + authority
  const allowed = json.allowed;
  for (const f of ["tools", "paths", "sideEffects"] as const) {
    if (!isRecord(allowed) || !isStringArray(allowed[f])) findings.push({ kind: "authority", path: `allowed.${f}`, reason: "string[] required" });
  }
  const ex = json.authorityExclusions;
  if (!isStringArray(ex)) findings.push({ kind: "authority", path: "authorityExclusions", reason: "string[] required" });
  else {
    for (const r of REQUIRED_AUTHORITY_EXCLUSIONS) {
      if (!ex.includes(r)) findings.push({ kind: "authority", path: "authorityExclusions", reason: `must include ${r}` });
    }
  }

  // procedure, completion, evidence, failure
  if (!isNonEmptyStringArray(json.procedure) || json.procedure.length < 3) findings.push({ kind: "identity", path: "procedure", reason: "ordered string[] of length >= 3 required" });
  if (!isNonEmptyStringArray(json.completion)) findings.push({ kind: "identity", path: "completion", reason: "non-empty string[] required" });
  if (!isNonEmptyStringArray(json.evidence)) findings.push({ kind: "identity", path: "evidence", reason: "non-empty string[] required" });
  if (!isRecord(json.failure) || !isNonEmptyString(json.failure.handoff)) findings.push({ kind: "identity", path: "failure.handoff", reason: "non-empty string required" });

  // provenance + patterns
  const provenance: RoleSource[] = [];
  const prov = json.provenance;
  const patterns = json.patterns;
  if (!isRecord(prov) || typeof prov.derived !== "boolean" || !Array.isArray(prov.sources)) {
    findings.push({ kind: "provenance", path: "provenance", reason: "{derived: boolean, sources: []} required" });
  } else {
    const lock = prov.derived ? readLockSources() : [];
    prov.sources.forEach((s, i) => {
      const ok = readSource(s, i, lock, findings);
      if (ok) provenance.push(ok);
    });
    if (prov.derived) {
      if (prov.sources.length === 0) findings.push({ kind: "provenance", path: "provenance.sources", reason: "derived role needs >= 1 source" });
      if (!isRecord(patterns) || !isNonEmptyStringArray(patterns.adopted)) findings.push({ kind: "provenance", path: "patterns.adopted", reason: "derived role needs >= 1 adopted pattern" });
      if (!isRecord(patterns) || !isNonEmptyStringArray(patterns.rejected)) findings.push({ kind: "provenance", path: "patterns.rejected", reason: "derived role needs >= 1 rejected pattern" });
    }
  }
  if (!isRecord(patterns) || !isStringArray(patterns.adopted) || !isStringArray(patterns.rejected)) {
    findings.push({ kind: "provenance", path: "patterns", reason: "{adopted: string[], rejected: string[]} required" });
  }

  return {
    identity: {
      name: typeof name === "string" ? name : dirName,
      version: typeof json.version === "string" ? json.version : "",
      digest: sha256(jsonBytes, mdBytes),
    },
    provenance,
    sideEffects: isRecord(allowed) && isStringArray(allowed.sideEffects) ? allowed.sideEffects : [],
  };
}

export function validateRolePackage(input: { readonly packagePath: string }): PackageValidation {
  const findings: Finding[] = [];
  if (!isRecord(input) || !isNonEmptyString(input.packagePath)) {
    return { ok: false, findings: [{ kind: "identity", reason: "packagePath required" }] };
  }
  const checked = checkPackage(input.packagePath, findings);
  return { ok: findings.length === 0, ...(checked ? { role: checked.identity } : {}), findings };
}

export function validateRoleCorpus(input: { readonly rolesRoot: string }): CorpusValidation {
  const findings: Finding[] = [];
  const roles: CorpusValidation["roles"][number][] = [];
  if (!isRecord(input) || !isNonEmptyString(input.rolesRoot) || !existsSync(input.rolesRoot)) {
    return { ok: false, roles, findings: [{ kind: "identity", reason: "rolesRoot must exist" }] };
  }
  let dirs: string[];
  try {
    dirs = readdirSync(input.rolesRoot)
      .filter((d) => statSync(join(input.rolesRoot, d)).isDirectory())
      .sort();
  } catch {
    return { ok: false, roles, findings: [{ kind: "identity", reason: "rolesRoot unreadable" }] };
  }
  for (const d of dirs) {
    const local: Finding[] = [];
    const checked = checkPackage(join(input.rolesRoot, d), local);
    findings.push(...local.map((f) => ({ ...f, path: `${d}/${f.path ?? ""}` })));
    if (checked) roles.push({ ...checked.identity, provenance: checked.provenance });
  }
  for (const expected of ROLE_NAMES) {
    if (!dirs.includes(expected)) findings.push({ kind: "identity", path: expected, reason: "lifecycle role package missing" });
  }
  return { ok: findings.length === 0, roles, findings };
}

// Observed effects are clean relative file paths: no leading "/", no empty,
// "." or ".." segments (so "src/", "./src/x", "src/../y" are all undeclared).
const isCleanRelativePath = (p: string): boolean =>
  p !== "" && p.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");

// ponytail: glob support is `**` (any) and `*` (within one segment). Iterative
// O(glob x input) table instead of a backtracking RegExp, so pathological
// star-heavy globs stay bounded (L-038).
function globMatches(glob: string, input: string): boolean {
  const g = glob;
  const n = g.length;
  const m = input.length;
  let prev = new Uint8Array(m + 1);
  prev[0] = 1;
  let i = 0;
  while (i < n) {
    const star2 = g[i] === "*" && g[i + 1] === "*";
    const step = star2 ? 2 : 1;
    const cur = new Uint8Array(m + 1);
    if (star2) {
      cur[0] = prev[0];
      for (let j = 1; j <= m; j++) cur[j] = prev[j] || cur[j - 1] ? 1 : 0;
    } else if (g[i] === "*") {
      cur[0] = prev[0];
      for (let j = 1; j <= m; j++) cur[j] = prev[j] || (cur[j - 1] && input[j - 1] !== "/") ? 1 : 0;
    } else {
      for (let j = 1; j <= m; j++) cur[j] = prev[j - 1] && input[j - 1] === g[i] ? 1 : 0;
    }
    prev = cur;
    i += step;
  }
  return prev[m] === 1;
}

const effectDeclared = (observed: string, declared: readonly string[]): boolean =>
  isCleanRelativePath(observed) && declared.some((d) => d === observed || globMatches(d, observed));

export function validateRoleResult(input: {
  readonly role: RoleIdentity;
  readonly result: unknown;
  readonly declaredEffects: readonly string[];
  readonly observedEffects: readonly string[];
}): ResultValidation {
  const findings: Finding[] = [];
  if (!isRecord(input)) return { accepted: false, findings: [{ kind: "malformed_result", reason: "input must be an object" }] };
  const { role, result, declaredEffects, observedEffects } = input;
  if (!isRecord(role) || !isNonEmptyString(role.name) || !isNonEmptyString(role.version) || !/^[0-9a-f]{64}$/.test(String(role.digest))) {
    findings.push({ kind: "malformed_result", reason: "role identity {name, version, digest} required" });
  }
  if (!isRecord(result)) {
    findings.push({ kind: "malformed_result", reason: "result must be an object" });
  } else {
    if (!isNonEmptyString(result.status)) findings.push({ kind: "malformed_result", reason: "result.status required" });
    if (!isRecord(result.outputs)) findings.push({ kind: "malformed_result", reason: "result.outputs must be an object" });
    if (!Array.isArray(result.evidence)) findings.push({ kind: "malformed_result", reason: "result.evidence must be an array" });
  }
  if (!isStringArray(declaredEffects) || !isStringArray(observedEffects)) {
    findings.push({ kind: "malformed_result", reason: "declaredEffects and observedEffects must be string[]" });
  } else {
    for (const e of observedEffects) {
      if (!effectDeclared(e, declaredEffects)) findings.push({ kind: "undeclared_effect", reason: `observed effect not declared: ${e}` });
    }
  }
  return { accepted: findings.length === 0, findings };
}
