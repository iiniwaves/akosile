import { icon } from "../icons.js";
import { naira, escapeHtml, plural } from "../format.js";
import { button, toast, backTitle } from "../ui.js";
import { YEAR, CURRENT_MONTH, MONTHS, MONTH_SHORT, PEOPLE, sampleReports, sampleEnteredByHand, sampleReceipts } from "../reports.js";
import { FIELD_LABEL } from "../receipts.js";

// Reports: a year, a month, one report. Only a person submits, and every report says
// exactly what's in it, where each value came from, and what was left out.

const ORDER = ["AB", "TA", "KO"];
const SPLIT_COLOURS = ["var(--action-primary)", "var(--text-tertiary)", "var(--border-strong)"];
const monthKey = (m) => `${YEAR}-${String(m + 1).padStart(2, "0")}`;
const byPerson = (a, b) => ORDER.indexOf(a.person) - ORDER.indexOf(b.person);

export const allReports = (state) => [...sampleReports, ...state.myReports];
const reportsIn = (state, m) => allReports(state).filter((r) => r.month === m).sort(byPerson);
const monthTotal = (state, m) => reportsIn(state, m).reduce((t, r) => t + r.total, 0);

// Where a submitted value came from, in plain words.
export function sourceOf(r, doc) {
  if (r.manual) return "No receipt";
  if (r.entered) return "Entered by hand";
  const parts = ["Read"];
  for (const [key, f] of Object.entries(doc?.fields || {})) {
    if (f.state === "confirmed") parts.push(`${FIELD_LABEL[key].toLowerCase()} confirmed`);
    if (f.state === "edited") parts.push(`${FIELD_LABEL[key].toLowerCase()} edited`);
  }
  if (doc?.fields?.category?.state === "rule") parts.push("team rule");
  return parts.join(", ");
}

const statusChip = (report, big) => report.status === "draft"
  ? `<span class="rchip rchip--draft${big ? " rchip--big" : ""}">Draft</span>`
  : `<span class="rchip rchip--done${big ? " rchip--big" : ""}">Submitted</span>`;

const avatars = (people) => `<span class="avatars">${people.map((p) => `<span class="avatars__one" title="${PEOPLE[p].name}">${p}</span>`).join("")}</span>`;

