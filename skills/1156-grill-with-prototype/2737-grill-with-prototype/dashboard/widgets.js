// Built-in widget renderers. Each takes (widget, ctx) and returns an Element.
// ctx: { send(type, name, payload), page, logLines, tasks }
// Custom widgets: window.VibeWidgets.register('my-type', fn) from widgets/<type>.js.

(function () {
  const registry = {};

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid === undefined || kid === null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Small markdown subset: headings, paragraphs, lists, fenced code, inline code/bold/italic/links.
  function markdown(src) {
    const lines = String(src || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let i = 0;
    const inline = (t) =>
      esc(t)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
        .replace(/(^|[\s(>])_([^_\n]+)_(?=$|[\s.,;:!?)<])/g, "$1<em>$2</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) {
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
        continue;
      }
      const hm = /^(#{1,3})\s+(.*)$/.exec(l);
      if (hm) { out.push(`<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`); i++; continue; }
      if (/^\s*[-*]\s+/.test(l)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
        out.push(`<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`);
        continue;
      }
      if (/^\s*\d+[.)]\s+/.test(l)) {
        const items = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
        out.push(`<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`);
        continue;
      }
      if (!l.trim()) { i++; continue; }
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) para.push(lines[i++]);
      out.push(`<p>${inline(para.join(" "))}</p>`);
    }
    return out.join("");
  }

  const title = (w) => (w.title ? h("h3", { class: "widget-title" }, w.title) : null);
  const toneClass = (t) => (t && t !== "neutral" ? `tone-${t}` : "");

  registry.markdown = (w) => {
    const el = h("div", { class: "md" });
    el.innerHTML = markdown(w.text);
    return h("div", {}, title(w), el);
  };

  registry.status = (w) =>
    h("div", { class: "status-line" },
      w.label ? h("span", { class: "label" }, w.label) : null,
      h("span", { class: `value ${toneClass(w.tone)}` }, w.value ?? ""));

  registry.progress = (w) => {
    const max = Number(w.max) || 1, val = Math.min(Number(w.value) || 0, max);
    const pct = Math.round((val / max) * 100);
    return h("div", {},
      h("div", { class: "progress-head" }, h("span", {}, w.label || ""), h("span", { class: "progress-count" }, `${val} / ${max}`)),
      h("div", { class: "progress-bar", role: "progressbar", "aria-valuenow": val, "aria-valuemax": max },
        h("div", { class: "progress-fill", style: `width:${pct}%` })),
      w.note ? h("div", { class: "progress-note" }, w.note) : null);
  };

  registry.list = (w) => {
    const items = Array.isArray(w.items) ? w.items : [];
    if (!items.length) return h("div", {}, title(w), h("p", { class: "empty" }, w.empty || "Nothing here yet."));
    return h("div", {}, title(w),
      h(w.ordered ? "ol" : "ul", { class: "list" },
        items.map((it) => typeof it === "string"
          ? h("li", {}, it)
          : h("li", { class: toneClass(it.tone) }, it.text, it.meta ? h("span", { class: "meta" }, it.meta) : null))));
  };

  registry.table = (w) =>
    h("div", {}, title(w),
      h("table", { class: "table" },
        w.columns ? h("thead", {}, h("tr", {}, w.columns.map((c) => h("th", {}, c)))) : null,
        h("tbody", {}, (w.rows || []).map((r) => h("tr", {}, r.map((c) => h("td", {}, c ?? "")))))));

  registry.kv = (w) => {
    const items = Array.isArray(w.items) ? w.items : Object.entries(w.items || {}).map(([k, v]) => ({ k, v }));
    return h("div", {}, title(w), h("dl", { class: "kv" }, items.map((it) => [h("dt", {}, it.k), h("dd", {}, it.v ?? "")])));
  };

  registry.buttons = (w, ctx) =>
    h("div", { class: "buttons" },
      (w.buttons || []).map((b) => {
        const btn = h("button", {
          class: `btn ${b.tone === "primary" ? "btn-primary" : b.tone === "danger" ? "btn-danger" : ""}`,
          type: "button",
          onclick: async () => {
            if (b.confirm && !window.confirm(b.confirm)) return;
            btn.disabled = true;
            const ok = await ctx.send("action", b.name, b.payload || {});
            btn.disabled = false;
            if (ok) { btn.classList.add("sent"); setTimeout(() => btn.classList.remove("sent"), 1200); }
          },
        }, b.label || b.name);
        return btn;
      }));

  registry.form = (w, ctx) => {
    const fields = w.fields || [];
    const inputs = {};
    const form = h("form", { class: "form", onsubmit: async (e) => {
      e.preventDefault();
      const payload = {};
      for (const f of fields) {
        const el = inputs[f.name];
        payload[f.name] = f.type === "checkbox" ? el.checked : f.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
      }
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      const ok = await ctx.send("form", w.submit || w.id, payload);
      submit.disabled = false;
      if (ok) {
        for (const f of fields) delete inputs[f.name].dataset.dirty;
        note.textContent = "Sent to the agent.";
        if (w.clear_on_submit !== false) for (const f of fields) if (f.type === "password" || f.type === "textarea") inputs[f.name].value = "";
        setTimeout(() => (note.textContent = ""), 2500);
      }
    } });
    const note = h("span", { class: "form-note" });
    for (const f of fields) {
      const id = `${w.id}-${f.name}`;
      let input;
      if (f.type === "textarea") input = h("textarea", { id, placeholder: f.placeholder, required: f.required });
      else if (f.type === "select") input = h("select", { id }, (f.options || []).map((o) => typeof o === "string" ? h("option", { value: o }, o) : h("option", { value: o.value }, o.label ?? o.value)));
      else if (f.type === "checkbox") input = h("input", { id, type: "checkbox" });
      else input = h("input", { id, type: f.type || "text", placeholder: f.placeholder, required: f.required, autocomplete: f.type === "password" ? "off" : undefined });
      if (f.value !== undefined) { if (f.type === "checkbox") input.checked = !!f.value; else input.value = f.value; }
      input.addEventListener(f.type === "checkbox" || f.type === "select" ? "change" : "input", () => (input.dataset.dirty = "1"));
      inputs[f.name] = input;
      form.append(f.type === "checkbox"
        ? h("div", { class: "field field-check" }, input, h("label", { for: id }, f.label || f.name))
        : h("div", { class: "field" }, h("label", { for: id }, f.label || f.name), input));
    }
    form.append(h("div", { class: "form-actions" }, h("button", { class: "btn btn-primary", type: "submit" }, w.submit_label || "Send"), note));
    return h("div", {}, title(w), form);
  };

  // Per-widget view state (filters, open details) that survives re-renders.
  const ui = {};
  const view = (key, defaults) => (ui[key] = ui[key] || { ...defaults });

  function chips(label, options, current, onPick) {
    return h("div", { class: "chips", role: "group", "aria-label": label },
      options.map((o) => h("button", {
        type: "button", class: "chip", "aria-pressed": String(o.value === current),
        onclick: () => onPick(o.value),
      }, o.label, o.count != null ? h("span", { class: "chip-count" }, o.count) : null)));
  }

  const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };

  registry.log = (w, ctx) => {
    const surface = ctx.surface || "page";
    const v = view(`${w.id}:${surface}`, { level: "all", app: "all", q: "" });
    const refresh = () => ctx.refresh && ctx.refresh();
    let all = ctx.logLines;
    if (w.app) all = all.filter((l) => l.app === w.app);
    if (w.sources && w.sources.length) all = all.filter((l) => w.sources.includes(l.source));
    const apps = [...new Set(all.map((l) => l.app).filter(Boolean))];
    const multiApp = apps.length > 1;
    const min = { all: 0, info: 1, warn: 2, error: 3 }[v.level];
    const q = v.q.trim().toLowerCase();
    const count = (m) => all.filter((l) => (LEVEL_RANK[l.level || "info"] ?? 1) >= m).length;
    let lines = all.filter((l) =>
      (LEVEL_RANK[l.level || "info"] ?? 1) >= min &&
      (v.app === "all" || l.app === v.app) &&
      (!q || `${l.message || ""} ${l.source || ""} ${l.app || ""}`.toLowerCase().includes(q)));
    lines = lines.slice(-(w.limit || 500));

    const controls = w.filters === false ? null : h("div", { class: "filters" },
      chips("Level", [
        { value: "all", label: "All", count: count(0) },
        { value: "warn", label: "Warnings", count: count(2) },
        { value: "error", label: "Errors", count: count(3) },
      ], v.level, (x) => { v.level = x; refresh(); }),
      multiApp ? chips("App", [{ value: "all", label: "All apps" }, ...apps.map((a) => ({ value: a, label: a }))], v.app, (x) => { v.app = x; refresh(); }) : null,
      h("input", {
        class: "filter-search", id: `${w.id}-${surface}-q`, type: "search", placeholder: "Filter lines", "aria-label": "Filter log lines",
        value: v.q, oninput: (e) => { v.q = e.target.value; refresh(); },
      }));

    const filtered = v.level !== "all" || v.app !== "all" || q;
    const box = h("div", { class: "log", id: `${w.id}-${surface}-box`, dataset: { stickBottom: "1" } },
      lines.length ? lines.map((l) =>
        h("div", { class: "log-line", dataset: { level: l.level || "info" } },
          h("span", { class: "log-ts" }, (l.ts || "").slice(11, 19)),
          h("span", { class: "log-src", title: [l.app, l.source].filter(Boolean).join(" · ") },
            multiApp && l.app ? h("span", { class: "log-app" }, l.app) : null, l.source || ""),
          h("span", { class: "log-msg" }, l.message || "")))
      : filtered
        ? h("p", { class: "empty" }, "No lines match these filters. ",
            h("button", { type: "button", class: "link-btn", onclick: () => { v.level = "all"; v.app = "all"; v.q = ""; refresh(); } }, "Clear filters"))
        : h("p", { class: "empty" }, "No activity yet."));
    return h("div", {}, title(w), controls, box);
  };

  function duration(t) {
    const start = t.started ? Date.parse(t.started) : null;
    if (!start) return t.status === "queued" ? "queued" : "";
    const end = t.finished ? Date.parse(t.finished) : Date.now();
    const s = Math.max(0, Math.round((end - start) / 1000));
    return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  }

  const STATUS_ORDER = { running: 0, queued: 1, failed: 2, done: 3 };

  registry["task-list"] = (w, ctx) => {
    const surface = ctx.surface || "page";
    const v = view(`${w.id}:${surface}`, { status: "all", app: "all", open: {} });
    const refresh = () => ctx.refresh && ctx.refresh();
    let all = ctx.tasks || [];
    if (w.app) all = all.filter((t) => t.app === w.app);
    const apps = [...new Set(all.map((t) => t.app).filter(Boolean))];
    const multiApp = apps.length > 1;
    const n = (s) => all.filter((t) => t.status === s).length;
    const matches = (t) => v.status === "all" || t.status === v.status || (v.status === "running" && t.status === "queued");
    let tasks = all.filter((t) => matches(t) && (v.app === "all" || t.app === v.app));
    tasks = tasks.slice().sort((a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      String(b.finished || b.started || "").localeCompare(String(a.finished || a.started || "")));
    if (w.limit) tasks = tasks.slice(0, w.limit);

    const controls = w.filters === false || !all.length ? null : h("div", { class: "filters" },
      chips("Status", [
        { value: "all", label: "All", count: all.length },
        { value: "running", label: "Active", count: n("running") + n("queued") },
        { value: "failed", label: "Failed", count: n("failed") },
        { value: "done", label: "Done", count: n("done") },
      ], v.status, (x) => { v.status = x; refresh(); }),
      multiApp ? chips("App", [{ value: "all", label: "All apps" }, ...apps.map((a) => ({ value: a, label: a }))], v.app, (x) => { v.app = x; refresh(); }) : null);

    const list = tasks.length ? h("div", { class: "tasks" }, tasks.map((t) => {
      const who = t.role ? `${t.role} → ${t.provider || "?"}` : t.provider === "shell" ? "shell" : t.provider || "";
      const meta = [multiApp || w.show_app ? t.app : null, who].filter(Boolean).join(" · ");
      const detail = t.error || t.output;
      return h("div", { class: "task", dataset: { status: t.status } },
        h("span", { class: "status-pill", dataset: { status: t.status } }, t.status),
        h("div", { class: "task-main" },
          h("span", { class: "task-title" }, t.title || t.role || t.cmd || t.id),
          meta ? h("span", { class: "task-meta" }, meta) : null),
        h("span", { class: "task-time", dataset: t.status === "running" && t.started ? { started: t.started } : {} }, duration(t)),
        detail ? h("details", {
          class: "task-detail", open: !!v.open[t.id],
          ontoggle: (e) => { v.open[t.id] = e.target.open; },
        }, h("summary", {}, t.error ? "Error" : "Output"),
          h("pre", { class: t.error ? "tone-error" : "" }, String(detail).slice(0, 8000))) : null);
    })) : h("p", { class: "empty" }, all.length ? "No tasks match this filter." : (w.empty || "No background tasks."));
    return h("div", {}, title(w), controls, list);
  };

  function ago(ts) {
    if (!ts) return "";
    const s = Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 1000));
    return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
  }

  // app-list: skill-apps with status and per-app controls. Without `apps`, it shows the
  // live list streamed by an aggregating server (ctx.apps).
  registry["app-list"] = (w, ctx) => {
    const apps = w.apps || ctx.apps || [];
    const defaults = (a) => a.status === "running"
      ? [{ name: "stop_app", label: "Stop" }, { name: "rebuild_app", label: "Rebuild" }]
      : [{ name: "boot_app", label: "Boot", tone: "primary" }, { name: "rebuild_app", label: "Rebuild" }];
    return h("div", {}, title(w),
      apps.length ? h("div", { class: "apps" }, apps.map((a) => {
        const actions = a.actions || w.actions || defaults(a);
        const notes = [
          a.tasks_running ? `${a.tasks_running} task${a.tasks_running > 1 ? "s" : ""} running` : null,
          a.tasks_failed ? `${a.tasks_failed} failed` : null,
          a.pending_events ? `${a.pending_events} waiting` : null,
          a.last_activity ? `active ${ago(a.last_activity)}` : null,
        ].filter(Boolean);
        return h("div", { class: "app-row", dataset: { status: a.status } },
          h("div", { class: "app-main" },
            h("span", { class: "app-title" }, a.name, a.version ? h("span", { class: "app-ver" }, ` ${a.version}`) : null),
            h("span", { class: "app-desc" }, a.message || a.description || ""),
            notes.length ? h("span", { class: "app-notes" }, notes.join(" · ")) : null),
          h("div", { class: "app-meta" },
            h("span", { class: "status-pill", dataset: { status: a.status === "running" ? "done" : a.status === "failed" ? "failed" : "idle" } }, a.status),
            a.port ? h("span", { class: "app-port" }, `:${a.port}`) : null),
          h("div", { class: "app-actions" },
            a.url && a.status === "running" ? h("a", { class: "btn btn-sm btn-primary", href: a.url, target: "_blank", rel: "noopener" }, "Open") : null,
            actions.map((b) => {
              const btn = h("button", { class: `btn btn-sm ${b.tone === "primary" ? "btn-primary" : ""}`, type: "button", onclick: async () => {
                btn.disabled = true; await ctx.send("action", b.name, { app: a.id || a.name, path: a.path, ...(b.payload || {}) }); btn.disabled = false;
              } }, b.label);
              return btn;
            })));
      })) : h("p", { class: "empty" }, w.empty || "No skill-apps found. Check the aggregate globs in manifest.json."));
  };

  // steps: a stage stepper. items: [{label, caption?, state: done|current|todo|failed}]
  registry.steps = (w) =>
    h("div", {}, title(w), h("ol", { class: "steps" }, (w.items || []).map((s, i) =>
      h("li", { class: "step", dataset: { state: s.state || "todo" } },
        h("span", { class: "step-mark", "aria-hidden": "true" }, s.state === "done" ? "✓" : s.state === "failed" ? "✕" : String(i + 1)),
        h("span", { class: "step-body" },
          h("span", { class: "step-label" }, s.label),
          s.caption ? h("span", { class: "step-caption" }, s.caption) : null)))));

  // checks: a checklist. items: [{label, state: pass|fail|pending|skip, detail?}]
  registry.checks = (w) =>
    h("div", {}, title(w),
      h("ul", { class: "checks" }, (w.items || []).map((c) =>
        h("li", { class: "check", dataset: { state: c.state || "pending" } },
          h("span", { class: "check-mark", "aria-hidden": "true" }, { pass: "✓", fail: "✕", pending: "…", skip: "–" }[c.state] || "·"),
          h("span", {}, c.label, c.detail ? h("span", { class: "check-detail" }, ` ${c.detail}`) : null)))));

  // iframe: a served page inside the dashboard, e.g. a rendered prototype under
  // /workspace/… . The <iframe> element is kept across state re-renders so a state push
  // does not reload it; it reloads only when `version` (or `src`) changes. Messages the
  // page posts to its parent as {type: "proto_click", …} are forwarded to the agent as an
  // `action` event named proto_click. `device: "phone"` narrows the frame to 390px.
  const frames = {};
  registry.iframe = (w, ctx) => {
    const key = w.id;
    const v = view(`${key}:frame`, { device: w.device || "desktop", version: null });
    let f = frames[key];
    const src = w.src || "about:blank";
    if (!f) {
      f = frames[key] = h("iframe", { class: "frame", title: w.title || w.id, src, sandbox: "allow-scripts allow-same-origin allow-forms" });
      v.version = w.version ?? null;
      window.addEventListener("message", (e) => {
        if (e.source !== f.contentWindow || !e.data || e.data.type !== "proto_click") return;
        ctx.send("action", "proto_click", { widget: w.id, ...e.data, type: undefined });
      });
    } else if (f.getAttribute("src") !== src || (w.version ?? null) !== v.version) {
      v.version = w.version ?? null;
      f.setAttribute("src", src.includes("?") ? `${src}&v=${w.version ?? ""}` : `${src}?v=${w.version ?? ""}`);
    }
    const bar = w.toolbar === false ? null : h("div", { class: "frame-bar" },
      chips("Device", [{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }], v.device,
        (x) => { v.device = x; ctx.refresh && ctx.refresh(); }),
      h("span", { class: "frame-src" }, w.caption || src.replace(/^\/workspace\//, "")),
      h("a", { class: "btn btn-sm", href: src, target: "_blank", rel: "noopener" }, "Open"));
    const wrap = h("div", { class: "frame-wrap", dataset: { device: v.device }, style: w.height ? `height:${w.height}` : undefined });
    wrap.append(f);
    return h("div", {}, title(w), bar, wrap);
  };

  // Live elapsed time for running tasks without re-rendering.
  setInterval(() => {
    document.querySelectorAll(".task-time[data-started]").forEach((el) => {
      el.textContent = duration({ status: "running", started: el.dataset.started });
    });
  }, 1000);

  function render(w, ctx) {
    const fn = registry[w.type];
    const wrap = h("div", { class: `widget widget-${w.type}`, id: `w-${w.id}` });
    try {
      wrap.append(fn ? fn(w, ctx) : h("div", {}, h("h3", { class: "widget-title" }, `${w.type} (no renderer)`), h("pre", { class: "unknown" }, JSON.stringify(w, null, 2))));
    } catch (err) {
      wrap.append(h("pre", { class: "unknown" }, `widget ${w.id} failed: ${err.message}`));
    }
    return wrap;
  }

  window.VibeWidgets = { register: (type, fn) => (registry[type] = fn), render, h, markdown, duration };
})();
