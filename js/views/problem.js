import { icon } from "../icons.js";
import { naira, escapeHtml } from "../format.js";
import { button, toast, backTitle, pickFile } from "../ui.js";
import { categories } from "../data.js";
import { dateField, handleDatePicker } from "../datepicker.js";

// When reading goes wrong. Each screen says what couldn't be read, keeps what was read,
// and hands off with a clear next step. Nothing is removed unless a person chooses to.

const KINDS = ["unreadable", "partial", "notReceipt", "duplicate"];

// The receipts that need a person, in inbox order.
export function problemQueue(state) {
  return state.receipts.filter((r) => KINDS.includes(r.problem) && !state.reading.has(r.id)).map((r) => r.id);
}

const parseMoney = (v) => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;

export function renderProblem(root, state, id, hooks, mode) {
  const r = state.receipts.find((x) => x.id === id);
  const doc = state.docs[id];
  if (!r || !doc || !r.problem) { location.hash = "#/inbox"; return; }
  const view = mode === "enter" ? "enter" : r.problem;

  const ids = problemQueue(state);
  const pos = ids.indexOf(id);

  // Typed values and field selection survive a re-render.
  const form = state.problemDraft?.id === id && state.problemDraft.view === view
    ? state.problemDraft
    : (state.problemDraft = { id, view, vendor: "", date: "", total: "", tax: "", category: "", edits: {}, sel: null, editing: null, learn: null, rule: null, workspace: state.workspaceName });

  const screen = {
    unreadable: unreadable,
    partial: partial,
    notReceipt: notReceipt,
    duplicate: duplicate,
    enter: enter,
  }[view](r, doc, state, form);

  root.innerHTML = `
    <header class="page-head page-head--detail">
      ${backTitle("Inbox", "#/inbox", r.vendor)}
      <nav class="pager" aria-label="Move between receipts">
        <div class="page-head__actions">
          ${button({ label: "Previous", iconName: "chevronLeft", attrs: `data-go="${ids[pos - 1] || ""}" ${pos > 0 ? "" : "disabled"}` })}
          <button type="button" class="btn" data-go="${ids[pos + 1] || ""}" ${pos > -1 && pos < ids.length - 1 ? "" : "disabled"}><span>Next</span>${icon("chevronRight", 14)}</button>
        </div>
        <span class="pager__caption">Receipt ${pos + 1} of ${ids.length} that need you</span>
      </nav>
    </header>

    <div class="split">
      <section class="doc-area doc-area--top${view === "duplicate" ? " doc-area--pair" : ""}" aria-label="Receipt">${screen.doc}</section>
      <section class="fields-panel" aria-label="What was read">
        <div class="fields-panel__head">
          <h2>${screen.title}</h2>
          <p>${screen.sub}</p>
        </div>
        ${screen.body}
        <div class="fields-panel__actions">${screen.actions}</div>
      </section>
    </div>
  `;

  root.onclick = (e) => {
    if (handleDatePicker(e, root, pickedDate)) return;
    const go = e.target.closest("[data-go]");
    if (go) { if (go.dataset.go) location.hash = `#/review/${go.dataset.go}`; return; }
    const line = e.target.closest("[data-line-field]");
    if (line) { pick(line.dataset.lineField); return; }
    const act = e.target.closest("[data-act]");
    if (!act) {
      const f = e.target.closest("[data-pick]");
      if (f && !e.target.closest("input, select, button")) pick(form.sel === f.dataset.pick && !form.editing ? null : f.dataset.pick);
      return;
    }
    if (act.disabled) return;
    const a = act.dataset.act;
    if (a === "reread") pickFile(() => hooks.reread(id));
    if (a === "enter") location.hash = `#/review/${id}/enter`;
    if (a === "remove") hooks.remove(r);
    if (a === "keep-both") hooks.keepBoth(r);
    if (a === "zoom") toast("Zooming in isn't part of this demo.", { duration: 3000 });
    if (a === "save-partial") hooks.savePartial(r, { total: parseMoney(form.total), tax: parseMoney(form.tax), edits: form.edits, rule: form.learn === "saved" ? form.rule : null });
    if (a === "edit") { form.sel = act.dataset.key; form.editing = act.dataset.key; rerender(); }
    if (a === "cancel-edit") { form.editing = null; rerender(); }
    if (a === "save-edit") saveEdit();
    if (a === "learn-yes") {
      const vendor = view === "enter" ? form.vendor.trim() : currentValue(doc, form, "vendor");
      const category = view === "enter" ? form.category : form.edits.category;
      form.rule = hooks.learnRule(r, category, vendor);
      form.learn = "saved";
      if (view === "enter") form.category = "";
      else delete form.edits.category;
      rerender();
    }
    if (a === "learn-no") { form.learn = "declined"; rerender(); }
    if (a === "save-entered" || a === "save-later") {
      const rule = matchRule();
      hooks.saveEntered(r, {
        vendor: form.vendor.trim(), date: form.date, total: parseMoney(form.total), tax: parseMoney(form.tax),
        category: form.category || (rule ? rule.value : ""), rule: !form.category && rule ? rule : null,
      }, a === "save-entered");
    }
  };


  const matchRule = () => {
    const v = form.vendor.trim().toLowerCase();
    return v ? hooks.rules().find((x) => x.field === "category" && v.startsWith(x.vendor.toLowerCase())) : null;
  };

  const refresh = () => {
    if (view === "partial") {
      root.querySelector('[data-act="save-partial"]').disabled = !parseMoney(form.total);
      for (const k of ["total", "tax"]) {
        const slot = root.querySelector(`[data-meta="${k}"]`);
        if (slot) slot.innerHTML = form[k] ? `<span class="field__meta">Entered by you</span>` : `<span class="tag tag--quiet">Not found</span>`;
      }
    }
    if (view === "enter") {
      const ok = form.date && parseMoney(form.total) > 0;
      root.querySelectorAll('[data-act="save-entered"], [data-act="save-later"]').forEach((b) => (b.disabled = !ok));
      for (const k of ["vendor", "date", "total"]) {
        const slot = root.querySelector(`[data-meta="${k}"]`);
        if (slot) slot.innerHTML = form[k] && document.activeElement?.name !== k ? `<span class="field__meta">Entered by you</span>` : "";
      }
      // A team rule fills the category as soon as the vendor matches, and says so.
      const rule = matchRule();
      const cat = root.querySelector("[data-cat]");
      if (cat) {
        const auto = !form.category && rule;
        const select = cat.querySelector("select");
        if (auto) { select.value = rule.value; select.classList.remove("is-empty"); }
        else if (!form.category) { select.value = ""; select.classList.add("is-empty"); }
        cat.querySelector("[data-rule-tag]").hidden = !auto;
        const note = cat.querySelector("[data-rule-note]");
        note.hidden = !auto;
        if (auto) note.textContent = `From a ${state.workspaceName} rule: ${rule.vendor} is always ${rule.value}. Filled in because you typed the vendor.`;
      }
    }
  };

  // Fields the AI did read can still be wrong, so each one can be selected, traced to the photo and edited.
  const rerender = () => {
    renderProblem(root, state, id, hooks, mode);
    root.querySelector("[data-edit-input]")?.focus();
  };
  function pickedDate(name, value) {
    if (name === "edit-date") return; // committed by Save, like a typed edit
    form[name] = value;
    refresh();
  }
  function pick(key) { form.sel = key; form.editing = null; rerender(); }
  function saveEdit() {
    const input = root.querySelector("[data-edit-input]");
    const value = (input ? input.value : root.querySelector('[data-dp-toggle="edit-date"]')?.textContent || "").trim();
    const key = form.editing;
    form.editing = null;
    if (key && value && value !== currentValue(doc, form, key)) {
      form.edits[key] = value;
      toast(`${LABEL[key]} changed to ${value}.`, { duration: 3000 });
    }
    rerender();
  }

  root.oninput = (e) => {
    const { name, value } = e.target;
    if (!name || !(name in form)) return;
    form[name] = value;
    refresh();
  };
  root.onchange = (e) => {
    if (e.target.matches("[data-pick-category]")) {
      if (e.target.value === doc.fields.category.value) delete form.edits.category;
      else form.edits.category = e.target.value;
      // Choosing a category by hand always offers to remember it for this vendor.
      form.learn = form.edits.category ? "asking" : null;
      toast(`Category changed to ${e.target.value}.`, { duration: 3000 });
      rerender();
      return;
    }
    const { name, value } = e.target;
    if (!name || !(name in form)) return;
    form[name] = value;
    e.target.classList.remove("is-empty");
    if (name === "category" && view === "enter") {
      form.learn = form.vendor.trim() ? "asking" : null;
      rerender();
      return;
    }
    refresh();
  };
  // Amounts are typed as plain numbers and shown as naira once you leave the field.
  root.querySelectorAll("input[name], select[name]").forEach((el) => {
    const money = ["total", "tax"].includes(el.name);
    el.addEventListener("focus", () => {
      if (money) el.value = form[el.name] ? String(parseMoney(form[el.name])) : "";
      refresh();
    });
    el.addEventListener("blur", () => {
      if (money) {
        const n = parseMoney(el.value);
        form[el.name] = n ? String(n) : "";
        el.value = n ? naira(n) : "";
      }
      setTimeout(refresh);
    });
  });
  root.onkeydown = (e) => {
    if (e.target.matches("[data-edit-input]")) {
      if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
      if (e.key === "Escape") { form.editing = null; rerender(); }
      return;
    }
    if (e.key === "Escape" && form.sel) { pick(null); return; }
    if (e.key === "Enter" && e.target.matches("input")) e.target.blur();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-pick]")) { e.preventDefault(); pick(e.target.dataset.pick); }
  };

  // Restore what was typed before a re-render.
  root.querySelectorAll("input[name], select[name]").forEach((el) => {
    const v = form[el.name];
    if (!v) return;
    el.value = ["total", "tax"].includes(el.name) ? naira(parseMoney(v)) : v;
    el.classList.remove("is-empty");
  });
  refresh();
}

