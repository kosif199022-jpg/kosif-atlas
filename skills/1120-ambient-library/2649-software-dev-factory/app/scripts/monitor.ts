// Factory Control Room — a read-only local monitor over the factory's own
// telemetry. Serves one page + one JSON endpoint on 127.0.0.1 and POLLS the
// three durable sources the controller already writes:
//   docs/runs/<run_id>/events.jsonl      (the P25 event mirror — feed + rail)
//   refs/factory/runs/<id> : run.json    (status, disposition, review)
//   refs/factory/active    : lease.json  (the lock + holder pid)
// Read-only except for one write path, POST /verdict (see recordVerdict): it
// writes the owner's approval envelope and runs `cli.ts verdict`. No ref is
// written and no lease taken by the monitor itself.
//
// Data comes from the working directory (the project); code (src/cli.ts,
// monitor.html) comes from the bundle this script sits in.
//
//   cd <project> && node --experimental-strip-types --no-warnings <bundle>/scripts/monitor.ts   (port 4600)
//   FACTORY_MONITOR_PORT=5000 node --experimental-strip-types --no-warnings <bundle>/scripts/monitor.ts

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { currentPark } from "./park-currency.ts";

// ROOT: the project whose runs this board shows. CODE: the bundle that ships this script.
const ROOT = process.cwd();
const CODE = resolve(fileURLToPath(new URL("..", import.meta.url)));
if (!existsSync(join(ROOT, ".aai", "policy", "factory.yaml"))) {
  process.stderr.write(
    `factory control room: ${ROOT} is not a factory project (no .aai/policy/factory.yaml). Start the monitor from your project folder.\n`,
  );
  process.exit(2);
}
// FACTORY_MONITOR_PORT wins; PORT is the harness-assigned fallback (autoPort).
const envPort = [process.env.FACTORY_MONITOR_PORT, process.env.PORT].find(
  (p) => /^\d+$/.test(p ?? ""),
);
const PORT = envPort !== undefined ? Number(envPort) : 4600;
const STAGES = ["intake", "plan", "baseline", "red", "green", "quality", "reconcile", "review", "candidate"];

function git(args: readonly string[]): string | null {
  const r = spawnSync("git", ["-C", ROOT, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" },
  });
  return r.status === 0 ? r.stdout : null;
}

function gitShow(ref: string): string | null {
  return git(["show", ref]);
}

// "Is it working or stuck?" without touching the adapter: the lease already
// records the factory CLI's own pid, and an adapter invocation is a direct
// child of that process (spawnSync, still running when the parent is blocked
// on it). A live child IS the evidence — no PID needs recording anywhere else.
// ponytail: pgrep/ps, so macOS/Linux only. This script ships in the distro
// (build-distro.mjs COPY, ambient-distro/APP_FILES), and the docs say so;
// revisit if the monitor ever needs to run on Windows.
function liveAdapterChild(pid: number): { pid: number; command: string; elapsed: string } | null {
  const found = spawnSync("pgrep", ["-P", String(pid), "-l"], { encoding: "utf8" });
  const line = found.status === 0 ? (found.stdout ?? "").trim().split("\n")[0] : undefined;
  if (line === undefined || line === "") return null;
  const [childPid, ...rest] = line.trim().split(/\s+/);
  const elapsed = spawnSync("ps", ["-o", "etime=", "-p", childPid], { encoding: "utf8" });
  return { pid: Number(childPid), command: rest.join(" "), elapsed: elapsed.status === 0 ? (elapsed.stdout ?? "").trim() : "" };
}

// What the owner needs to sign a review park: what was asked for, what came
// back, and only then the code. Read-only like everything here.
const DIFF_CAP = 400_000;

// The spec as APPROVED, fetched by the blob OID the run record pins — not the
// working-tree file, which may have moved on since the signature.
// ponytail: a five-field scan, not the real parser. src/controller/sdlc/spec.ts
// keeps parseFrontmatter private and its exported type drops `problem`, the one
// field this panel most needs; exporting it to feed a dev-only monitor is a
// worse trade than this. If the front-matter grammar changes, fields go missing
// here and the panel says so rather than inventing them.
function readApprovedSpec(digest: string): Record<string, unknown> | null {
  const text = git(["cat-file", "-p", digest]);
  if (text === null) return null;
  const lines = text.split("\n");
  const scalar = (field: string): string | null => {
    const hit = lines.find((l) => l.startsWith(`${field}: `));
    return hit === undefined ? null : hit.slice(field.length + 2).trim();
  };
  // Criterion outcomes sit two levels in, under acceptance_criteria.
  const criteria: { id: string; outcome: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const id = /^ {2}- id: (.+)$/.exec(lines[i] ?? "");
    if (id === null) continue;
    const outcome = /^ {4}outcome: (.+)$/.exec(lines[i + 1] ?? "");
    criteria.push({ id: id[1].trim(), outcome: outcome === null ? "" : outcome[1].trim() });
  }
  return { problem: scalar("problem"), outcome: scalar("outcome"), criteria };
}

