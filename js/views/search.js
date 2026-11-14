import { icon } from "../icons.js";
import { naira, escapeHtml, plural } from "../format.js";
import { yearReceipts } from "../assistant.js";
import { sampleReports, PEOPLE, MONTHS, MONTH_SHORT, YEAR } from "../reports.js";
import { categories } from "../data.js";

// Search finds things: receipts, reports, vendors, amounts and people, grouped and instant.
// It's separate from the assistant. When a search reads like a question, the last row offers to ask instead.

let host = null;
let st = null; // { q, tab, active }

const TABS = [["all", "All"], ["receipts", "Receipts"], ["reports", "Reports"], ["vendors", "Vendors"], ["people", "People"]];
const TRY = ["Shell", "Uber", "Lekki office", "Tunde Ade"];

export function openSearch(state, { query = "", onAsk }) {
  if (!host) {
    host = document.createElement("div");
    host.className = "search-host";
    document.body.appendChild(host);
    host.addEventListener("click", (e) => {
      if (e.target.classList.contains("scrim")) { closeSearch(); return; }
      const tab = e.target.closest("[data-tab]");
      if (tab && !tab.disabled) { st.tab = tab.dataset.tab; st.active = 0; render(state, onAsk); host.querySelector("input").focus(); return; }
      const item = e.target.closest("[data-i]");
      if (item) { st.active = Number(item.dataset.i); go(state, onAsk); return; }
      const t = e.target.closest("[data-try]");
      if (t) { st.q = t.dataset.try; st.active = 0; render(state, onAsk); host.querySelector("input").focus(); }
    });
    host.addEventListener("input", (e) => { st.q = e.target.value; st.active = 0; st.tab = "all"; renderResults(state, onAsk); });
    host.addEventListener("keydown", (e) => {
      const n = host.querySelectorAll("[data-i]").length;
      if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
      if (e.key === "ArrowDown") { e.preventDefault(); st.active = Math.min(n - 1, st.active + 1); renderResults(state, onAsk); }
      if (e.key === "ArrowUp") { e.preventDefault(); st.active = Math.max(0, st.active - 1); renderResults(state, onAsk); }
      if (e.key === "Enter") { e.preventDefault(); go(state, onAsk); }
    });
  }
  st = { q: query, tab: "all", active: 0 };
  document.querySelector('[data-action="search"]')?.classList.add("is-active");
  render(state, onAsk);
  const input = host.querySelector("input");
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

export function closeSearch() {
  host?.remove();
  host = null;
  document.querySelector('[data-action="search"]')?.classList.remove("is-active");
}

export const searchOpen = () => !!host;

// ---------- Finding things ----------

function find(state, q) {
  const s = q.trim().toLowerCase();
  if (!s) return null;
  const digits = s.replace(/[^\d]/g, "");
  const amountQuery = digits.length >= 3 && /^[₦\d,.\s]+$/.test(s);
  const all = yearReceipts(state);
  const hit = (r) => amountQuery ? String(r.total).includes(digits) : [r.vendor, r.place, r.category].some((x) => x?.toLowerCase().includes(s));
  const receipts = all.filter(hit).sort((a, b) => b.month - a.month || b.day - a.day);

  const reports = [...sampleReports, ...state.myReports].map((rep) => {
    const items = rep.items || all.filter((r) => r.where === rep.title && r.month === rep.month);
    const n = items.filter(hit).length;
    const named = `${rep.title} ${PEOPLE[rep.person].name} ${MONTHS[rep.month]}`.toLowerCase().includes(s);
    return { rep, n, named };
  }).filter((x) => x.n || x.named).sort((a, b) => b.rep.month - a.rep.month || b.n - a.n);

  const vendorMap = new Map();
  for (const r of all) if (r.vendor.toLowerCase().includes(s)) {
    const v = vendorMap.get(r.vendor) || { name: r.vendor, count: 0, total: 0, cats: {} };
    v.count++; v.total += r.total; v.cats[r.category] = (v.cats[r.category] || 0) + 1;
    vendorMap.set(r.vendor, v);
  }
  const vendors = [...vendorMap.values()].sort((a, b) => b.total - a.total);

  const people = Object.entries(PEOPLE).filter(([, p]) => p.name.toLowerCase().includes(s)).map(([k, p]) => ({ key: k, ...p, reports: [...sampleReports, ...state.myReports].filter((r) => r.person === k).length }));

  return { receipts, reports, vendors, people };
}

function askFor(q, res) {
  const v = res?.vendors[0]?.name;
  const cat = categories.find((c) => c.toLowerCase() === q.trim().toLowerCase());
  if (v && v.toLowerCase().startsWith(q.trim().toLowerCase())) return { text: `How much did we spend at ${v} this year?`, mark: v };
  if (cat) return { text: `How much did we spend on ${cat} this year?`, mark: cat };
  if (/\s/.test(q.trim()) || q.includes("?")) return { text: q.trim(), mark: "" };
  return { text: `What do we have for "${q.trim()}"?`, mark: q.trim() };
}

const mark = (text, m) => {
  const safe = escapeHtml(text);
  if (!m) return safe;
  const i = text.toLowerCase().indexOf(m.toLowerCase());
  return i < 0 ? safe : `${escapeHtml(text.slice(0, i))}<strong>${escapeHtml(text.slice(i, i + m.length))}</strong>${escapeHtml(text.slice(i + m.length))}`;
};

// ---------- Drawing ----------

function render(state, onAsk) {
  host.innerHTML = `
    <div class="scrim scrim--light"></div>
    <section class="search" role="dialog" aria-modal="true" aria-label="Search">
      <label class="search__input">
        ${icon("search", 18)}
        <input type="text" value="${escapeHtml(st.q)}" placeholder="Search receipts, reports, vendors and people" aria-label="Search" autocomplete="off" spellcheck="false">
        <span class="keycap">Esc</span>
      </label>
      <div class="search__results"></div>
      <footer class="search__foot"><span>↑ ↓  move</span><span>Enter  open</span><span>Esc  close</span></footer>
    </section>`;
  renderResults(state, onAsk);
}

function renderResults(state, onAsk) {
  const box = host.querySelector(".search__results");
  const res = find(state, st.q);
  let i = 0;
  const row = (html, cls = "") => `<div class="sr${cls}${i === st.active ? " is-active" : ""}" data-i="${i++}">${html}${i - 1 === st.active ? `<span class="keycap">Enter</span>` : ""}</div>`;
  st.items = [];

  if (!res) {
    box.innerHTML = `
      <div class="search__group"><span class="search__label">Try</span>
        ${TRY.map((t) => `<button type="button" class="sr sr--try" data-try="${t}"><span class="sr__icon">${icon("search", 14)}</span><span class="sr__text"><strong>${t}</strong></span></button>`).join("")}
      </div>
      ${askRow(state, { text: "Ask a question about your receipts", mark: "" }, row, null)}`;
    return;
  }

  const counts = { receipts: res.receipts.length, reports: res.reports.length, vendors: res.vendors.length, people: res.people.length };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const show = (k) => st.tab === "all" || st.tab === k;
  const lim = (k, n) => (st.tab === "all" ? n : 50);
  const ask = askFor(st.q, res);
  let html = `<div class="search__tabs" role="tablist">${TABS.map(([k, label]) => {
    const c = k === "all" ? null : counts[k];
    return `<button type="button" class="stab${st.tab === k ? " is-on" : ""}" data-tab="${k}" role="tab" aria-selected="${st.tab === k}" ${c === 0 ? "disabled" : ""}>${label}${c === null ? "" : `  ${c}`}</button>`;
  }).join("")}</div>`;

  if (!total) {
    html += `<p class="search__none">No receipts, reports, vendors or people match "${escapeHtml(st.q.trim())}".</p>`;
  }

  if (show("receipts") && counts.receipts) {
    html += `<div class="search__group"><span class="search__label">Receipts</span>`;
    for (const r of res.receipts.slice(0, lim("receipts", 3))) {
      st.items.push({ type: "receipt", r });
      html += row(`<img class="thumb thumb--22" src="assets/receipt-thumb.svg" alt="" width="22" height="28"><span class="sr__text"><strong>${escapeHtml(r.vendor)}</strong><span>${escapeHtml(r.place || "")} · ${r.day} ${MONTH_SHORT[r.month]} ${YEAR}</span></span><span class="sr__where">${escapeHtml(r.where || "")}</span><span class="sr__amount">${naira(r.total)}</span>`);
    }
    if (st.tab === "all" && counts.receipts > 3) html += `<div class="search__more"><button type="button" class="stab" data-tab="receipts">See all ${counts.receipts} receipts${icon("arrowRight", 13)}</button></div>`;
    html += `</div>`;
  }
  if (show("reports") && counts.reports) {
    html += `<div class="search__group"><span class="search__label">Reports</span>`;
    for (const x of res.reports.slice(0, lim("reports", 2))) {
      st.items.push({ type: "report", rep: x.rep });
      const who = PEOPLE[x.rep.person].name;
      html += row(`<span class="sr__icon">${icon("reports", 14)}</span><span class="sr__text"><strong>${escapeHtml(x.rep.title)}, ${MONTHS[x.rep.month]} ${YEAR}</strong><span>${escapeHtml(who)} · ${x.n ? mark(`${x.n} ${res.vendors[0]?.name.toLowerCase().includes(st.q.trim().toLowerCase()) ? res.vendors[0].name : st.q.trim()} receipt${x.n === 1 ? "" : "s"}`, st.q.trim()) : plural(x.rep.count, "receipt")}</span></span><span class="sr__amount">${naira(x.rep.total)}</span>`);
    }
    html += `</div>`;
  }
  if (show("vendors") && counts.vendors) {
    html += `<div class="search__group"><span class="search__label">Vendors</span>`;
    for (const v of res.vendors.slice(0, lim("vendors", 2))) {
      st.items.push({ type: "vendor", v });
      const cat = Object.entries(v.cats).sort((a, b) => b[1] - a[1])[0][0];
      html += row(`<span class="sr__icon">${icon("search", 14)}</span><span class="sr__text"><strong>${escapeHtml(v.name)}</strong><span>${escapeHtml(cat)} · ${plural(v.count, "receipt")} this year</span></span><span class="sr__amount">${naira(v.total)}</span>`);
    }
    html += `</div>`;
  }
  if (show("people") && counts.people) {
    html += `<div class="search__group"><span class="search__label">People</span>`;
    for (const p of res.people.slice(0, lim("people", 2))) {
      st.items.push({ type: "person", p });
      html += row(`<span class="avatar avatar--person avatar--24">${p.key}</span><span class="sr__text"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.title)} · ${plural(p.reports, "report")} this year</span></span>`);
    }
    html += `</div>`;
  }
  html += askRow(state, ask, row, onAsk);
  box.innerHTML = html;
  box.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}

function askRow(state, ask, row, onAsk) {
  st.items ||= [];
  st.items.push({ type: "ask", text: ask.text });
  return `<div class="search__ask">${row(`<span class="ask-mark"></span><span class="sr__text"><strong>Ask the record keeper</strong><span>${mark(ask.text, ask.mark)}</span></span>`, " sr--ask").replace('<span class="keycap">Enter</span>', "")}<span class="keycap keycap--inter">⌘K</span></div>`;
}

function go(state, onAsk) {
  const item = st.items?.[st.active];
  if (!item) return;
  closeSearch();
  if (item.type === "ask") { onAsk(item.text === "Ask a question about your receipts" ? "" : item.text); return; }
  if (item.type === "receipt") {
    if (item.r.receiptId) location.hash = `#/review/${item.r.receiptId}`;
    else { const rep = sampleReports.find((x) => x.title === item.r.where && x.month === item.r.month); location.hash = rep ? `#/reports/${YEAR}-${String(rep.month + 1).padStart(2, "0")}/${rep.id}` : "#/reports"; }
  }
  if (item.type === "report") location.hash = `#/reports/${YEAR}-${String(item.rep.month + 1).padStart(2, "0")}/${item.rep.id}`;
  if (item.type === "vendor") { openSearch(state, { query: item.v.name, onAsk }); st.tab = "receipts"; render(state, onAsk); }
  if (item.type === "person") location.hash = "#/reports";
}
