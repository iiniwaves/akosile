import { icon } from "../icons.js";
import { naira, escapeHtml } from "../format.js";
import { button, toast, backTitle } from "../ui.js";
import { categories } from "../data.js";
import { dateField, handleDatePicker } from "../datepicker.js";
import { FIELD_ORDER, FIELD_LABEL, MONEY, learnable } from "../receipts.js";

// One receipt, side by side with what the AI read from it.
// Quiet when sure, loud when not. Every value shows its source. Every change can be undone.

const needsLook = (f) => f.state === "check" || f.state === "missing";
const fmt = (key, v) => (MONEY.includes(key) ? naira(v) : String(v));

export function renderReview(root, state, id, hooks) {
  const r = state.receipts.find((x) => x.id === id);
  const doc = state.docs[id];
  if (!r || !doc) { location.hash = "#/inbox"; return; }

  const ui = (state.reviewUi[id] ||= { selected: doc.fields.category?.state === "rule" ? "category" : null, editing: null });
  const queue = state.queue?.ids?.includes(id) ? state.queue : { mode: "open", ids: openable(state) };
  const pos = queue.ids.indexOf(id);
  const keys = FIELD_ORDER.filter((k) => doc.fields[k]);
  const toCheck = keys.filter((k) => needsLook(doc.fields[k]));
  const history = doc.history || [];

  const navCaption = `Receipt ${pos + 1} of ${queue.ids.length}${queue.mode === "review" ? " to check" : ""}`;

  let headTitle, headSub;
  if (r.status === "approved") { headTitle = "Approved"; headSub = "Approved by you. You can undo this until the report is submitted."; }
  else if (toCheck.length) { headTitle = `${toCheck.length} field${toCheck.length > 1 ? "s" : ""} to check`; headSub = "The rest look right."; }
  else if (history.length) { headTitle = "All fields checked"; headSub = "Ready to approve."; }
  else { headTitle = "Looks good"; headSub = "Nothing to check."; }

  const selectedLine = sourceLine(doc, ui.selected);
  const caption = ui.selected && selectedLine
    ? (ui.selected === "category" ? "Category comes from the vendor name" : `${FIELD_LABEL[ui.selected].toUpperCase()} is selected`)
    : doc.caption;

  root.innerHTML = `
    <header class="page-head page-head--detail">
      ${backTitle("Inbox", "#/inbox", r.vendor)}
      <nav class="pager" aria-label="Move between receipts">
        <div class="page-head__actions">
          ${button({ label: "Previous", iconName: "chevronLeft", attrs: `data-go="${queue.ids[pos - 1] || ""}" ${pos > 0 ? "" : "disabled"}` })}
          <button type="button" class="btn" data-go="${queue.ids[pos + 1] || ""}" ${pos < queue.ids.length - 1 ? "" : "disabled"}><span>Next</span>${icon("chevronRight", 14)}</button>
        </div>
        <span class="pager__caption">${escapeHtml(navCaption)}</span>
      </nav>
    </header>

    <div class="split">
      <section class="doc-area doc-area--top" aria-label="Receipt">
        ${receipt(doc, ui)}
        <p class="doc-caption">${escapeHtml(caption)}</p>
      </section>

      <section class="fields-panel" aria-label="What was read">
        <div class="fields-panel__head">
          <h2>${headTitle}</h2>
          <p>${headSub}</p>
        </div>
        ${keys.map((k) => field(k, doc, ui, r, state)).join("")}
        <div class="fields-panel__spacer"></div>
        ${history.length ? historyInset(history) : ""}
        <div class="fields-panel__actions">
          ${r.status === "approved"
            ? button({ label: "Undo approval", iconName: "undo", attrs: 'data-act="unapprove"' })
            : `${button({ label: "Approve", iconName: "check", variant: "primary", attrs: `data-act="approve" ${toCheck.length ? "disabled" : ""}` })}
               ${toCheck.length
                 ? `<span class="fields-panel__hint">Check the ${FIELD_LABEL[toCheck[0]].toLowerCase()} first</span>`
                 : `<button type="button" class="btn" data-act="skip"><span>Skip for now</span>${icon("arrowRight", 14)}</button>`}`}
        </div>
      </section>
    </div>
  `;

  const input = root.querySelector("[data-edit-input]");
  if (input) { input.focus(); input.select?.(); }

  // ---------- Events ----------
  const rerender = () => renderReview(root, state, id, hooks);

  root.onclick = (e) => {
    if (handleDatePicker(e, root, () => {})) return;
    const go = e.target.closest("[data-go]");
    if (go) { if (go.dataset.go) location.hash = `#/review/${go.dataset.go}`; return; }

    const line = e.target.closest("[data-line-field]");
    if (line) { select(line.dataset.lineField); return; }

    const act = e.target.closest("[data-act]");
    if (act) { handleAct(act.dataset.act, act.dataset); return; }

    const f = e.target.closest("[data-field]");
    if (f && !e.target.closest("input, select, button")) {
      select(ui.selected === f.dataset.field && !ui.editing ? null : f.dataset.field);
    }
  };

  root.onkeydown = (e) => {
    const f = e.target.closest("[data-field]");
    if (e.key === "Escape") { ui.editing = null; select(null); return; }
    if (f && e.target === f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(f.dataset.field); }
    if (e.target.matches("[data-edit-input]") && e.key === "Enter") { e.preventDefault(); saveEdit(e.target.value); }
  };

  root.onchange = (e) => {
    if (e.target.matches("[data-category]")) change("category", { value: e.target.value, state: "edited", line: null, note: `Was ${doc.fields.category.value}, guessed from the vendor name.` }, `Category changed to ${e.target.value}.`);
  };

  function select(key) {
    ui.selected = key;
    ui.editing = null;
    rerender();
    root.querySelector(`[data-field="${key}"]`)?.focus({ preventScroll: true });
  }

  function handleAct(act, data) {
    const key = data.key;
    const f = key && doc.fields[key];
    if (act === "confirm") change(key, { ...f, state: "confirmed" }, `${FIELD_LABEL[key]} confirmed.`);
    if (act === "alt") {
      const alt = f.alternatives[Number(data.alt)];
      if (alt.value === f.value) return;
      const orig = f.original ?? f;
      change(key, { ...f, value: alt.value, state: "edited", line: alt.line, note: `Was ${fmt(key, orig.value)}, ${f.alternatives.find((a) => a.value === orig.value)?.note || "what was read"}. You chose ${alt.note}.` }, `${FIELD_LABEL[key]} changed to ${fmt(key, alt.value)}.`);
    }
    if (act === "edit") { ui.selected = key; ui.editing = key; rerender(); }
    if (act === "cancel-edit") { ui.editing = null; rerender(); }
    if (act === "save-edit") saveEdit(root.querySelector("[data-edit-input]")?.value ?? root.querySelector('[data-dp-toggle="edit-date"]').textContent);
    if (act === "revert") revert(Number(data.idx));
    if (act === "learn-yes") {
      const rule = hooks.learnRule(r, doc.fields.category.value);
      // From here the value comes from the team rule, shown the same way as on any later receipt.
      doc.fields.category = { ...doc.fields.category, state: "rule", ruleText: rule.text };
      doc.learn = "saved";
      hooks.sync(r);
      rerender();
    }
    if (act === "learn-no") { doc.learn = "declined"; rerender(); }
    if (act === "rule-undo") change("category", { value: doc.fields.category.guess || "Travel", state: "guessed" }, "Team rule not used for this receipt.");
    if (act === "rule-change") toast("Changing rules comes in a later stage of the demo.", { duration: 3000 });
    if (act === "approve") hooks.approve(r, queue);
    if (act === "unapprove") hooks.unapprove(r);
    if (act === "skip") { const next = queue.ids.slice(pos + 1).find((x) => state.receipts.find((y) => y.id === x)?.status !== "approved"); location.hash = next ? `#/review/${next}` : "#/inbox"; }
  }

  function saveEdit(raw) {
    const key = ui.editing;
    if (!key) return;
    const f = doc.fields[key];
    let value = raw.trim();
    if (MONEY.includes(key)) value = Number(value.replace(/[^\d.]/g, "")) || 0;
    if (!value) { ui.editing = null; rerender(); return; }
    ui.editing = null;
    if (value === f.value) { rerender(); return; }
    const orig = f.original ?? f;
    change(key, { ...f, value, state: "edited", line: null, typed: true, note: `Was ${fmt(key, orig.value)}. You typed the new value.` }, `${FIELD_LABEL[key]} changed to ${fmt(key, value)}.`);
  }

  // Every change is recorded, so it can be reverted from the toast or from history.
  function change(key, next, message) {
    const prev = doc.fields[key];
    next.original = prev.original ?? strip(prev);
    if (prev.alternatives && !next.alternatives) next.alternatives = prev.alternatives;
    if (prev.reason && !next.reason) next.reason = prev.reason;
    if (key === "category" && !next.guess) next.guess = prev.guess || (prev.state === "guessed" ? prev.value : undefined);
    doc.fields[key] = next;
    doc.history = [...(doc.history || []), { key, from: prev, to: next }];
    if (key === "category" && learnable.includes(key) && next.state === "edited" && !doc.learn) doc.learn = "asking";
    hooks.sync(r);
    rerender();
    const idx = doc.history.length - 1;
    toast(message, { undo: () => revert(idx) });
  }

  function revert(idx) {
    const entry = doc.history?.[idx];
    if (!entry) return;
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    doc.fields[entry.key] = entry.from;
    doc.history = doc.history.filter((_, i) => i !== idx);
    if (entry.key === "category" && doc.learn === "asking") doc.learn = null;
    hooks.sync(r);
    if (location.hash === `#/review/${id}`) rerender();
  }
}