// One `git diff` split on its own file boundaries — N spawns for N files buys
// nothing when the whole diff is already in hand.
function splitDiff(diff: string): { path: string; body: string; added: number; removed: number }[] {
  return diff
    .split(/^diff --git /m)
    .filter((chunk) => chunk.trim() !== "")
    .map((chunk) => {
      const body = `diff --git ${chunk}`;
      const lines = body.split("\n");
      const header = /b\/(\S+)/.exec(lines[0] ?? "");
      return {
        path: header === null ? "(unknown file)" : header[1],
        body,
        added: lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length,
        removed: lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length,
      };
    });
}

function collectReview(runId: string): Record<string, unknown> {
  const record = readJson(gitShow(`refs/factory/runs/${runId}:run.json`));
  if (record === null) return { error: "no durable record for this run (abandoned, or never written)" };

  const red = typeof record.red_sha === "string" ? record.red_sha : null;
  const green = typeof record.green_sha === "string" ? record.green_sha : null;
  const base = typeof record.base_sha === "string" ? record.base_sha : null;
  // red^ is the true pre-change tree; base_sha covers a run that never got a red commit.
  const from = red === null ? base : `${red}^`;

  let files: ReturnType<typeof splitDiff> = [];
  let truncated = false;
  if (from !== null && green !== null) {
    const full = git(["diff", from, green]);
    if (full !== null) {
      truncated = full.length > DIFF_CAP;
      files = splitDiff(full.slice(0, DIFF_CAP));
    }
  }

  // A decision already signed on disk. Page state is not memory: closing the
  // card, or reloading, must not erase the fact that the owner already answered
  // — especially when the answer was saved but could not be carried out.
  let signed: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(join(ROOT, ".aai", "runs", runId.split(":")[0], "review-verdict.approval.json"), "utf8"),
    );
    if (isRecord(parsed) && typeof parsed.decision === "string") {
      signed = { decision: parsed.decision, timestamp: parsed.timestamp ?? null };
    }
  } catch {
    signed = null;
  }

  const coverage = record.green_coverage as Record<string, unknown> | undefined;
  return {
    signed,
    run_id: runId,
    spec_id: record.spec_id ?? null,
    stage: record.stage ?? null,
    disposition: record.disposition ?? null,
    missing: record.missing ?? [],
    // findings: [] means reviewed-and-clean; null means the reply had no parseable
    // record; the whole field absent means the run predates OI-19's retention.
    review: record.review ?? null,
    spec: typeof record.spec_digest === "string" ? readApprovedSpec(record.spec_digest) : null,
    checks: {
      coverage_lines: typeof coverage?.lines === "number" ? coverage.lines : null,
      coverage_floor: typeof coverage?.floor === "number" ? coverage.floor : null,
      tests_ran: coverage?.ran === true && coverage?.exit === 0,
      quality_passed: (record.quality_evidence as Record<string, unknown> | undefined)?.passed === true,
    },
    range: from === null || green === null ? null : `${from}..${green}`,
    files,
    diff_truncated: truncated,
  };
}

function readJson(text: string | null): Record<string, unknown> | null {
  if (text === null) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

interface RunEventLine {
  readonly ts?: string;
  readonly seq?: number;
  readonly stage?: string;
  readonly kind?: string;
  readonly tokens?: readonly string[];
  readonly missing?: readonly string[];
  readonly disposition?: string;
}

function readEvents(runId: string): RunEventLine[] {
  try {
    return readFileSync(join(ROOT, "docs", "runs", runId, "events.jsonl"), "utf8")
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => {
        try { return JSON.parse(l) as RunEventLine; } catch { return {}; }
      });
  } catch {
    return [];
  }
}

