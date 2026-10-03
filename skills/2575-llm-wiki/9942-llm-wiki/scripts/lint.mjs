#!/usr/bin/env node
// Deterministic wiki checks. Contradiction-hunting is the model's job, not this script.
// Usage: node lint.mjs <wiki-root> [--stale-days N] [--index NAME.md]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const root = args[0];
if (!root) {
  console.error("usage: lint.mjs <wiki-root> [--stale-days N] [--index NAME.md]");
  process.exit(2);
}
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const staleDays = Number(flag("--stale-days", 180));
const indexName = flag("--index", "MEMORY.md");

const pages = readdirSync(root).filter((f) => f.endsWith(".md") && f !== indexName && f !== "WIKI.md" && f !== "LOG.md");
if (!pages.length) {
  console.log("no pages found in " + root);
  process.exit(0);
}
const slugs = new Set(pages.map((f) => f.replace(/\.md$/, "")));

const norm = (s) => s.toLowerCase().replace(/[\s._-]+/g, "");

const frontmatter = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  // flat key: value only — enough for the fields we check, no YAML dependency
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
};

const problems = { broken: [], missingField: [], longDesc: [], nameMismatch: [], stale: [] };
const inbound = new Map();
let linkCount = 0;

for (const file of pages) {
  const slug = file.replace(/\.md$/, "");
  const path = join(root, file);
  const text = readFileSync(path, "utf8");

  for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
    linkCount++;
    const target = m[1];
    if (slugs.has(target)) inbound.set(target, (inbound.get(target) || 0) + 1);
    else problems.broken.push(`${file} -> [[${target}]]`);
  }

  const fm = frontmatter(text);
  if (!fm) {
    problems.missingField.push(`${file}: no frontmatter`);
  } else {
    for (const field of ["name", "description"]) {
      if (!fm[field]) problems.missingField.push(`${file}: missing ${field}`);
    }
    // folded scalars land as "" here; only flag a real inline description that is too long
    if (fm.description && fm.description.length > 1024) {
      problems.longDesc.push(`${file}: description ${fm.description.length} chars (max 1024)`);
    }
    // compare loosely: hyphen/underscore/case/spacing are style, not drift
    if (fm.name && norm(fm.name) !== norm(slug)) {
      problems.nameMismatch.push(`${file}: name "${fm.name}" != slug "${slug}"`);
    }
  }

  const ageDays = (Date.now() - statSync(path).mtimeMs) / 86400000;
  if (ageDays > staleDays) problems.stale.push(`${file} (${Math.round(ageDays)}d)`);
}

const orphans = [...slugs].filter((s) => !inbound.has(s));

let index = null;
try {
  index = readFileSync(join(root, indexName), "utf8");
} catch {
  /* no index yet */
}
const unindexed = index ? pages.filter((f) => !index.includes(f)) : [];
const danglingIndex = index
  ? [...index.matchAll(/\(([^)]+\.md)\)/g)].map((m) => m[1]).filter((f) => !pages.includes(f) && f !== indexName)
  : [];

const section = (label, items) => {
  if (!items.length) return;
  console.log(`\n${label} (${items.length})`);
  for (const i of items) console.log("  " + i);
};

console.log(`${pages.length} pages, ${linkCount} links`);
section("BROKEN LINKS", problems.broken);
section("FRONTMATTER", problems.missingField);
section("NAME != FILENAME", problems.nameMismatch);
section("DESCRIPTION TOO LONG", problems.longDesc);
if (index) {
  section(`NOT IN ${indexName}`, unindexed);
  section(`${indexName} POINTS AT MISSING FILE`, danglingIndex);
} else {
  console.log(`\nNO INDEX (${indexName} not found)`);
}
section(`STALE (>${staleDays}d — review, not necessarily wrong)`, problems.stale);
section("ORPHANS (no inbound link)", orphans);

const blocking = problems.broken.length + problems.missingField.length + danglingIndex.length + unindexed.length;
console.log(`\n${blocking} structural problem(s). Contradiction check is the model's job — do it next.`);
process.exit(blocking ? 1 : 0);