function download(name, rows) {
  const csv = rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- The year ----------

export function renderYear(root, state) {
  const reports = allReports(state);
  const spent = reports.reduce((t, r) => t + r.total, 0);
  const receipts = reports.reduce((t, r) => t + r.count, 0);
  const people = new Set(reports.map((r) => r.person)).size;
  const byHand = sampleEnteredByHand + state.myReports.reduce((t, r) => t + r.items.filter((i) => i.source === "Entered by hand" || i.source === "No receipt").length, 0);
  const totals = MONTHS.map((_, m) => monthTotal(state, m));
  const busiest = totals.indexOf(Math.max(...totals));
  const max = Math.max(...totals);
  const current = reportsIn(state, CURRENT_MONTH);
  const drafts = current.filter((r) => r.status === "draft").length;

  // Spend by category, worked out from every receipt in every report this year.
  const cats = {};
  for (const rep of sampleReports) for (const i of sampleReceipts(rep)) cats[i.category] = (cats[i.category] || 0) + i.total;
  for (const rep of state.myReports) for (const i of rep.items) cats[i.category || "Other"] = (cats[i.category || "Other"] || 0) + i.total;
  const catTotal = Object.values(cats).reduce((a, b) => a + b, 0);
  const catRows = Object.entries(cats).map(([name, v]) => ({ name, pct: Math.round((v / catTotal) * 100) })).filter((c) => c.pct > 0).sort((a, b) => b.pct - a.pct);
  const maxPct = catRows[0]?.pct || 1;

  const bars = MONTHS.map((name, m) => {
    if (m > CURRENT_MONTH) return `<div class="bars__col"><span class="bars__bar bars__bar--empty"></span><span class="bars__label">${MONTH_SHORT[m]}</span></div>`;
    const h = Math.round((totals[m] / max) * 148);
    const k = `₦${(totals[m] / 1000).toFixed(1)}k`;
    return `
      <a class="bars__col${m === CURRENT_MONTH ? " is-current" : ""}" href="#/reports/${monthKey(m)}" aria-label="${name}, ${naira(totals[m])}">
        <span class="bars__tip">${k}</span>
        <span class="bars__bar" style="height:${h}px"></span>
        <span class="bars__label">${MONTH_SHORT[m]}</span>
      </a>`;
  }).join("");

  const recent = [CURRENT_MONTH, CURRENT_MONTH - 1, CURRENT_MONTH - 2, CURRENT_MONTH - 3].map((m) => {
    const list = reportsIn(state, m);
    const d = list.filter((r) => r.status === "draft").length;
    return `
      <div class="table__row" role="row">
        <span class="months__name">${MONTHS[m]} ${YEAR}</span>
        <span class="mono">${list.length}</span>
        <span>${avatars([...new Set(list.map((r) => r.person))])}</span>
        <span class="mono">${list.reduce((t, r) => t + r.count, 0)}</span>
        <span class="cell-amount">${naira(monthTotal(state, m))}</span>
        <span>${d ? `<span class="rchip rchip--draft">${plural(d, "draft")}</span>` : `<span class="rchip rchip--done">All submitted</span>`}</span>
        <span class="right"><a class="btn btn--sm" href="#/reports/${monthKey(m)}">${icon("eye", 14)}<span>Open</span></a></span>
      </div>`;
  }).join("");

  root.innerHTML = `
    <header class="page-head">
      <div class="page-head__title">
        <span class="t-overline muted">Reports  ·  ${escapeHtml(state.workspaceName)}</span>
        <h1 class="t-heading-lg t-heading-lg--tight">${YEAR}</h1>
      </div>
      <div class="page-head__actions page-head__actions--end">
        <div class="year-nav">
          <button type="button" class="btn btn--icon-sm" data-act="prev-year" aria-label="${YEAR - 1}">${icon("chevronLeft", 14)}</button>
          <button type="button" class="btn btn--sm" data-act="this-year"><span>${YEAR}</span></button>
          <button type="button" class="btn btn--icon-sm" disabled aria-label="${YEAR + 1}">${icon("chevronRight", 14)}</button>
        </div>
        <button type="button" class="btn btn--sm" data-act="download-year">${icon("reports", 14)}<span>Download year</span></button>
      </div>
    </header>

    <section class="card stats">
      ${stat(`Spent in ${YEAR}`, naira(spent), `Jan to ${MONTH_SHORT[CURRENT_MONTH]}, approved receipts only`)}
      ${stat("Reports", reports.length, `Across ${people} people`)}
      ${stat("Receipts", receipts, `${byHand} entered by hand`)}
      ${stat("Busiest month", MONTHS[busiest], naira(totals[busiest]))}
    </section>

    <div class="charts">
      <section class="card chart">
        <h2>Monthly spend</h2>
        <div class="bars">${bars}</div>
        <p class="chart__note">${MONTHS[CURRENT_MONTH]} is still open${current.length ? `: ${drafts} of ${current.length} report${current.length === 1 ? "" : "s"} ${drafts === 1 ? "is a draft" : "are drafts"}` : ""}.</p>
      </section>
      <section class="card cats">
        <h2>By category</h2>
        ${catRows.map((c) => `
          <div class="cats__row">
            <div class="cats__head"><span>${escapeHtml(c.name)}</span><span class="mono muted">${c.pct}%</span></div>
            <div class="cats__track"><span style="width:${Math.round((c.pct / maxPct) * 274)}px"></span></div>
          </div>`).join("")}
      </section>
    </div>

    <section class="card table table--months" role="table" aria-label="Months">
      <div class="table__row table__head" role="row">
        <span>Month</span><span>Reports</span><span>Submitted by</span><span>Receipts</span><span>Total</span><span>Status</span><span class="right">Actions</span>
      </div>
      ${recent}
    </section>
  `;

  root.onclick = (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "prev-year") toast(`Reports for ${YEAR - 1} aren't part of this demo.`, { duration: 3000 });
    if (act === "download-year") download(`reports-${YEAR}.csv`, [["Month", "Reports", "Receipts", "Total"], ...MONTHS.slice(0, CURRENT_MONTH + 1).map((n, m) => [`${n} ${YEAR}`, reportsIn(state, m).length, reportsIn(state, m).reduce((t, r) => t + r.count, 0), totals[m]])]);
  };
}

