// Smoke check for the pinned graph.js: renders inline data, never fetches.
// Usage: node check-graph.js graph.js   (exit 0 = safe to inline)
const fs = require('fs'), assert = require('assert');
const src = fs.readFileSync(process.argv[2], 'utf8');
function el() { return { innerHTML: '', dataset: {}, style: {}, scrollWidth: 0, classList: { add() {} },
  addEventListener() {}, appendChild() {}, querySelector: () => el(), querySelectorAll: () => [], closest: () => null }; }
function run(inlineText) {
  const root = el(); let fetched = false;
  global.fetch = () => { fetched = true; return new Promise(() => {}); };
  global.window = {}; global.document = { readyState: 'complete', head: el(), body: el(), createElement: el,
    querySelectorAll: s => s === '[data-token-activity]' ? [root] : [],
    getElementById: id => id === 'token-activity-data' && inlineText != null ? { textContent: inlineText } : null };
  new Function(src)();
  return { root, fetched };
}
const good = JSON.stringify({ days: { '2026-09-29': { claude: { in: 3, out: 7, cr: 0, cw: 0, cost: 0.01, calls: 1 } } },
  models: { '2026-09-29': { claude: { 'claude-opus-5-5': { in: 3, out: 7, cr: 0, cw: 0, cost: 0.01, calls: 1 } } } } });
let r = run(good);   assert(!r.fetched); assert(r.root.innerHTML.includes('token activity'), 'did not mount');
r = run(null);       assert(!r.fetched); assert(r.root.innerHTML.includes('missing or invalid'));
r = run('{broken');  assert(!r.fetched); assert(r.root.innerHTML.includes('missing or invalid'));
console.log('ok: mounts inline data; missing/broken data errors; zero fetches');