// ---------- Screens ----------

function unreadable(r, doc) {
  return {
    doc: paper(doc),
    title: "Couldn't read this one",
    sub: "The photo is too blurry to pick out the text.",
    body: `
      <p class="inset inset--pad">Nothing was saved from this photo. It stays here until you upload a new one or remove it.</p>
      <div class="inset inset--pad inset--tip">
        <span class="t-overline muted">For a clearer photo</span>
        <p>Lay the receipt flat, use good light, and fit the whole thing in the frame.</p>
      </div>
      <div class="fields-panel__spacer"></div>`,
    actions: `
      ${button({ label: "Upload again", iconName: "retry", variant: "primary", attrs: 'data-act="reread"' })}
      ${button({ label: "Enter it myself", iconName: "pen", attrs: 'data-act="enter"' })}`,
  };
}

function partial(r, doc, state, form) {
  const sel = form.edits[form.sel] ? null : form.sel === "category" ? "vendor" : form.sel;
  return {
    doc: `
      <div class="crop">${paper(doc, { highlight: true, selected: sel, edited: form.edits })}</div>
      <span class="crop__edge" aria-hidden="true"></span>
      <p class="doc-caption">The photo ends here</p>`,
    title: "Read 3 of 5 fields",
    sub: "Please fill in the rest. The bottom of the receipt is cut off in the photo.",
    body: `
      ${readField("vendor", doc, form)}
      ${readField("date", doc, form)}
      ${missingField("total", "Total", "Add total")}
      ${missingField("tax", "Tax", "Add tax")}
      ${readField("category", doc, form)}
      <div class="fields-panel__spacer"></div>`,
    actions: `
      ${button({ label: "Save", iconName: "check", variant: "primary", attrs: 'data-act="save-partial" disabled' })}
      ${button({ label: "Upload a better photo", iconName: "upload", attrs: 'data-act="reread"' })}`,
  };
}