function stat(label, value, sub) {
  return `<div class="stat"><span class="t-overline muted">${label}</span><strong>${escapeHtml(String(value))}</strong>${sub ? `<span class="stat__sub">${escapeHtml(sub)}</span>` : ""}</div>`;
}

// ---------- One month ----------

export function renderMonth(root, state, m) {
  const list = reportsIn(state, m);
  const total = list.reduce((t, r) => t + r.total, 0);
  const submitted = list.filter((r) => r.status === "submitted").length;
  const drafts = list.length - submitted;
  const leftOut = list.reduce((t, r) => t + (r.leftOut?.length || 0), 0);
  const open = (state.openReports ||= {});
  if (!(m in open)) open[m] = list[0]?.id;

  const card = (rep) => {
    const isOpen = open[m] === rep.id;
    const items = rep.items || sampleReceipts(rep);
    const who = PEOPLE[rep.person].name;
    const when = rep.status === "draft" ? `Draft, last edited ${rep.when}` : `Submitted ${rep.when}`;
    return `
      <section class="card report${isOpen ? " is-open" : ""}">
        <button type="button" class="report__head" data-toggle="${rep.id}" aria-expanded="${isOpen}">
          <span class="avatar avatar--person avatar--28">${rep.person}</span>
          <span class="report__name"><strong>${escapeHtml(rep.title)}</strong><span>${who}  ·  ${when}</span></span>
          <span class="report__count">${plural(rep.count, "receipt")}</span>
          <span class="report__total">${naira(rep.total)}</span>
          ${statusChip(rep)}
          <span class="report__chev">${icon(isOpen ? "chevronUp" : "chevronDown", 18, 1.9)}</span>
        </button>
        ${isOpen ? `
          <div class="report__body">
            ${items.map((i) => `
              <div class="report__row">
                <span class="report__vendor">${escapeHtml(i.vendor)}</span>
                <span class="mono muted">${i.day} ${MONTH_SHORT[m]}</span>
                <span>${escapeHtml(i.category || "")}</span>
                <span class="cell-amount">${naira(i.total)}</span>
                <span class="muted">${escapeHtml(i.source)}</span>
              </div>`).join("")}
            <div class="report__foot"><a class="btn btn--sm" href="#/reports/${monthKey(m)}/${rep.id}"><span>Open report</span>${icon("arrowRight", 14)}</a></div>
          </div>` : ""}
      </section>`;
  };

  const legend = list.map((rep, i) => `
    <span class="legend__item"><span class="legend__swatch" style="background:${SPLIT_COLOURS[i]}"></span>${PEOPLE[rep.person].name}${rep.status === "draft" ? ", draft" : ""}<span class="mono muted">${naira(rep.total)}</span></span>`).join("");

  root.innerHTML = `
    <header class="page-head page-head--detail">
      ${backTitle("Reports", "#/reports", `${MONTHS[m]} ${YEAR}`)}
      <div class="page-head__actions">
        <button type="button" class="btn btn--sm" data-act="export-month">${icon("reports", 14)}<span>Export month</span></button>
      </div>
    </header>

    <section class="card month-summary">
      <div class="month-summary__stats">
        ${stat("Spent", naira(total), list.length ? [submitted && `${submitted} submitted`, drafts && `${drafts} draft${drafts === 1 ? "" : "s"}`].filter(Boolean).join(", ") : "Nothing yet")}
        ${stat("Receipts", list.reduce((t, r) => t + r.count, 0), leftOut ? `${leftOut} left out` : "")}
        ${stat("People", new Set(list.map((r) => r.person)).size, "")}
      </div>
      ${list.length ? `<div class="split-bar">${list.map((rep, i) => `<span style="flex-grow:${rep.total};background:${SPLIT_COLOURS[i]}"></span>`).join("")}</div>
      <div class="legend">${legend}</div>` : ""}
    </section>

    <span class="t-overline muted">Reports this month</span>
    ${list.map(card).join("") || `<section class="card empty-note">No reports for ${MONTHS[m]} yet.</section>`}
  `;

  root.onclick = (e) => {
    const t = e.target.closest("[data-toggle]");
    if (t) { open[m] = open[m] === t.dataset.toggle ? null : t.dataset.toggle; renderMonth(root, state, m); return; }
    if (e.target.closest('[data-act="export-month"]')) {
      download(`reports-${monthKey(m)}.csv`, [["Report", "Person", "Vendor", "Day", "Category", "Total", "Source"],
        ...list.flatMap((rep) => (rep.items || sampleReceipts(rep)).map((i) => [rep.title, PEOPLE[rep.person].name, i.vendor, `${i.day} ${MONTH_SHORT[m]} ${YEAR}`, i.category, i.total, i.source]))]);
    }
  };
}

