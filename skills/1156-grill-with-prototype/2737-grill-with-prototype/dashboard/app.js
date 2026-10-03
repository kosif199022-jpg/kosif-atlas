// Dashboard shell: hydrates from /api/state, stays live over /events, posts
// user actions to /api/action. Everything rendered comes from runtime/state.
// The Activity drawer (tasks + log) is part of the shell, on every page.

(function () {
  const $ = (id) => document.getElementById(id);
  const W = window.VibeWidgets;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`vibe:${k}`); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`vibe:${k}`, JSON.stringify(v)); } catch { /* per-viewer convenience only */ } },
  };
  const wide = () => window.matchMedia("(min-width: 1280px)").matches;

  let state = null;
  let logLines = [];
  let tasks = [];
  let apps = [];
  let pending = 0;
  let drawer = { open: store.get("drawerOpen", wide()), tab: store.get("drawerTab", "tasks") };
  let seenLog = 0;

  async function send(type, name, payload) {
    const page = state?.nav?.current;
    try {
      const r = await fetch("/api/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, name, page, payload }) });
      if (!r.ok) throw new Error((await r.json()).error || r.statusText);
      return true;
    } catch (err) {
      toast(`Could not reach the app server: ${err.message}`);
      return false;
    }
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  // Re-render a container without losing what the user is doing in it:
  // focus + caret, values typed into forms, and log scroll position.
  function preserve(root, fn) {
    const a = document.activeElement;
    const focusId = a && a.id && root.contains(a) ? a.id : null;
    const caret = focusId && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
    const dirty = {};
    root.querySelectorAll("[data-dirty]").forEach((el) => { if (el.id) dirty[el.id] = el.type === "checkbox" ? el.checked : el.value; });
    const scroll = {};
    root.querySelectorAll("[data-stick-bottom]").forEach((el) => {
      if (el.id) scroll[el.id] = el.scrollHeight - el.scrollTop - el.clientHeight < 24 ? "bottom" : el.scrollTop;
    });
    fn();
    for (const [id, val] of Object.entries(dirty)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = val; else el.value = val;
      el.dataset.dirty = "1";
    }
    root.querySelectorAll("[data-stick-bottom]").forEach((el) => {
      const s = scroll[el.id];
      el.scrollTop = s === undefined || s === "bottom" ? el.scrollHeight : s;
    });
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus({ preventScroll: true }); if (caret && typeof el.setSelectionRange === "function") try { el.setSelectionRange(...caret); } catch { /* not a text input */ } }
    }
  }

  function renderChrome() {
    const app = state.app || {};
    document.title = app.name || "Skill App";
    $("app-name").textContent = app.name || "";
    $("app-desc").textContent = app.description || "";
    $("nav").replaceChildren(...(state.nav?.pages || []).map((p) => {
      const a = W.h("a", { href: `#${p}`, onclick: (e) => { e.preventDefault(); go(p, true); } }, state.pages?.[p]?.title || p);
      if (p === state.nav?.current) a.setAttribute("aria-current", "page");
      return a;
    }));
    const st = state.status || {};
    $("strip").dataset.busy = String(!!st.busy);
    $("strip-phase").textContent = st.phase || "idle";
    $("strip-message").textContent = st.message || "";
  }

  function renderPage() {
    const cur = state.nav?.current;
    const page = state.pages?.[cur] || { title: cur, widgets: [] };
    $("page-title").textContent = page.title || cur || "";
    const ctx = { send, page: cur, logLines, tasks, apps, surface: "page", refresh: () => renderPage() };
    const widgets = page.widgets || [];
    preserve($("widgets"), () => $("widgets").replaceChildren(
      ...(widgets.length ? widgets.map((w) => W.render(w, ctx)) : [W.h("p", { class: "empty" }, "The agent hasn't put anything on this page yet.")])
    ));
  }

  function renderAll() { if (!state) return; renderChrome(); renderPage(); renderDrawer(); }

  // ---- activity drawer + rail indicators ----

  function renderIndicators() {
    const running = tasks.filter((t) => t.status === "running").length;
    const queued = tasks.filter((t) => t.status === "queued").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    const ind = $("ind-tasks");
    ind.dataset.active = String(running + queued > 0);
    ind.dataset.failed = String(failed > 0 && running + queued === 0);
    $("ind-tasks-text").textContent =
      running + queued ? `${running} running${queued ? `, ${queued} queued` : ""}` : failed ? `${failed} failed task${failed > 1 ? "s" : ""}` : "No tasks running";

    const tray = $("tray");
    tray.dataset.pending = String(pending > 0);
    $("tray-text").textContent = pending === 0 ? "Nothing waiting" : pending === 1 ? "1 action waiting for the agent" : `${pending} actions waiting for the agent`;

    const unseen = drawer.open && drawer.tab === "log" ? 0 : Math.max(0, logLines.length - seenLog);
    const unseenErr = logLines.slice(seenLog).some((l) => l.level === "error");
    $("tab-tasks-count").textContent = running + queued ? String(running + queued) : "";
    $("tab-log-count").textContent = unseen ? String(unseen) : "";
    const badge = $("activity-badge");
    const label = [running + queued ? `${running + queued} running` : "", unseen ? `${unseen} new` : ""].filter(Boolean).join(" · ");
    badge.hidden = !label;
    badge.textContent = label;
    badge.dataset.tone = unseenErr ? "error" : running + queued ? "busy" : "neutral";
  }

  function renderDrawer() {
    const shell = $("shell");
    shell.dataset.drawer = drawer.open ? "open" : "closed";
    $("drawer").hidden = !drawer.open;
    $("activity-btn").setAttribute("aria-expanded", String(drawer.open));
    for (const t of ["tasks", "log"]) $(`tab-${t}`).setAttribute("aria-selected", String(drawer.tab === t));
    if (drawer.open && drawer.tab === "log") seenLog = logLines.length;
    renderIndicators();
    if (!drawer.open) return;
    const ctx = { send, logLines, tasks, surface: "drawer", refresh: () => renderDrawer() };
    const w = drawer.tab === "tasks"
      ? { id: "activity-tasks", type: "task-list", show_app: true }
      : { id: "activity-log", type: "log", limit: 1000 };
    preserve($("drawer-body"), () => $("drawer-body").replaceChildren(W.render(w, ctx)));
  }

  function openDrawer(tab) {
    drawer = { open: true, tab: tab || drawer.tab };
    store.set("drawerOpen", true); store.set("drawerTab", drawer.tab);
    renderDrawer();
  }
  function closeDrawer() {
    drawer.open = false; store.set("drawerOpen", false);
    renderDrawer();
  }

  $("activity-btn").addEventListener("click", () => (drawer.open ? closeDrawer() : openDrawer()));
  $("drawer-close").addEventListener("click", closeDrawer);
  for (const t of ["tasks", "log"]) $(`tab-${t}`).addEventListener("click", () => openDrawer(t));
  $("ind-tasks").addEventListener("click", () => openDrawer("tasks"));
  $("tray").addEventListener("click", () => openDrawer("log"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.open && !wide()) closeDrawer(); });

  // ---- navigation + live data ----

  function go(page, notify) {
    if (!state) return;
    state.nav.current = page;
    history.replaceState(null, "", `#${page}`);
    renderChrome();
    renderPage();
    if (notify) send("nav", page, {});
  }

  window.addEventListener("hashchange", () => {
    const page = location.hash.slice(1);
    if (state && page && state.nav?.pages?.includes(page) && page !== state.nav.current) go(page, true);
  });

  const pageHas = (type) => (state?.pages?.[state?.nav?.current]?.widgets || []).some((w) => w.type === type);

  function connect() {
    const es = new EventSource("/events");
    const conn = $("conn");
    es.onopen = () => { conn.textContent = "live"; conn.dataset.state = "open"; };
    es.onerror = () => { conn.textContent = "reconnecting…"; conn.dataset.state = "closed"; };
    es.addEventListener("state", (e) => {
      const next = JSON.parse(e.data);
      const hash = location.hash.slice(1);
      if (!state && hash && next.nav?.pages?.includes(hash)) next.nav.current = hash;
      state = next;
      renderAll();
    });
    es.addEventListener("log", (e) => {
      logLines = logLines.concat(JSON.parse(e.data)).slice(-5000);
      if (pageHas("log")) renderPage();
      if (drawer.open && drawer.tab === "log") renderDrawer(); else renderIndicators();
    });
    es.addEventListener("tasks", (e) => {
      tasks = JSON.parse(e.data);
      if (pageHas("task-list")) renderPage();
      if (drawer.open && drawer.tab === "tasks") renderDrawer(); else renderIndicators();
    });
    es.addEventListener("inbox", (e) => { pending = JSON.parse(e.data).pending || 0; renderIndicators(); });
    es.addEventListener("apps", (e) => { apps = JSON.parse(e.data); if (pageHas("app-list")) renderPage(); });
  }

  async function boot() {
    try {
      const r = await fetch("/api/log?since=0");
      logLines = await r.json();
      seenLog = logLines.length;
    } catch { /* server will stream what it has */ }
    connect();
    renderIndicators();
  }

  boot();
})();