// ---------- Pieces ----------

function openable(state) {
  return state.receipts.filter((r) => r.status !== "failed" && !r.problem && !r.slow && !state.reading.has(r.id) && state.docs[r.id]).map((r) => r.id);
}

function strip(f) {
  const { original, ...rest } = f;
  return rest;
}

// The line a field's current value came from. Typed values have no source, so nothing is highlighted.
function sourceLine(doc, key) {
  if (!key) return null;
  const f = doc.fields[key];
  if (!f || f.typed || f.state === "entered") return null;
  if (key === "category") return doc.lines.find((l) => l.src === "vendor") || null;
  if (f.line) return doc.lines.find((l) => l.id === f.line) || null;
  return doc.lines.find((l) => l.src === key) || null;
}

function receipt(doc, ui) {
  if (doc.photo) return `<div class="photo-block" role="img" aria-label="${escapeHtml(doc.photo)}"><span class="t-overline">Photo</span><span>${escapeHtml(doc.photo)}</span></div>`;
  const sources = new Map();
  for (const k of FIELD_ORDER) {
    if (!doc.fields[k] || k === "category") continue;
    const l = sourceLine(doc, k);
    if (l) sources.set(l, k);
  }
  const selected = sourceLine(doc, ui.selected);

  const rows = doc.lines.map((l) => {
    if (l.kind === "divider") return `<hr class="rcpt__rule">`;
    const key = sources.get(l);
    const cls = ["rcpt__line", l.kind && `rcpt__line--${l.kind}`, l.small && "rcpt__line--small", key && "is-read", l === selected && "is-selected"].filter(Boolean).join(" ");
    const attrs = key ? ` data-line-field="${key}" role="button" tabindex="-1" title="${FIELD_LABEL[key]}"` : "";
    const inner = l.kind === "title"
      ? `<span>${escapeHtml(l.text)}</span>`
      : `<span>${escapeHtml(l.left || "")}</span>${l.right ? `<span>${escapeHtml(l.right)}</span>` : ""}`;
    return `<div class="rcpt__row${l.kind === "title" || !l.right ? " rcpt__row--fit" : ""}"><div class="${cls}"${attrs}>${inner}</div></div>`;
  }).join("");

  return `<article class="rcpt">${rows}</article>`;
}