// ---------- One report ----------

export function renderReport(root, state, m, id) {
  const rep = allReports(state).find((r) => r.id === id);
  if (!rep) { location.hash = `#/reports/${monthKey(m)}`; return; }
  const items = rep.items || sampleReceipts(rep);
  const who = PEOPLE[rep.person].name;
  const selected = (state.reportSelection ||= {})[id] ||= new Set();

  const leftOutText = rep.leftOut?.length
    ? rep.leftOut.length === 1
      ? `${rep.leftOut[0].name} ${rep.leftOut[0].why}. It stays in the inbox and can go in ${MONTHS[(m + 1) % 12]}'s report once it's sorted.`
      : `${rep.leftOut.map((l) => l.name).join(", ")} weren't ready. They stay in the inbox and can go in ${MONTHS[(m + 1) % 12]}'s report once they're sorted.`
    : "Nothing was left out.";
  const rulesText = rep.rules?.length
    ? rep.rules.map((r) => `${r.vendor} is always ${r.value}, added by ${r.byName} on ${r.on}. Used on ${plural(r.used, "receipt")} in this report.`).join(" ")
    : "No team rules were used.";

  root.innerHTML = `
    <header class="page-head page-head--detail">
      ${backTitle(`${MONTHS[m]} ${YEAR}`, `#/reports/${monthKey(m)}`, rep.title)}
      <div class="page-head__actions">
        ${button({ label: "Export CSV", iconName: "copy", attrs: 'data-act="csv"' })}
        ${button({ label: "Download PDF", iconName: "reports", attrs: 'data-act="pdf"' })}
      </div>
    </header>

    <section class="card report-summary">
      <div class="report-summary__who">
        ${statusChip(rep, true)}
        <span>${rep.status === "draft" ? `Last edited by ${who}, ${rep.at}` : `By ${who}, ${rep.at}`}</span>
      </div>
      ${stat("Total", naira(rep.total), "")}
      ${stat("Receipts", rep.count, "")}
      ${stat("Left out", rep.leftOut?.length || 0, "")}
    </section>

    <section class="card table table--inbox table--report" role="table" aria-label="Receipts in ${escapeHtml(rep.title)}">
      <div class="table__row table__head" role="row">
        <input type="checkbox" class="check" data-all aria-label="Select all" ${selected.size === items.length ? "checked" : ""}>
        <span>Vendor</span><span>Date</span><span>Category</span><span>Total</span><span>Source</span><span class="center">Actions</span>
      </div>
      ${items.map((i) => `
        <div class="table__row" role="row" data-item="${i.id}">
          <input type="checkbox" class="check" data-pick="${i.id}" aria-label="Select ${escapeHtml(i.vendor)}" ${selected.has(i.id) ? "checked" : ""}>
          <div class="vendor"><img class="thumb" src="assets/receipt-thumb.svg" alt="" width="18" height="23"><div class="vendor__text"><span class="vendor__name">${escapeHtml(i.vendor)}</span><span class="vendor__sub">${escapeHtml(i.place || "")}</span></div></div>
          <span class="cell-date">${i.day} ${MONTH_SHORT[m]} ${YEAR}</span>
          <span class="cell-cat">${escapeHtml(i.category || "")}</span>
          <span class="cell-amount">${naira(i.total)}</span>
          <span class="report__source">${escapeHtml(i.source)}</span>
          <span class="center">${button({ label: "Open", iconName: "eye", variant: "action", attrs: `data-open="${i.receiptId || ""}"` })}</span>
        </div>`).join("")}
    </section>

    <div class="report-notes">
      <section class="card report-note"><span class="t-overline muted">Left out</span><p>${escapeHtml(leftOutText)}</p></section>
      <section class="card report-note"><span class="t-overline muted">Team rules used</span><p>${escapeHtml(rulesText)}</p></section>
    </div>

    ${printPage(state, rep, items, m, who, leftOutText, rulesText)}
  `;

  root.onclick = (e) => {
    const open = e.target.closest("[data-open]");
    if (open) {
      if (open.dataset.open) location.hash = `#/review/${open.dataset.open}`;
      else toast("Receipts in the sample reports can't be opened in this demo.", { duration: 3000 });
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "csv") {
      const rows = items.filter((i) => !selected.size || selected.has(i.id));
      download(`${rep.title.toLowerCase().replace(/\W+/g, "-")}-${monthKey(m)}.csv`, [["Vendor", "Date", "Category", "Total", "Source"], ...rows.map((i) => [i.vendor, `${i.day} ${MONTH_SHORT[m]} ${YEAR}`, i.category, i.total, i.source])]);
      toast(`Exported ${plural(rows.length, "receipt")}.`, { duration: 3000 });
    }
    if (act === "pdf") {
      // The browser's print dialog saves it as a PDF. The file name comes from the page title.
      const title = document.title;
      document.title = `${rep.title}, ${MONTHS[m]} ${YEAR}`;
      window.addEventListener("afterprint", () => { document.title = title; }, { once: true });
      window.print();
    }
  };
  root.onchange = (e) => {
    if (e.target.matches("[data-all]")) { if (e.target.checked) items.forEach((i) => selected.add(i.id)); else selected.clear(); renderReport(root, state, m, id); }
    if (e.target.matches("[data-pick]")) { if (e.target.checked) selected.add(e.target.dataset.pick); else selected.delete(e.target.dataset.pick); renderReport(root, state, m, id); }
  };
}

