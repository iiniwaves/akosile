import { renderSidebar, bindSidebar, setActiveNav, setCount } from "./shell.js";
import { renderInbox } from "./views/inbox.js";
import { renderUpload } from "./views/upload.js";
import { renderNewRecord } from "./views/new-record.js";
import { renderReview } from "./views/review.js";
import { renderProblem, problemQueue } from "./views/problem.js";
import { renderYear, renderMonth, renderReport, openSubmitDialog, sourceOf, leftOutReason } from "./views/reports.js";
import { CURRENT_MONTH, PEOPLE } from "./reports.js";
import { sampleBatch, secondBatch, seedRules, workspace, me } from "./data.js";
import { documents, rereads, nextUber, FIELD_LABEL } from "./receipts.js";
import { toast } from "./ui.js";
import { renderRules } from "./views/rules.js";
import { renderSettings } from "./views/settings.js";
import { openSearch, closeSearch, searchOpen } from "./views/search.js";
import { openAssistant, closeAssistant, assistantOpen } from "./views/assistant.js";
import { escapeHtml } from "./format.js";

// In-memory demo state. A reload starts the demo again.
const state = {
  workspaceName: workspace.name,
  receipts: [],
  docs: {},
  selected: new Set(),
  reading: new Set(),
  rules: seedRules.map((x) => ({ ...x, text: ruleText(x) })),
  batchNo: 0,
  queue: null,
  reviewUi: {},
  draft: null,
  timers: [],
  me,
  myReports: [], // reports submitted in this demo
  submitted: [], // receipts that left the inbox in a report
  lastReport: null,
};

function ruleText(rule) {
  return `From a ${workspace.name} rule ${rule.by} added on ${rule.on}: ${rule.vendor} is always ${rule.value}.`;
}

const app = document.getElementById("app");
app.innerHTML = `${renderSidebar({ inbox: "", rules: 0 })}<main class="main" id="main" tabindex="-1"></main>`;
bindSidebar(app);

// Search and the record keeper open from the sidebar or the keyboard, on any screen.
const ask = (question) => { closeSearch(); openAssistant(state, question); };
const search = (query = "") => openSearch(state, { query, onAsk: ask });
app.addEventListener("click", (e) => {
  const a = e.target.closest('.sidebar [data-action="search"], .sidebar [data-action="ask"]');
  if (!a) return;
  if (a.dataset.action === "search") search();
  else if (assistantOpen()) closeAssistant();
  else ask();
});
document.addEventListener("keydown", (e) => {
  const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (assistantOpen()) closeAssistant(); else ask(); }
  else if (e.key === "/" && !typing && !searchOpen()) { e.preventDefault(); search(); }
});
const main = document.getElementById("main");

const currentPath = () => location.hash.replace(/^#\//, "") || "inbox";
const refreshInbox = () => { if (currentPath() === "inbox") renderInbox(main, state); };

// Starts (or restarts) the scripted batch. Rows fill in one by one; one slow or failed file never blocks the rest.
function startReading() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  const manual = state.receipts.filter((r) => r.manual);
  state.receipts = [...structuredClone(sampleBatch).map((r) => ({ ...r, batch: 1 })), ...manual];
  state.batchNo = 1;
  state.docs = structuredClone(documents);
  ["uber-20", ...secondBatch.map((r) => r.id)].forEach((id) => delete state.docs[id]);
  state.selected = new Set();
  state.reading = new Set(sampleBatch.map((r) => r.id));
  state.reviewUi = {};
  state.queue = null;

  sampleBatch.forEach((r) => {
    state.timers.push(setTimeout(() => {
      state.reading.delete(r.id);
      if (![...state.reading].some((id) => sampleBatch.find((b) => b.id === id))) {
        // Ready receipts start selected so approving them is one click. Nothing is approved until a person does it.
        state.receipts.filter((x) => x.status === "ready" && x.batch === 1).forEach((x) => state.selected.add(x.id));
      }
      refreshInbox();
    }, r.readMs));
  });
  location.hash = "#/inbox";
}

// The second upload. Each file goes wrong in its own way, and none of them hold up the rest.
function addSecondBatch() {
  if (state.batchNo >= 2) {
    location.hash = "#/inbox";
    toast("Both sample batches are in. Reload the page to start the demo again.", { duration: 4000 });
    return;
  }
  state.batchNo = 2;
  state.lastReport = null;
  state.selected = new Set();
  state.queue = null;
  for (const b of secondBatch) {
    state.receipts.push({ ...structuredClone(b), batch: 2 });
    state.docs[b.id] = structuredClone(documents[b.id]);
    state.reading.add(b.id);
    const done = () => {
      state.reading.delete(b.id);
      const r = state.receipts.find((x) => x.id === b.id);
      if (r && b.slowMs) r.slow = true;
      refreshInbox();
    };
    state.timers.push(setTimeout(done, b.slowMs || b.readMs));
  }
  if (currentPath() === "inbox") refreshInbox();
  else location.hash = "#/inbox";
}