function field(key, doc, ui, r, state) {
  const f = doc.fields[key];
  const selected = ui.selected === key;
  const editing = ui.editing === key;
  const hasSource = !!sourceLine(doc, key) && !(key === "category" && f.state === "guessed" && !selected);
  const strip = hasSource ? (selected ? "is-full" : "is-soft") : "is-none";
  const mono = key !== "vendor" && key !== "category";

  let tag = "";
  if (f.state === "check") tag = `<span class="tag tag--check">Check this</span>`;
  else if (f.state === "confirmed") tag = `<span class="tag">Confirmed</span>`;
  else if (f.state === "rule") tag = `<span class="tag">Team rule</span>`;
  else if (f.state === "edited") tag = `<span class="field__meta">Edited by you</span>`;
  else if (f.state === "entered") tag = `<span class="field__meta">Entered by you</span>`;
  else if (f.state === "guessed") tag = `<span class="field__meta">Based on vendor</span>`;

  const chevron = f.state === "check" ? `<span class="field__chev">${icon(selected ? "chevronUp" : "chevronDown", 18, 1.9)}</span>` : "";

  const value = editing && key === "date"
    ? dateField({ name: "edit-date", value: f.value })
    : editing
    ? (key === "category"
        ? categorySelect(f.value)
        : `<input class="minput${mono ? " minput--mono" : ""}" data-edit-input value="${escapeHtml(MONEY.includes(key) ? String(f.value) : f.value)}" aria-label="${FIELD_LABEL[key]}">`)
    : `<span class="field__value${mono ? " field__value--mono" : ""}">${escapeHtml(fmt(key, f.value))}</span>`;

  let body = "";
  if (f.state === "check" && selected) {
    body += `<p class="field__reason">${escapeHtml(f.reason)}</p>`;
    {
      if (f.alternatives?.length > 1) {
        body += `<div class="alts"><span class="alts__label">Other reading</span>${f.alternatives.map((a, i) =>
          `<button type="button" class="alt${a.value === f.value ? " is-on" : ""}" data-act="alt" data-key="${key}" data-alt="${i}">${escapeHtml(fmt(key, a.value))}</button>`).join("")}</div>`;
      }
      body += editing
        ? editButtons()
        : `<div class="field__actions">${button({ label: `Confirm ${fmt(key, f.value)}`, iconName: "check", variant: "primary", attrs: `data-act="confirm" data-key="${key}"` })}${button({ label: "Edit", iconName: "edit", attrs: `data-act="edit" data-key="${key}"` })}</div>`;
    }
  } else if (selected) {
    if (f.note) body += `<p class="field__note">${escapeHtml(f.note)}</p>`;
    if (f.state === "rule") {
      body += `<p class="field__reason">${escapeHtml(f.ruleText)}</p>
        <div class="field__actions field__actions--small field__actions--rule">
          <button type="button" class="btn btn--xs" data-act="rule-change">${icon("edit", 14)}<span>Change rule</span></button>
          <button type="button" class="btn btn--xs" data-act="rule-undo">${icon("undo", 14)}<span>Undo for this receipt</span></button>
        </div>`;
    } else if (key === "category" && !editing && doc.learn !== "asking") {
      if (f.state === "guessed") body += `<p class="field__note">Based on the vendor name, ${escapeHtml(doc.fields.vendor.value)}.</p>`;
      body += `<div class="field__actions field__actions--small">${categorySelect(f.value)}</div>`;
    } else if (editing) {
      body += editButtons();
    } else if (f.state !== "check" && r.status !== "approved" && key !== "category") {
      // Edited values stay editable. History's Revert is a shortcut, not the only way to change it again.
      body += `<div class="field__actions field__actions--small"><button type="button" class="btn btn--xs" data-act="edit" data-key="${key}">${icon("edit", 14)}<span>Edit</span></button></div>`;
    }
  }

  if (key === "category" && doc.learn === "asking") body += learnInset(doc, state);

  const cls = ["field", `field--${f.state}`, selected && "is-selected", body && selected && "is-open"].filter(Boolean).join(" ");
  return `
    <div class="${cls}" data-field="${key}" tabindex="0" aria-expanded="${selected}">
      <div class="field__row">
        <span class="field__strip ${strip}"></span>
        <span class="field__label">${FIELD_LABEL[key]}</span>
        ${value}
        ${tag}
        ${chevron}
      </div>
      ${body}
    </div>`;
}