// The report on one A4 page, shown only when printing.
function printPage(state, rep, items, m, who, leftOutText, rulesText) {
  const status = rep.status === "draft" ? `Draft, last edited by ${who}, ${rep.at}` : `Submitted by ${who}, ${rep.at}`;
  return `
    <article class="print-page" aria-hidden="true">
      <header class="print-page__head">
        <img src="assets/logo/akosile-wordmark.svg" alt="" height="24">
        <div class="print-page__ws"><strong>${escapeHtml(state.workspaceName)}</strong><span class="t-overline">Expense report</span></div>
      </header>
      <hr class="print-page__rule">
      <div class="print-page__title"><h1>${escapeHtml(rep.title)}</h1><p>${MONTHS[m]} ${YEAR}  ·  ${escapeHtml(status)}</p></div>
      <div class="print-page__stats">
        <div><span class="t-overline">Total</span><strong>${naira(rep.total)}</strong></div>
        <div><span class="t-overline">Receipts</span><strong>${rep.count}</strong></div>
        <div><span class="t-overline">Left out</span><strong>${rep.leftOut?.length || 0}</strong></div>
      </div>
      <div class="print-page__table">
        <div class="print-page__row print-page__row--head"><span class="t-overline">Vendor</span><span class="t-overline">Date</span><span class="t-overline">Category</span><span class="t-overline">Source</span><span class="t-overline">Total</span></div>
        ${items.map((i) => `
          <div class="print-page__row">
            <span class="print-page__vendor"><strong>${escapeHtml(i.vendor)}</strong>${i.place ? `<span>${escapeHtml(i.place)}</span>` : ""}</span>
            <span class="print-page__mono">${i.day} ${MONTH_SHORT[m]} ${YEAR}</span>
            <span>${escapeHtml(i.category || "")}</span>
            <span class="print-page__muted">${escapeHtml(i.source)}</span>
            <span class="print-page__amount">${naira(i.total)}</span>
          </div>`).join("")}
        <div class="print-page__total"><strong>Total, ${plural(rep.count, "receipt")}</strong><span>${naira(rep.total)}</span></div>
      </div>
      <div class="print-page__notes">
        <div><span class="t-overline">Left out</span><p>${escapeHtml(leftOutText)}</p></div>
        <div><span class="t-overline">Team rules used</span><p>${escapeHtml(rulesText)}</p></div>
      </div>
      <footer class="print-page__foot"><span>${escapeHtml(state.workspaceName)}  ·  ${escapeHtml(rep.title)}, ${MONTHS[m]} ${YEAR}</span><span class="print-page__mono">Page 1 of 1</span></footer>
    </article>`;
}

