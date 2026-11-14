import { icon } from "../icons.js";
import { naira, escapeHtml, plural } from "../format.js";
import { badge, button, toast, pickFile, $, $$ } from "../ui.js";
import { setCount } from "../shell.js";

// A receipt can be bulk approved only when it's Ready. Flagged vendor, date or total stays out.
const canBulkApprove = (r, state) => r.status === "ready" && !state.reading.has(r.id);

export function renderInbox(root, state) {
  const all = state.receipts;
  // A filter from the assistant is always labelled with the question it came from, and one tap clears it.
  const filter = state.inboxFilter && all.some((r) => state.inboxFilter.ids.includes(r.id)) ? state.inboxFilter : null;
  if (!filter) state.inboxFilter = null;
  const receipts = filter ? all.filter((r) => filter.ids.includes(r.id)) : all;
  const isReading = receipts.some((r) => r.batch === state.batchNo && state.reading.has(r.id) && !r.lateArrival && !r.fileLabel && !r.retried);
  const slow = receipts.filter((r) => r.slow);
  const anyApproved = receipts.some((r) => r.status === "approved");

  root.innerHTML = `
    <header class="page-head">
      <div class="page-head__title">
        <span class="t-overline muted">November expenses</span>
        <h1 class="t-heading-lg">Inbox</h1>
      </div>
      <div class="page-head__actions">
        ${button({ label: "Add without a receipt", iconName: "pen", attrs: 'data-href="#/inbox/new"' })}
        ${button({ label: "Upload receipts", iconName: "upload", variant: anyApproved ? "" : "primary", attrs: 'data-action="upload"' })}
        ${anyApproved ? button({ label: "Submit report", iconName: "send", variant: "primary", attrs: 'data-action="submit"' }) : ""}
      </div>
    </header>

    ${filter ? `
    <div class="filter-bar">
      <span class="filter-chip"><span class="ask-mark ask-mark--16"></span><span>From your question: ${escapeHtml(filter.label)}</span><button type="button" class="filter-chip__clear" data-action="clear-filter" aria-label="Clear filter">${icon("x", 14)}</button></span>
      <span class="filter-bar__count">Showing ${receipts.length} of ${all.length}</span>
    </div>
    <section class="card summary" aria-live="polite">
      <h2>${plural(receipts.length, "receipt")}, ${naira(receipts.reduce((t, r) => t + (r.total || 0), 0))}</h2>
      <p>${escapeHtml(filter.desc)}. ${plural(all.length - receipts.length, "other receipt")} ${all.length - receipts.length === 1 ? "is" : "are"} hidden by this filter.</p>
    </section>` : isReading ? progressCard(state) : slow.length ? slow.map(slowBanner).join("") : summaryCard(state)}

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

  setCount("inbox", all.filter((r) => r.status !== "approved").length || "");
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
    let btn = e.target.closest("[data-action]");
    // Clicking anywhere on a row opens that receipt, so every one can be looked at, even one that couldn't be read.
    const rowEl = e.target.closest(".table__row[data-id]");
    if (!btn && rowEl && !e.target.closest("input, label") && !rowEl.classList.contains("is-reading") && !rowEl.classList.contains("is-slow")) {
      const r = receipts.find((x) => x.id === rowEl.dataset.id);
      btn = r?.problem ? rowEl.querySelector('[data-action="problem"]') || { dataset: { action: "problem" }, closest: () => rowEl } : rowEl.querySelector('[data-action="review"], [data-action="open"]');
    }
    if (!btn) return;
    if (btn.dataset.action === "approve") approveSelected(root, state);
    const id = btn.closest("[data-id]")?.dataset.id;
    if (id) delete state.reviewUi[id];
    if (btn.dataset.action === "review") {
      state.queue = { mode: "review", ids: receipts.filter((r) => r.status === "check" && !r.problem).map((r) => r.id) };
      location.hash = `#/review/${id}`;
    }
    if (btn.dataset.action === "problem") { state.queue = null; location.hash = `#/review/${id}`; }
    if (btn.dataset.action === "retry") state.actions.retry(id);
    if (btn.dataset.action === "clear-filter") { state.inboxFilter = null; renderInbox(root, state); }
    // With receipts already here, new files join the list. The empty upload screen is only for a first upload.
    if (btn.dataset.action === "upload") pickFile(() => state.actions.upload());
    if (btn.dataset.action === "open") {
      state.queue = null;
      if (state.docs[id]) location.hash = `#/review/${id}`;
      else toast("This record has no receipt to show.", { duration: 3000 });
    }
    if (btn.dataset.action === "upload-again") pickFile(() => state.actions.reread(id));
    if (btn.dataset.action === "submit") state.actions.submit();
  };
}