function notReceipt(r, doc) {
  return {
    doc: photo(doc),
    title: "This doesn't look like a receipt or invoice",
    sub: "Nothing was taken from it.",
    body: `<div class="fields-panel__spacer"></div>`,
    actions: `
      ${button({ label: "Remove", iconName: "trash", attrs: 'data-act="remove"' })}
      ${button({ label: "Keep and enter manually", iconName: "pen", attrs: 'data-act="enter"' })}`,
  };
}

function duplicate(r, doc) {
  const f = doc.fields;
  const row = (label, value) => `<span class="t-overline muted">${label}</span><span class="match__value">${escapeHtml(value)}</span><span class="match__tag">Match</span>`;
  return {
    doc: `
      <div class="pair"><span class="t-overline muted">New upload</span>${paper(doc, { highlight: true, narrow: true })}</div>
      <div class="pair"><span class="t-overline muted">Already in your records, 12 Nov</span>${paper(doc, { highlight: true, narrow: true })}</div>`,
    title: `Looks like a copy of ${escapeHtml(f.vendor.value)}, 12 Nov`,
    sub: "Vendor, date and total all match a receipt you already have.",
    body: `
      <div class="inset inset--pad match">
        ${row("Vendor", f.vendor.value)}
        ${row("Date", f.date.value)}
        ${row("Total", naira(f.total.value))}
      </div>
      <p class="fields-panel__note">Nothing is removed unless you choose to.</p>
      <div class="fields-panel__spacer"></div>`,
    actions: `
      ${button({ label: "Remove this one", iconName: "trash", variant: "primary", attrs: 'data-act="remove"' })}
      ${button({ label: "Keep both", iconName: "copy", attrs: 'data-act="keep-both"' })}`,
  };
}