// Try again on a slow file: it goes back to reading, then comes in like any other receipt.
function retry(id) {
  const r = state.receipts.find((x) => x.id === id);
  if (!r) return;
  r.slow = false;
  r.retried = true;
  state.reading.add(id);
  refreshInbox();
  state.timers.push(setTimeout(() => {
    Object.assign(r, rereads[id].row);
    state.reading.delete(id);
    sync(r);
    refreshInbox();
  }, secondBatch.find((b) => b.id === id)?.retryMs || 1800));
}

// A new photo for a receipt that couldn't be read, or was cut off.
function reread(id) {
  const r = state.receipts.find((x) => x.id === id);
  if (!r) return;
  const fix = rereads[id];
  r.fileLabel = r.vendor;
  state.reading.add(id);
  state.selected.delete(id);
  location.hash = "#/inbox";
  refreshInbox();
  toast(`Reading the new photo of ${r.vendor}.`, { duration: 3000 });
  state.timers.push(setTimeout(() => {
    const doc = state.docs[id];
    if (fix.doc) {
      state.docs[id] = structuredClone(fix.doc);
      const cat = state.docs[id].fields.category;
      const rule = state.rules.find((x) => x.vendor === fix.row.vendor);
      if (cat?.state === "rule") { if (rule) cat.ruleText = rule.text; else cat.state = "guessed"; }
    } else {
      for (const [key, f] of Object.entries(fix.fields)) doc.fields[key] = { ...f };
      for (const [key, left] of Object.entries(fix.sources)) { const l = doc.lines.find((x) => x.left === left); if (l) l.src = key; }
      doc.cropped = false;
    }
    Object.assign(r, fix.row, { problem: null, checkLabel: undefined, fileLabel: undefined });
    if (r.status === "failed") r.status = "ready";
    state.reading.delete(id);
    sync(r);
    refreshInbox();
  }, 1600));
}

// Keeps the inbox row in step with the fields on its receipt.
function sync(r) {
  const doc = state.docs[r.id];
  if (!doc) return;
  const f = doc.fields;
  if (!f.vendor) return;
  r.vendor = f.vendor.value;
  r.date = f.date.value;
  r.total = f.total.value;
  r.category = f.category?.value ?? r.category;
  if (r.status === "approved" || r.problem) return;
  const flagged = Object.keys(f).filter((k) => f[k].state === "check" || f[k].state === "missing");
  r.flagged = flagged;
  r.status = flagged.length ? "check" : "ready";
  r.checkLabel = flagged.length ? `Check ${FIELD_LABEL[flagged[0]].toLowerCase()}` : undefined;
  if (r.status !== "ready") state.selected.delete(r.id);
}

const upload = () => (state.batchNo ? addSecondBatch() : startReading());

// Only a person submits. Approved receipts leave the inbox and go into the report; the rest stay put.
function submitReport() {
  const approved = state.receipts.filter((r) => r.status === "approved");
  if (!approved.length) return;
  const left = state.receipts.filter((r) => r.status !== "approved");
  const mine = state.myReports.length;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const id = `2026-11-ab${mine ? `-${mine + 1}` : ""}`;
  const items = approved.map((r) => ({
    id: `${id}-${r.id}`, receiptId: r.id, vendor: r.vendor, place: r.place, category: r.category,
    total: r.total || 0, day: Number(String(r.date || "14").split(" ")[0]), source: sourceOf(r, state.docs[r.id]),
  }));
  const used = new Map();
  for (const r of approved) {
    if (state.docs[r.id]?.fields?.category?.state !== "rule") continue;
    const rule = state.rules.find((x) => x.vendor === r.vendor && x.field === "category");
    if (rule) used.set(rule, (used.get(rule) || 0) + 1);
  }
  const fullName = (first) => Object.values(PEOPLE).find((p) => p.name.startsWith(first))?.name || first;
  const report = {
    id, month: CURRENT_MONTH, person: "AB", title: mine ? `Lekki office, part ${mine + 1}` : "Lekki office", status: "submitted",
    count: items.length, total: items.reduce((t, i) => t + i.total, 0), when: "14 Nov", at: `14 Nov 2026 at ${time}`,
    items, leftOut: left.map((r) => ({ name: r.fileLabel || r.vendor, why: leftOutReason(r)[1] })),
    rules: [...used].map(([rule, n]) => ({ vendor: rule.vendor, value: rule.value, byName: fullName(rule.by), on: rule.on, used: n })),
  };
  state.myReports.push(report);
  for (const r of approved) r.report = id;
  state.submitted.push(...approved);
  state.receipts = left;
  state.selected = new Set();
  state.queue = null;
  state.lastReport = report;
  updateInboxCount();
  location.hash = `#/reports/2026-11/${id}`;
  toast(`${report.title} submitted.`, { duration: 3000 });
}