function summaryCard(state) {
  const { receipts } = state;
  const approved = receipts.filter((r) => r.status === "approved");
  if (approved.length) {
    const left = receipts.length - approved.length;
    const sum = approved.reduce((t, r) => t + (r.total || 0), 0);
    return `
    <section class="card summary" aria-live="polite">
      <h2>${approved.length} approved, ${naira(sum)}</h2>
      <p>${left ? `${plural(left, "receipt")} still need${left === 1 ? "s" : ""} you. ` : ""}Approvals can be undone until you submit the report.</p>
    </section>`;
  }
  // Right after submitting: say where the receipts went and what's still here.
  if (state.lastReport) {
    const rep = state.lastReport;
    const left = receipts.length;
    return `
    <section class="card summary" aria-live="polite">
      <h2>${escapeHtml(rep.title)} submitted, ${naira(rep.total)}</h2>
      <p>${plural(rep.count, "receipt")} went into the November report. ${left ? `${plural(left, "receipt")} still need${left === 1 ? "s" : ""} you, and ${left === 1 ? "it" : "they"} can go in December's report once ${left === 1 ? "it's" : "they're"} sorted.` : "The inbox is clear."}</p>
    </section>`;
  }
  const read = receipts.filter((r) => !r.manual).length;
  const check = receipts.filter((r) => r.status === "check" && !r.problem).length;
  const count = (p) => receipts.filter((r) => r.problem === p).length;
  const one = (n, single, many) => (n ? (n === 1 ? single : many.replace("#", n)) : "");
  const line = [
    check ? `${check} need${check === 1 ? "s" : ""} a quick look before you can approve ${check === 1 ? "it" : "them"}.` : "",
    one(count("unreadable"), "One photo was too blurry to read.", "# photos were too blurry to read."),
    one(count("partial"), "One is missing fields.", "# are missing fields."),
    one(count("notReceipt"), "One isn't a receipt.", "# aren't receipts."),
    one(count("duplicate"), "One looks like a copy.", "# look like copies."),
  ].filter(Boolean).join(" ") || "Everything here is ready to approve.";
  return `
    <section class="card summary" aria-live="polite">
      <h2>${plural(read, "receipt")} read</h2>
      <p>${line}</p>
    </section>`;
}

function progressCard(state) {
  const batch = state.receipts.filter((r) => r.batch === state.batchNo);
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

// One slow file never blocks the rest. Say what's happening, that nothing is lost, and offer a way forward.
function slowBanner(r) {
  return `
    <section class="banner" aria-live="polite">
      <div class="banner__text">
        <h2>${escapeHtml(r.vendor)} is taking longer than usual</h2>
        <p>Your file is safe. The rest of your receipts are ready to use.</p>
      </div>
      <button type="button" class="btn" data-action="retry" data-id="${r.id}">${icon("retry", 14)}<span>Try again</span></button>
    </section>`;
}

function row(r, state) {
  const reading = state.reading.has(r.id);
  const selected = state.selected.has(r.id);
  const empty = (w) => `<span class="skeleton" style="width:${w}px"></span>`;
  const thumb = r.manual
    ? `<span class="thumb thumb--none" title="No receipt"></span>`
    : `<img class="thumb" src="assets/receipt-thumb.svg" alt="" width="18" height="23">`;

  if (r.slow) {
    return `
    <div class="table__row is-slow" role="row" data-id="${r.id}">
      <input type="checkbox" class="check" disabled aria-label="${escapeHtml(r.vendor)} is still reading">
      <div class="vendor">${thumb}<div class="vendor__text"><span class="vendor__name">${escapeHtml(r.vendor)}</span><span class="vendor__sub">Still reading</span></div></div>
      <span>${empty(60)}</span><span>${empty(60)}</span><span>${empty(40)}</span>
      <span><span class="tag tag--check">Taking a while</span></span>
      <span class="center">${button({ label: "Try again", iconName: "retry", variant: "action", attrs: 'data-action="retry"' })}</span>
    </div>`;
  }

  if (reading) {
    return `
    <div class="table__row is-reading" role="row" data-id="${r.id}">
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
    partial: { label: "Fill in", icon: "pen", key: "problem" },
    notReceipt: { label: "Review", icon: "search", key: "problem" },
    duplicate: { label: "Compare", icon: "copy", key: "problem" },
  }[r.problem] || {
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
  const pool = state.inboxFilter ? state.receipts.filter((r) => state.inboxFilter.ids.includes(r.id)) : state.receipts;
  // With a filter on, only what's on screen counts. Nothing hidden gets approved.
  const picked = pool.filter((r) => state.selected.has(r.id));
  const eligible = pool.filter((r) => canBulkApprove(r, state));
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
  const pool = state.inboxFilter ? state.receipts.filter((r) => state.inboxFilter.ids.includes(r.id)) : state.receipts;
  const ids = pool.filter((r) => state.selected.has(r.id)).map((r) => r.id);
  if (!ids.length) return;
  ids.forEach((id) => { state.receipts.find((r) => r.id === id).status = "approved"; state.selected.delete(id); });
  renderInbox(root, state);
  toast(`Approved ${plural(ids.length, "receipt")}.`, {
    undo: () => {
      ids.forEach((id) => { state.receipts.find((r) => r.id === id).status = "ready"; state.selected.add(id); });
      renderInbox(root, state);
    },
  });
}