// The remaining-work order is an owner decision (specs/factory-v2.md 5/6 plus the
// delegated rulings); nothing in the run record implies it, so the queue is declared in
// docs/release-queue.md and only read here. Missing or unparsed yields an empty list and
// the pane says so, rather than showing nothing and implying the release is complete.
type QueueItem = { done: boolean; text: string; blocked: string | null; release: string };
// Release lanes: an `## v2.1 …` heading starts a lane; items before any such heading
// belong to the release the intro names ("for the v2.0 release"). ponytail: heading
// convention, no per-item field — add one if a release ever spans files.
function readQueue(): QueueItem[] {
  let raw: string;
  try {
    raw = readFileSync(join(ROOT, "docs", "release-queue.md"), "utf8");
  } catch {
    return [];
  }
  const intro = /\bv\d+\.\d+(?:\.\d+)?(?:-[a-z0-9]+)?\b/i.exec(raw);
  let release = intro === null ? "current" : intro[0];
  const out: QueueItem[] = [];
  for (const line of raw.split("\n")) {
    const h = /^##\s+(v\d\S*)/i.exec(line.trim());
    if (h !== null) release = h[1];
    const m = /^- \[([ x])\]\s+(.+)$/.exec(line.trim());
    if (m === null) continue;
    const blocked = /\s+--\s*blocked:\s*(.+)$/.exec(m[2]);
    out.push({
      done: m[1] === "x",
      text: (blocked === null ? m[2] : m[2].slice(0, blocked.index)).trim(),
      blocked: blocked === null ? null : blocked[1].trim(),
      release,
    });
  }
  return out;
}