// Renaming the workspace shows everywhere its name is used.
function onRename(name) {
  state.workspaceName = name;
  document.querySelectorAll(".ws__name").forEach((el) => (el.textContent = name));
  document.querySelector(".ws")?.setAttribute("aria-label", `Workspace: ${name}`);
  route();
}

function updateInboxCount() {
  setCount("inbox", state.receipts.filter((r) => r.status !== "approved").length || "");
}

state.actions = { retry, reread, upload, submit: () => openSubmitDialog(state, submitReport) };

// Leaves a problem receipt for the next one that needs a person, or the inbox when there are none left.
function nextProblem(id) {
  const ids = problemQueue(state);
  const next = ids[ids.indexOf(id) + 1] || ids.find((x) => x !== id);
  return next ? `#/review/${next}` : "#/inbox";
}

// Every way out of a problem screen can be undone from the toast.
function resolve(r, message, apply) {
  const before = { r: structuredClone(r), doc: structuredClone(state.docs[r.id]), index: state.receipts.indexOf(r) };
  const go = nextProblem(r.id);
  apply();
  if (r.removed) state.receipts = state.receipts.filter((x) => x !== r);
  else sync(r);
  location.hash = go;
  toast(message, {
    undo: () => {
      state.receipts = state.receipts.filter((x) => x.id !== r.id);
      state.receipts.splice(before.index, 0, before.r);
      state.docs[r.id] = before.doc;
      route();
    },
  });
}

const hooks = {
  sync,
  retry,
  reread,
  rules: () => state.rules,
  // Typed in by a person: every value is theirs, and the row says so.
  saveEntered(r, v, approve) {
    resolve(r, `Saved ${v.vendor || r.vendor}${approve ? " and approved it" : ""}.`, () => {
      const doc = state.docs[r.id];
      doc.fields = {
        vendor: { value: v.vendor || r.vendor, state: "entered" },
        date: { value: v.date, state: "entered" },
        total: { value: v.total, state: "entered" },
        ...(v.tax ? { tax: { value: v.tax, state: "entered" } } : {}),
        ...(v.category ? { category: { value: v.category, state: v.rule ? "rule" : "entered", ruleText: v.rule?.text } } : {}),
      };
      Object.assign(r, { problem: null, checkLabel: undefined, entered: true, place: "Entered by hand", category: v.category || null, status: approve ? "approved" : "ready" });
    });
  },
  savePartial(r, v) {
    resolve(r, `Saved ${r.vendor}.`, () => {
      const doc = state.docs[r.id];
      for (const [key, value] of Object.entries(v.edits || {})) doc.fields[key] = { value, state: "edited", typed: true, note: `Was ${doc.fields[key].value}. You typed the new value.` };
      if (v.rule) doc.fields.category = { value: v.rule.value, state: "rule", ruleText: v.rule.text };
      doc.fields.total = { value: v.total, state: "entered" };
      if (v.tax) doc.fields.tax = { value: v.tax, state: "entered" };
      else delete doc.fields.tax;
      Object.assign(r, { problem: null, checkLabel: undefined, status: "ready" });
    });
  },
  remove(r) {
    resolve(r, `Removed ${r.vendor === "Shell" && r.problem === "duplicate" ? "the copy of Shell" : r.vendor}.`, () => { r.removed = true; state.selected.delete(r.id); });
  },
  keepBoth(r) {
    resolve(r, `Kept both ${r.vendor} receipts.`, () => Object.assign(r, { problem: null, checkLabel: undefined, status: "ready" }));
  },
  approve(r, queue) {
    r.status = "approved";
    state.selected.delete(r.id);
    const next = queue.ids.find((id) => id !== r.id && state.receipts.find((x) => x.id === id)?.status !== "approved" && state.receipts.find((x) => x.id === id)?.status !== "failed");
    location.hash = next && queue.mode === "review" ? `#/review/${next}` : "#/inbox";
    toast(`Approved ${r.vendor}.`, { undo: () => { r.status = "ready"; sync(r); route(); } });
  },
  unapprove(r) {
    r.status = "ready";
    sync(r);
    route();
    toast(`${r.vendor} is back to ready.`, { duration: 3000 });
  },
  // Learning is never silent: the rule is saved to the workspace, listed in Learned rules, and shown on every receipt it touches.
  learnRule(r, category, vendor = r.vendor) {
    const rule = { vendor, field: "category", value: category, by: me.name.split(" ")[0], on: "13 Nov" };
    state.rules = state.rules.filter((x) => !(x.vendor === rule.vendor && x.field === rule.field));
    state.rules.push(rule);
    setCount("rules", state.rules.length);
    rule.text = ruleText(rule);

    // The next receipt from the same vendor arrives with the rule already applied.
    if (vendor === nextUber.vendor && !state.receipts.some((x) => x.id === nextUber.id)) {
      state.timers.push(setTimeout(() => {
        state.receipts.push({ ...structuredClone(nextUber), lateArrival: true });
        state.docs[nextUber.id] = structuredClone(documents[nextUber.id]);
        state.reading.add(nextUber.id);
        refreshInbox();
        state.timers.push(setTimeout(() => {
          const live = state.rules.find((x) => x.vendor === nextUber.vendor);
          const doc = state.docs[nextUber.id];
          const rec = state.receipts.find((x) => x.id === nextUber.id);
          if (live) doc.fields.category = { value: live.value, state: "rule", guess: doc.fields.category.value, ruleText: live.text };
          state.reading.delete(nextUber.id);
          sync(rec);
          refreshInbox();
        }, nextUber.readMs));
      }, 2500));
    }
    return rule;
  },
};