// ---------- Submitting ----------

const WHY = {
  unreadable: ["The blurry receipt", "couldn't be read"],
  partial: ["The receipt with missing fields", "is missing fields"],
  notReceipt: ["The photo that isn't a receipt", "isn't a receipt"],
  duplicate: ["The possible copy", "looks like a copy"],
};
export function leftOutReason(r) {
  if (WHY[r.problem]) return WHY[r.problem];
  if (r.status === "check") return ["The receipt that still needs a look", "still needs a look"];
  if (r.slow || r.status === "reading") return ["The receipt that's still reading", "is still reading"];
  return ["The receipt you haven't approved", "wasn't approved"];
}

export function openSubmitDialog(state, onSubmit) {
  const approved = state.receipts.filter((r) => r.status === "approved");
  const left = state.receipts.filter((r) => r.status !== "approved");
  const total = approved.reduce((t, r) => t + (r.total || 0), 0);
  const name = (r) => r.fileLabel || r.vendor;
  const leftValue = !left.length ? "Nothing" : left.length <= 2 ? left.map(name).join(", ") : `${name(left[0])} and ${left.length - 1} more`;
  const note = !left.length
    ? "Everything in the inbox goes into this report."
    : left.length === 1
      ? `${leftOutReason(left[0])[0]} stays in your inbox. You can add it to next month's report once it's sorted.`
      : `The other ${left.length} receipts stay in your inbox. You can add them to next month's report once they're sorted.`;

  const host = document.createElement("div");
  host.className = "dialog-host";
  host.innerHTML = `
    <div class="scrim" data-close></div>
    <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <h2 id="submit-title">Submit ${MONTHS[CURRENT_MONTH]} report?</h2>
      <p class="dialog__sub">Submitting as ${escapeHtml(state.me.name)} for ${escapeHtml(state.workspaceName)}</p>
      <dl class="inset dialog__facts">
        <div><dt>Receipts</dt><dd>${approved.length}</dd></div>
        <div><dt>Total</dt><dd>${naira(total)}</dd></div>
        <div><dt>Left out</dt><dd>${escapeHtml(leftValue)}</dd></div>
      </dl>
      <p class="dialog__note">${escapeHtml(note)}</p>
      <div class="dialog__actions">
        ${button({ label: "Cancel", iconName: "x", attrs: "data-close" })}
        ${button({ label: "Submit report", iconName: "send", variant: "primary", attrs: "data-submit" })}
      </div>
    </section>`;
  const before = document.activeElement;
  const close = () => { host.remove(); document.removeEventListener("keydown", onKey); before?.focus?.(); };
  const onKey = (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const f = [...host.querySelectorAll("button")];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  };
  host.onclick = (e) => {
    if (e.target.closest("[data-close]")) close();
    if (e.target.closest("[data-submit]")) { close(); onSubmit(); }
  };
  document.addEventListener("keydown", onKey);
  document.body.appendChild(host);
  host.querySelector("[data-submit]").focus();
}