// Nothing could be read, so a person types it in. The photo stays attached as proof.
function enter(r, doc, state, form) {
  const learn = form.learn === "asking" && form.category && form.vendor.trim()
    ? learnInset(form.category, form.vendor.trim(), state.workspaceName) : "";
  return {
    doc: `
      ${doc.photo ? photo(doc) : paper(doc)}
      <div class="doc-actions">
        ${button({ label: "Zoom in", iconName: "zoomIn", attrs: 'data-act="zoom"' })}
        ${button({ label: "Replace photo", iconName: "image", attrs: 'data-act="reread"' })}
      </div>
      <p class="doc-caption">The photo stays attached as proof, even when it can't be read.</p>`,
    title: "Enter it yourself",
    sub: "Nothing could be read from this photo, so every field starts empty. Only total and date are required.",
    body: `
      <label class="mfield mfield--tight">
        <span class="mfield__row">
          <span class="mfield__strip"></span>
          <span class="mfield__label">Vendor</span>
          <input class="minput" name="vendor" placeholder="Who you paid" autocomplete="off">
          <span class="mfield__meta" data-meta="vendor"></span>
        </span>
      </label>
      <label class="mfield mfield--tight">
        <span class="mfield__row">
          <span class="mfield__strip"></span>
          <span class="mfield__label">Date *</span>
          ${dateField({ name: "date", value: form.date })}
          <span class="mfield__meta" data-meta="date"></span>
        </span>
      </label>
      <label class="mfield mfield--tight">
        <span class="mfield__row">
          <span class="mfield__strip"></span>
          <span class="mfield__label">Total *</span>
          <input class="minput minput--mono" name="total" inputmode="decimal" placeholder="₦0.00" autocomplete="off">
          <span class="mfield__meta" data-meta="total"></span>
        </span>
      </label>
      <label class="mfield mfield--tight">
        <span class="mfield__row">
          <span class="mfield__strip"></span>
          <span class="mfield__label">Tax</span>
          <input class="minput minput--missing" name="tax" inputmode="decimal" placeholder="Add tax (optional)" autocomplete="off">
        </span>
      </label>
      <div class="mfield mfield--tight" data-cat>
        <label class="mfield__row">
          <span class="mfield__strip"></span>
          <span class="mfield__label">Category</span>
          <span class="select">
            <select name="category" class="select__control is-empty">
              <option value="" selected disabled>Choose a category</option>
              ${categories.map((c) => `<option>${c}</option>`).join("")}
            </select>
            ${icon("chevronDown", 16, 1.6)}
          </span>
          <span class="tag tag--rule" data-rule-tag hidden>Team rule</span>
        </label>
        <p class="mfield__note" data-rule-note hidden></p>
        ${learn}
      </div>
      <div class="fields-panel__spacer"></div>
      <p class="inset inset--tight">This receipt will show Entered by hand in the inbox and in the report.</p>`,
    actions: `
      ${button({ label: "Save and approve", iconName: "check", variant: "primary", attrs: 'data-act="save-entered" disabled' })}
      ${button({ label: "Save for later", iconName: "clock", attrs: 'data-act="save-later" disabled' })}`,
  };
}

// ---------- Pieces ----------

// Same prompt as on the review screen. Learning is never silent.
function learnInset(category, vendor, workspace) {
  return `
    <div class="inset inset--learn">
      <strong>Use ${escapeHtml(category)} for all ${escapeHtml(vendor)} receipts?</strong>
      <p>Saved to ${escapeHtml(workspace)}, so it's filled in for anyone on the team. Remove it any time in Learned rules.</p>
      <div class="field__actions">
        ${button({ label: "Yes, always", iconName: "check", variant: "primary", attrs: 'data-act="learn-yes"' })}
        ${button({ label: "Just this one", attrs: 'data-act="learn-no"' })}
      </div>
    </div>`;
}

const LABEL = { vendor: "Vendor", date: "Date", category: "Category" };
const currentValue = (doc, form, key) => form.edits[key] ?? doc.fields[key].value;