const routes = [
  [/^inbox$/, () => (state.receipts.length || state.lastReport ? renderInbox(main, state) : renderUpload(main, { onFiles: upload }))],
  [/^reports$/, () => renderYear(main, state)],
  [/^rules$/, () => renderRules(main, state, { onSee: (vendor) => search(vendor) })],
  [/^settings$/, () => renderSettings(main, state, { onRename })],
  [/^reports\/2026-(\d\d)$/, (m) => renderMonth(main, state, Number(m[1]) - 1)],
  [/^reports\/2026-(\d\d)\/([\w-]+)$/, (m) => renderReport(main, state, Number(m[1]) - 1, m[2])],
  [/^inbox\/upload$/, () => renderUpload(main, { onFiles: upload })],
  [/^inbox\/new$/, () => renderNewRecord(main, state, {
    learnRule: (category, vendor) => hooks.learnRule(null, category, vendor),
    onSave: (record) => {
      state.receipts.push(record);
      location.hash = "#/inbox";
      toast(`Added ${record.vendor}${record.status === "approved" ? " and approved it" : ""}.`, {
        undo: () => { state.receipts = state.receipts.filter((r) => r.id !== record.id); route(); },
      });
    },
  })],
  [/^review\/([\w-]+)$/, (m) => (state.receipts.find((r) => r.id === m[1])?.problem ? renderProblem(main, state, m[1], hooks) : renderReview(main, state, m[1], hooks))],
  [/^review\/([\w-]+)\/enter$/, (m) => renderProblem(main, state, m[1], hooks, "enter")],
];

function placeholder(name) {
  main.innerHTML = `
    <header class="page-head"><div class="page-head__title"><span class="t-overline muted">${escapeHtml(workspace.name)}</span><h1 class="t-heading-lg">${escapeHtml(name)}</h1></div></header>
    <section class="card empty-note">This screen arrives in a later stage of the demo.</section>`;
}

function route() {
  const path = currentPath();
  const inReport = path.startsWith("review") && state.submitted.some((r) => `review/${r.id}` === path);
  setActiveNav(inReport ? "reports" : path.startsWith("review") ? "inbox" : path.split("/")[0]);
  updateInboxCount();
  main.onclick = main.onchange = main.oninput = main.onkeydown = null;
  document.body.classList.remove("has-approve-bar");
  for (const [re, view] of routes) {
    const m = path.match(re);
    if (m) { view(m); return; }
  }
  placeholder({ reports: "Reports", rules: "Learned rules", settings: "Settings" }[path.split("/")[0]] || "Not found");
}

window.addEventListener("hashchange", () => { route(); main.scrollTop = 0; });
route();