function editButtons() {
  return `<div class="field__actions field__actions--edit">
    <button type="button" class="btn btn--xs btn--primary" data-act="save-edit">${icon("check", 14)}<span>Save</span></button>
    <button type="button" class="btn btn--xs" data-act="cancel-edit"><span>Cancel</span></button>
  </div>`;
}

function categorySelect(value) {
  return `<span class="select select--inline"><select class="select__control" data-category aria-label="Category">
    ${categories.map((c) => `<option ${c === value ? "selected" : ""}>${c}</option>`).join("")}
  </select>${icon("chevronDown", 16, 1.6)}</span>`;
}

function learnInset(doc, state) {
  const vendor = doc.fields.vendor.value;
  const cat = doc.fields.category.value;
  return `
    <div class="inset inset--learn">
      <strong>Use ${escapeHtml(cat)} for all ${escapeHtml(vendor)} receipts?</strong>
      <p>Saved to ${escapeHtml(state.workspaceName)}, so it's filled in for anyone on the team. Remove it any time in Learned rules.</p>
      <div class="field__actions">
        ${button({ label: "Yes, always", iconName: "check", variant: "primary", attrs: 'data-act="learn-yes"' })}
        ${button({ label: "Just this one", attrs: 'data-act="learn-no"' })}
      </div>
    </div>`;
}

function historyInset(history) {
  return `
    <div class="inset inset--history">
      <span class="t-overline muted">History</span>
      ${history.map((h, i) => ({ h, i })).reverse().map(({ h, i }) => `
        <div class="history__row">
          <span>${FIELD_LABEL[h.key]}  ${escapeHtml(describe(h.key, h.from))} → ${escapeHtml(describe(h.key, h.to))}, by you, just now</span>
          <button type="button" class="btn btn--revert" data-act="revert" data-idx="${i}">${icon("undo", 12)}<span>Revert</span></button>
        </div>`).join("")}
    </div>`;
}

function describe(key, f) {
  if (f.state === "confirmed") return `${fmt(key, f.value)} confirmed`;
  return fmt(key, f.value);
}