// A field the AI read. Same states as on the review screen: select to trace it, Edit to change it.
function readField(key, doc, form) {
  const ruleValue = key === "category" && form.learn === "saved" && !(key in form.edits) ? form.rule.value : null;
  const value = ruleValue ?? currentValue(doc, form, key);
  const edited = key in form.edits;
  const guessed = key === "category" && !edited && !ruleValue;
  const selected = form.sel === key;
  const editing = form.editing === key;
  const mono = key === "date";
  const strip = edited || guessed ? (selected && guessed ? "is-full" : "is-none") : selected ? "is-full" : "is-soft";
  const ruledMeta = key === "category" && form.learn === "saved" && !edited;
  const meta = ruledMeta ? `<span class="tag">Team rule</span>` : edited ? `<span class="field__meta">Edited by you</span>` : guessed ? `<span class="field__meta">Based on vendor</span>` : "";

  const valueHtml = editing && key === "date"
    ? dateField({ name: "edit-date", value })
    : editing
    ? `<input class="minput${mono ? " minput--mono" : ""}" data-edit-input value="${escapeHtml(value)}" aria-label="${LABEL[key]}">`
    : `<span class="field__value${mono ? " field__value--mono" : ""}">${escapeHtml(value)}</span>`;

  let body = "";
  const asking = key === "category" && form.learn === "asking" && edited;
  const ruled = key === "category" && form.learn === "saved" && !edited;
  if (asking) {
    body += `<p class="field__note">Was ${escapeHtml(doc.fields.category.value)}, guessed from the vendor name.</p>`;
    body += learnInset(value, currentValue(doc, form, "vendor"), form.workspace);
  } else if (ruled && selected) {
    body += `<p class="field__reason">${escapeHtml(form.rule.text)}</p>`;
  } else if (selected && key === "category") {
    if (guessed) body += `<p class="field__note">Based on the vendor name, ${escapeHtml(currentValue(doc, form, "vendor"))}.</p>`;
    body += `<div class="field__actions field__actions--small"><span class="select select--inline"><select class="select__control" data-pick-category aria-label="Category">
      ${categories.map((c) => `<option ${c === value ? "selected" : ""}>${c}</option>`).join("")}
    </select>${icon("chevronDown", 16, 1.6)}</span></div>`;
  } else if (editing) {
    body += `<div class="field__actions field__actions--edit">
      <button type="button" class="btn btn--xs btn--primary" data-act="save-edit">${icon("check", 14)}<span>Save</span></button>
      <button type="button" class="btn btn--xs" data-act="cancel-edit"><span>Cancel</span></button>
    </div>`;
  } else if (selected) {
    body += `<div class="field__actions field__actions--small"><button type="button" class="btn btn--xs" data-act="edit" data-key="${key}">${icon("edit", 14)}<span>Edit</span></button></div>`;
  }

  const open = selected || asking;
  const cls = ["field", edited ? "field--edited" : "field--ready", open && "is-selected", open && body && "is-open"].filter(Boolean).join(" ");
  return `
    <div class="${cls}" data-pick="${key}" tabindex="0" aria-expanded="${selected}">
      <div class="field__row">
        <span class="field__strip ${strip}"></span>
        <span class="field__label">${LABEL[key]}</span>
        ${valueHtml}
        ${meta}
      </div>
      ${body}
    </div>`;
}

function missingField(name, label, placeholder) {
  return `
    <label class="field field--static field--missing">
      <span class="field__row">
        <span class="field__strip is-none"></span>
        <span class="field__label">${label}</span>
        <input class="minput minput--missing" name="${name}" inputmode="decimal" placeholder="${placeholder}" autocomplete="off">
        <span data-meta="${name}"><span class="tag tag--quiet">Not found</span></span>
      </span>
    </label>`;
}

// The printed receipt. Marker yellow shows what was read; nothing here is clickable.
function paper(doc, { highlight = false, narrow = false, selected = null, edited = null } = {}) {
  const rows = doc.lines.map((l) => {
    if (l.kind === "divider") return `<hr class="rcpt__rule">`;
    const read = highlight && l.src && !(edited && l.src in edited);
    const isSel = read && selected === l.src;
    const cls = ["rcpt__line", l.kind && `rcpt__line--${l.kind}`, l.small && "rcpt__line--small", isSel ? "is-selected" : read && "is-marked"].filter(Boolean).join(" ");
    const attrs = edited && read ? ` data-line-field="${l.src}" role="button" tabindex="-1"` : "";
    const inner = l.kind === "title"
      ? `<span>${escapeHtml(l.text)}</span>`
      : `<span>${escapeHtml(l.left || "")}</span>${l.right ? `<span>${escapeHtml(l.right)}</span>` : ""}`;
    const fit = l.kind === "title" || !l.right;
    return `<div class="rcpt__row${fit ? " rcpt__row--fit" : ""}"><div class="${cls}"${attrs}>${inner}</div></div>`;
  }).join("");
  return `<article class="rcpt${narrow ? " rcpt--narrow" : ""}">${rows}</article>`;
}

function photo(doc) {
  return `
    <div class="photo-block" role="img" aria-label="${escapeHtml(doc.photo)}">
      <span class="t-overline">Photo</span>
      <span>${escapeHtml(doc.photo)}</span>
    </div>`;
}
