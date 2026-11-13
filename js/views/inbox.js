import { icon } from "../icons.js";
import { naira, escapeHtml, plural } from "../format.js";
import { badge, button, toast, $, $$ } from "../ui.js";
import { setCount } from "../shell.js";

// A receipt can be bulk approved only when it's Ready. Flagged vendor, date or total stays out.
const canBulkApprove = (r, state) => r.status === "ready" && !state.reading.has(r.id);

export function renderInbox(root, state) {
  const { receipts } = state;
  const isReading = state.reading.size > 0;

  root.innerHTML = `
    <header class="page-head">
      <div class="page-head__title">
        <span class="t-overline muted">November expenses</span>
        <h1 class="t-heading-lg">Inbox</h1>
      </div>
      <div class="page-head__actions">
        ${button({ label: "Add without a receipt", iconName: "pen", attrs: 'data-href="#/inbox/new"' })}
        ${button({ label: "Upload receipts", iconName: "upload", variant: "primary", attrs: 'data-href="#/inbox/upload"' })}
      </div>
    </header>

    ${isReading ? progressCard(state) : summaryCard(state)}

    <section class="card table table--inbox" role="table" aria-label="Receipts">
      <div class="table__row table__head" role="row">
        <input type="checkbox" class="check" data-select-all aria-label="Select all ready receipts">
        <span role="columnheader">Vendor</span>
        <span role="columnheader">Date</span>
        <span role="columnheader">Category</span>
        <span role="columnheader">Total</span>
        <span role="columnheader">Status</span>
        <span role="columnheader" class="center">Actions</span>
      </div>
      ${receipts.map((r) => row(r, state)).join("")}
    </section>

    <div class="main__spacer"></div>

    <div class="approve-bar" data-approve-bar hidden>
      <div class="approve-bar__text">
        <strong data-approve-title></strong>
        <span>Receipts with a flagged vendor, date or total stay out of bulk approval.</span>
      </div>
      <button type="button" class="btn" data-action="approve">${icon("check", 14)}<span data-approve-label></span></button>
    </div>
  `;

  setCount("inbox", receipts.filter((r) => r.status !== "approved").length || "");
  syncSelection(root, state);

  root.onchange = (e) => {
    const cb = e.target.closest(".check");
    if (!cb) return;
    if (cb.hasAttribute("data-select-all")) {
      const eligible = receipts.filter((r) => canBulkApprove(r, state)).map((r) => r.id);
      const all = eligible.every((id) => state.selected.has(id));
      eligible.forEach((id) => (all ? state.selected.delete(id) : state.selected.add(id)));
    } else {
      const id = cb.closest("[data-id]").dataset.id;
      cb.checked ? state.selected.add(id) : state.selected.delete(id);
    }
    syncSelection(root, state);
  };

  root.onclick = (e) => {
    const link = e.target.closest("[data-href]");
    if (link) { location.hash = link.dataset.href; return; }
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "approve") approveSelected(root, state);
    if (["open", "review", "upload-again"].includes(btn.dataset.action)) {
      toast("Reviewing receipts comes in the next stage of the demo.", { duration: 3000 });
    }
  };
}

function summaryCard(state) {
  const { receipts } = state;
  const read = receipts.filter((r) => !r.manual).length;
  const check = receipts.filter((r) => r.status === "check").length;
  const failed = receipts.filter((r) => r.status === "failed").length;
  const line = [
    check ? `${check} need${check === 1 ? "s" : ""} a quick look before you can approve ${check === 1 ? "it" : "them"}.` : "",
    failed ? `${failed === 1 ? "One photo was" : `${failed} photos were`} too blurry to read.` : "",
  ].filter(Boolean).join(" ") || "Everything here is ready to approve.";
  return `
    <section class="card summary" aria-live="polite">
      <h2>${plural(read, "receipt")} read</h2>
      <p>${line}</p>
    </section>`;
}

function progressCard(state) {
  const batch = state.receipts.filter((r) => r.batch);
  const done = batch.filter((r) => !state.reading.has(r.id)).length;
  const pct = batch.length ? (done / batch.length) * 100 : 0;
  return `
    <section class="card progress" aria-live="polite">
      <div class="progress__head">
        <h2>Reading ${plural(batch.length, "receipt")}</h2>
        <span class="t-data muted">${done} of ${batch.length} done</span>
      </div>
      <div class="progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="${batch.length}" aria-valuenow="${done}">
        <span class="progress__fill" style="width:${pct}%"></span>
      </div>
    </section>`;
}