function collectState(selectedRunId: string | null): Record<string, unknown> {
  const lease = readJson(gitShow("refs/factory/active:lease.json"));
  const holderPid = typeof lease?.holder_pid === "number" ? lease.holder_pid : null;
  const working = holderPid === null ? null : liveAdapterChild(holderPid);

  let runIds: string[] = [];
  try {
    runIds = readdirSync(join(ROOT, "docs", "runs"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    runIds = [];
  }

  const runs = runIds.map((runId) => {
    const events = readEvents(runId);
    const record = readJson(gitShow(`refs/factory/runs/${runId}:run.json`));
    const advanced = events.filter((e) => e.kind === "stage-advanced").map((e) => e.stage);
    const started = events.filter((e) => e.kind === "stage-started").map((e) => e.stage);
    // OI-43: the park the run is IN, not the last park that ever happened —
    // a stage that parked and then advanced is not parked. See park-currency.ts.
    const parked = currentPark(events);
    const complete =
      events.some((e) => e.kind === "run-complete") || record?.status === "complete";
    const first = events[0]?.ts ?? null;
    const last = events.at(-1)?.ts ?? null;
    // A park is only waiting on the owner while the spec index still names
    // this run. Once a later run took the spec over, the park is history and
    // must not count as "waiting on you" (two 130h-old cards, 2026-09-03).
    const specId = typeof record?.spec_id === "string" ? record.spec_id : null;
    const index = specId === null ? null : readJson(gitShow(`refs/factory/specs/${specId}:spec.json`));
    const superseded = index !== null && typeof index.run_id === "string" && index.run_id !== runId;
    return {
      run_id: runId,
      spec_id: specId,
      superseded,
      record_status: typeof record?.status === "string" ? record.status : null,
      record_disposition: typeof record?.disposition === "string" ? record.disposition : null,
      record_stage: typeof record?.stage === "string" ? record.stage : null,
      review: record?.review ?? null,
      // The packet the run is executing, as the durable record carries it:
      // acceptance criteria, the criterion -> evidence map, the pinned model,
      // and the commits/coverage the stages produced.
      packet: record === null ? null : {
        criterion_ids: Array.isArray(record.criterion_ids) ? record.criterion_ids : [],
        criterion_map: Array.isArray(record.criterion_map) ? record.criterion_map : [],
        base_sha: typeof record.base_sha === "string" ? record.base_sha : null,
        red_sha: typeof record.red_sha === "string" ? record.red_sha : null,
        green_sha: typeof record.green_sha === "string" ? record.green_sha : null,
        adapter_model: typeof record.adapter_model === "string" ? record.adapter_model : null,
        adapter_reasoning_effort: typeof record.adapter_reasoning_effort === "string" ? record.adapter_reasoning_effort : null,
        governance: typeof record.governance === "string" ? record.governance : null,
        green_coverage: record.green_coverage ?? null,
        quality_passed: (record.quality_evidence as Record<string, unknown> | undefined)?.passed === true,
        integrated_diff_digest: typeof record.integrated_diff_digest === "string" ? record.integrated_diff_digest : null,
      },
      advanced,
      started,
      parked: parked === null ? null : { stage: parked.stage, disposition: parked.disposition, missing: parked.missing ?? [] },
      complete,
      first_ts: first,
      last_ts: last,
      event_count: events.length,
    };
  });

  const leaseRun = typeof lease?.run_id === "string" ? lease.run_id : null;
  const byLast = [...runs].sort((a, b) => String(b.last_ts ?? "").localeCompare(String(a.last_ts ?? "")));
  const live = (leaseRun !== null && runs.find((r) => r.run_id === leaseRun)) || byLast[0] || null;
  // History selection: any recorded run can be viewed from its events.jsonl,
  // even long after the run ref was abandoned. An unknown id falls back to live.
  const viewed = (selectedRunId !== null && runs.find((r) => r.run_id === selectedRunId)) || live;

  return {
    now: new Date().toISOString(),
    working,
    lease,
    stages: STAGES,
    live_run_id: live?.run_id ?? null,
    active_run_id: viewed?.run_id ?? null,
    viewing_history: viewed !== null && live !== null && viewed.run_id !== live.run_id,
    active_events: viewed === null ? [] : readEvents(viewed.run_id).slice(-120),
    runs: byLast,
    queue: readQueue(),
  };
}

const PAGE = readFileSync(new URL("./monitor.html", import.meta.url), "utf8");

const RUN_ID = /^[0-9a-f-]{1,64}$/;

// THE ONE WRITE PATH. Everything else in this file only reads. Recording a
// verdict is the owner's own act, and the factory's auth model for it is
// `machine_possession` — possession of this machine IS the authority — so a
// 127.0.0.1-bound button is exactly as strong a channel as the CLI, no more and
// no less. It writes only what the owner would have typed: the envelope at the
// path the controller derives, then `cli.ts verdict` against it. It never
// touches a factory ref itself; the controller does that, with its own gates.
function recordVerdict(
  runId: string,
  decision: "approve" | "reject",
  reason: string,
): Record<string, unknown> {
  const record = readJson(gitShow(`refs/factory/runs/${runId}:run.json`));
  if (record === null) return { ok: false, error: "no durable record for this run" };
  if (record.status !== "parked" || record.disposition !== "needs_owner") {
    return { ok: false, error: `this run is ${String(record.status)}/${String(record.disposition)}, not waiting on a decision` };
  }
  const digest = record.integrated_diff_digest;
  if (typeof digest !== "string") return { ok: false, error: "the run has no integrated diff digest to sign" };

  // <run_name> is the run_id up to any ":" suffix — the path the controller derives.
  const dir = join(ROOT, ".aai", "runs", runId.split(":")[0]);
  mkdirSync(dir, { recursive: true });

  // Exactly the nine keys validateApproval accepts; an extra field is refused
  // outright, which is why the reject reason goes beside it, not inside it.
  const envelope = {
    subject_digest: digest,
    subject_kind: "review_verdict",
    decision,
    principal: "local_operator",
    auth_source: "machine_possession",
    timestamp: new Date().toISOString(),
    event_id: `approval-${randomUUID()}`,
    canonicalization_version: 1,
    policy_version: "factory-policy-v1",
  };
  const envelopePath = join(dir, "review-verdict.approval.json");
  writeFileSync(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`);

  // The owner's words. Evidence for whoever picks this up next, never an input
  // to the trust chain — the factory records only "reviewer rejected the
  // verdict" itself, so without this a reject loses the one thing that explains it.
  if (reason.trim() !== "") {
    writeFileSync(
      join(dir, "review-note.md"),
      `# Owner note on ${decision}\n\n- run: ${runId}\n- signed: ${envelope.timestamp}\n\n${reason.trim()}\n`,
    );
  }

  // Load the env files the installed shims load, folder first then project, so
  // the project wins. bash sources them; no env-file parser here.
  const cli = spawnSync(
    "bash",
    [
      "-c",
      'set -a; [ -f "$1" ] && . "$1"; [ -f "$2" ] && . "$2"; set +a; exec "$3" --experimental-strip-types --no-warnings "$4" verdict "$5"',
      "factory-monitor-verdict",
      folderEnv(),
      join(ROOT, ".aai", "factory.env"),
      process.execPath,
      join(CODE, "src", "cli.ts"),
      relative(ROOT, envelopePath),
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  const output = `${cli.stdout ?? ""}${cli.stderr ?? ""}`.trim();
  // A refused verdict puts `reason` at the top level; a verdict that was accepted
  // but then failed a later gate buries it under `status`. Both must read back.
  let refusal = output;
  try {
    const parsed: unknown = JSON.parse(cli.stdout ?? "");
    if (isRecord(parsed)) {
      if (typeof parsed.reason === "string") refusal = parsed.reason;
      else if (isRecord(parsed.status) && typeof parsed.status.reason === "string") refusal = parsed.status.reason;
    }
  } catch {
    // not JSON; the raw output is the best we have
  }
  return {
    ok: cli.status === 0,
    decision,
    exit_code: cli.status,
    output,
    // The person signing did nothing wrong and cannot act on "no worker source
    // configured". Say what actually blocked it and who fixes it.
    plain: cli.status === 0 ? null : plainRefusal(refusal),
  };
}

// The folder's factory.env, only for a bundle where the --factory or ambient
// shims keep it; plain and --library bundles match no suffix and get "".
// ponytail: fixed suffixes, no walk up — a walk could source ~/.aai/factory.env.
const FOLDER_SUFFIXES = ["/.ailib/software-dev-factory", "/.ailib/software-dev-factory/app", "/.aai/skills/software-dev-factory/app"];
function folderEnv(): string {
  const suffix = FOLDER_SUFFIXES.find((s) => CODE.endsWith(s));
  if (suffix === undefined) return "";
  const folder = CODE.slice(0, -suffix.length);
  const isDir = (() => { try { return statSync(join(folder, ".aai")).isDirectory(); } catch { return false; } })();
  return isDir && resolve(folder) !== resolve(ROOT) ? join(folder, ".aai", "factory.env") : "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function plainRefusal(reason: string): string {
  if (reason.includes("evidence incomplete")) {
    return "Your approval was accepted, but the factory cannot finish: this run was started by an older version of the factory that did not keep all the paperwork the current version requires. The work itself is fine — the receipts for it are not. This run cannot be completed, and clicking again will not change that. Ask for it to be abandoned and re-run.";
  }
  if (reason.includes("worker source")) {
    return "Your decision was saved, but the factory could not carry it out: it has no AI assistant configured to finish the remaining work. Whoever set up this factory needs to start it with an assistant configured. Nothing was lost — your decision is on file and will apply once that is fixed.";
  }
  if (reason.includes("already accepted")) {
    return "This decision was already recorded earlier. Nothing changed.";
  }
  if (reason.includes("not bound to this run")) {
    return "Your decision does not match the change on file — the code moved since this was prepared. Ask for a fresh review rather than signing this one.";
  }
  // Never hand back a JSON blob. An untranslated refusal still reaches the owner
  // as a sentence, with the raw text kept as the tail for whoever can act on it.
  return `The factory could not carry out your decision. It said: ${reason}`;
}

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/verdict") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      let out: Record<string, unknown>;
      try {
        const sent = JSON.parse(body) as Record<string, unknown>;
        const runId = typeof sent.run === "string" ? sent.run : "";
        const decision = sent.decision === "approve" || sent.decision === "reject" ? sent.decision : null;
        out = !RUN_ID.test(runId) || decision === null
          ? { ok: false, error: "bad request" }
          : recordVerdict(runId, decision, typeof sent.reason === "string" ? sent.reason : "");
      } catch (error) {
        out = { ok: false, error: error instanceof Error ? error.message : "could not record the decision" };
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(out));
    });
    return;
  }
  if (req.url !== undefined && req.url.startsWith("/review")) {
    const runId = new URL(req.url, "http://localhost").searchParams.get("run") ?? "";
    res.writeHead(RUN_ID.test(runId) ? 200 : 400, { "content-type": "application/json" });
    res.end(JSON.stringify(RUN_ID.test(runId) ? collectReview(runId) : { error: "bad run id" }));
    return;
  }
  if (req.url !== undefined && req.url.startsWith("/state")) {
    const url = new URL(req.url, "http://localhost");
    const selected = url.searchParams.get("run");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(collectState(RUN_ID.test(selected ?? "") ? selected : null)));
    return;
  }
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`factory control room: http://127.0.0.1:${PORT}\n`);
});