function row(r, state) {
  const reading = state.reading.has(r.id);
  const selected = state.selected.has(r.id);
  const empty = (w) => `<span class="skeleton" style="width:${w}px"></span>`;
  const thumb = r.manual
    ? `<span class="thumb thumb--none" title="No receipt"></span>`
    : `<img class="thumb" src="assets/receipt-thumb.svg" alt="" width="18" height="23">`;

  if (reading) {
    return `
    <div class="table__row" role="row" data-id="${r.id}">
      <input type="checkbox" class="check" disabled aria-label="${escapeHtml(r.vendor)} is still reading">
      <div class="vendor">${thumb}<div class="vendor__text"><span class="vendor__name">${escapeHtml(r.fileLabel || r.vendor)}</span><span class="vendor__sub">Reading</span></div></div>
      <span>${empty(60)}</span><span>${empty(60)}</span><span>${empty(40)}</span>
      <span>${badge("reading")}</span>
      <span class="center">${button({ label: "Open", iconName: "eye", variant: "action", attrs: "disabled" })}</span>
    </div>`;
  }

  const flagged = r.status === "check" && r.flagged?.includes("total");
  const eligible = canBulkApprove(r, state);
  const action = {
    ready: { label: "Open", icon: "eye", key: "open" },
    approved: { label: "Open", icon: "eye", key: "open" },
    check: { label: "Review", icon: "search", key: "review" },
    failed: { label: "Upload again", icon: "retry", key: "upload-again" },
  }[r.status];
  const amount = r.total == null ? empty(40)
    : flagged ? `<span class="flag-amount">${naira(r.total, { short: true })}</span>`
    : `<span title="${naira(r.total)}">${naira(r.total, { short: true })}</span>`;

  return `
    <div class="table__row" role="row" data-id="${r.id}">
      <input type="checkbox" class="check" ${selected ? "checked" : ""} ${eligible ? "" : "disabled"}
        aria-label="Select ${escapeHtml(r.vendor)}" ${eligible ? "" : `title="${r.status === "approved" ? "Already approved" : "Check it first"}"`}>
      <div class="vendor">${thumb}
        <div class="vendor__text">
          <span class="vendor__name">${escapeHtml(r.vendor)}</span>
          <span class="vendor__sub${r.status === "failed" ? " vendor__sub--failed" : ""}">${escapeHtml(r.place)}</span>
        </div>
      </div>
      <span class="cell-date">${r.date ?? empty(60)}</span>
      <span class="cell-cat">${r.category ? escapeHtml(r.category) : r.manual ? '<span class="muted">Not set</span>' : empty(60)}</span>
      <span class="cell-amount">${amount}</span>
      <span>${badge(r.status, r.checkLabel)}</span>
      <span class="center">${button({ label: action.label, iconName: action.icon, variant: "action", attrs: `data-action="${action.key}"` })}</span>
    </div>`;
}

function syncSelection(root, state) {
  const picked = state.receipts.filter((r) => state.selected.has(r.id));
  const eligible = state.receipts.filter((r) => canBulkApprove(r, state));
  const bar = $("[data-approve-bar]", root);
  const all = $("[data-select-all]", root);

  $$("[data-id]", root).forEach((rowEl) => {
    const cb = $(".check", rowEl);
    if (cb && !cb.disabled) cb.checked = state.selected.has(rowEl.dataset.id);
  });

  all.checked = eligible.length > 0 && picked.length === eligible.length;
  all.indeterminate = picked.length > 0 && picked.length < eligible.length;
  all.disabled = eligible.length === 0;

  document.body.classList.toggle("has-approve-bar", picked.length > 0);
  if (!picked.length) { bar.hidden = true; return; }
  const sum = picked.reduce((t, r) => t + (r.total || 0), 0);
  $("[data-approve-title]", root).textContent = `${picked.length} selected, ${naira(sum)}`;
  $("[data-approve-label]", root).textContent = `Approve ${picked.length}`;
  bar.hidden = false;
}

// Bulk approval is reversible until the report is submitted. The toast is a shortcut, not the only way back.
function approveSelected(root, state) {
  const ids = [...state.selected];
  if (!ids.length) return;
  ids.forEach((id) => { state.receipts.find((r) => r.id === id).status = "approved"; });
  state.selected.clear();
  renderInbox(root, state);
  toast(`Approved ${plural(ids.length, "receipt")}.`, {
    undo: () => {
      ids.forEach((id) => { state.receipts.find((r) => r.id === id).status = "ready"; state.selected.add(id); });
      renderInbox(root, state);
    },
  });
}
