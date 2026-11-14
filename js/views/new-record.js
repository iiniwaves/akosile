import { icon } from "../icons.js";
import { naira, escapeHtml } from "../format.js";
import { button, toast, backTitle } from "../ui.js";
import { categories, noReceiptReasons } from "../data.js";
import { dateField, handleDatePicker } from "../datepicker.js";

// For cash payments and lost receipts. Same layout as review, but the photo slot is empty
// and there's one extra required field: why there's no receipt.
export function renderNewRecord(root, state, { onSave, learnRule }) {
  const draft = state.draft ||= { reason: "Paid cash", vendor: "Mama Put, Yaba", date: "13 Nov 2026", total: "6500", category: "" };

  root.innerHTML = `
    <header class="page-head page-head--detail">
      ${backTitle("Inbox", "#/inbox", draft.vendor || "New record")}
    </header>

    <div class="split">
      <section class="doc-area" aria-label="Receipt">
        <div class="photo-slot">
          <span class="doc-placeholder" style="width:40px;height:52px" aria-hidden="true"></span>
          <h2>No receipt photo</h2>
          <p>You can upload one later, or forward the email receipt.</p>
          <div class="photo-slot__actions">
            ${button({ label: "Upload a photo", iconName: "upload", attrs: 'data-action="photo"' })}
            ${button({ label: "Forward email", iconName: "mail", attrs: 'data-action="email"' })}
          </div>
        </div>
      </section>

      <form class="fields-panel" data-form novalidate>
        <div class="fields-panel__head">
          <h2>Add a record without a receipt</h2>
          <p>Fill in what you know. Total, date and a reason are required.</p>
        </div>

        <div class="mfield" data-field="reason">
          <div class="mfield__row">
            <span class="mfield__strip"></span>
            <span class="mfield__label" id="lbl-reason">Reason *</span>
            <div class="chips" role="radiogroup" aria-labelledby="lbl-reason">
              ${noReceiptReasons.map((r) => `<button type="button" class="chip${draft.reason === r ? " is-on" : ""}" role="radio" aria-checked="${draft.reason === r}" data-reason="${r}">${r}</button>`).join("")}
            </div>
          </div>
        </div>

        <label class="mfield" data-field="vendor">
          <span class="mfield__row">
            <span class="mfield__strip"></span>
            <span class="mfield__label">Vendor</span>
            <input class="minput" name="vendor" value="${escapeHtml(draft.vendor)}" placeholder="Who you paid" autocomplete="off">
          </span>
        </label>

        <div class="mfield" data-field="date">
          <span class="mfield__row">
            <span class="mfield__strip"></span>
            <span class="mfield__label">Date *</span>
            ${dateField({ name: "date", value: draft.date })}
          </span>
        </div>

        <label class="mfield" data-field="total">
          <span class="mfield__row">
            <span class="mfield__strip"></span>
            <span class="mfield__label">Total *</span>
            <input class="minput minput--mono" name="total" inputmode="decimal" value="${draft.total ? naira(Number(draft.total)) : ""}" placeholder="₦0.00" autocomplete="off">
          </span>
        </label>

        <div class="mfield" data-field="category">
          <label class="mfield__row">
            <span class="mfield__strip"></span>
            <span class="mfield__label">Category</span>
            <span class="select">
              <select name="category" class="select__control${draft.category ? "" : " is-empty"}">
                <option value="" ${draft.category ? "" : "selected"} disabled>Choose a category</option>
                ${categories.map((c) => `<option ${c === draft.category ? "selected" : ""}>${c}</option>`).join("")}
              </select>
              ${icon("chevronDown", 16, 1.6)}
            </span>
          </label>
          ${draft.learn === "asking" && draft.category && draft.vendor.trim()
            ? `<div class="inset inset--learn">
                <strong>Use ${escapeHtml(draft.category)} for all ${escapeHtml(draft.vendor.trim())} receipts?</strong>
                <p>Saved to ${escapeHtml(state.workspaceName)}, so it's filled in for anyone on the team. Remove it any time in Learned rules.</p>
                <div class="field__actions">
                  ${button({ label: "Yes, always", iconName: "check", variant: "primary", attrs: 'data-learn="yes"' })}
                  ${button({ label: "Just this one", attrs: 'data-learn="no"' })}
                </div>
              </div>`
            : draft.learn === "saved"
            ? `<p class="mfield__note">Saved as a team rule: ${escapeHtml(draft.vendor.trim())} is always ${escapeHtml(draft.category)}.</p>`
            : `<p class="mfield__note">No team rule for this vendor yet. Pick one and the AI will ask if it should remember it.</p>`}
        </div>

        <div class="fields-panel__spacer"></div>

        <p class="inset">This record will show <strong>No receipt</strong> in the inbox and in the report, so finance can follow up if they need to.</p>

        <div class="fields-panel__actions">
          ${button({ label: "Save and approve", iconName: "check", variant: "primary", attrs: 'type="submit" data-save="approve"' })}
          ${button({ label: "Save for later", iconName: "clock", attrs: 'data-save="later"' })}
        </div>
      </form>
    </div>
  `;

  const form = root.querySelector("[data-form]");
  const title = root.querySelector("[data-title]");
  const saveBtns = [...root.querySelectorAll("[data-save]")];

  const parseTotal = (v) => Number(String(v).replace(/[^\d.]/g, "")) || 0;
  const valid = () => draft.reason && draft.date && parseTotal(draft.total) > 0;
  const sync = () => saveBtns.forEach((b) => (b.disabled = !valid()));
  sync();

  root.onclick = (e) => {
    if (handleDatePicker(e, root, (name, value) => { draft[name] = value; sync(); })) return;
    const learn = e.target.closest("[data-learn]");
    if (learn) {
      if (learn.dataset.learn === "yes") learnRule(draft.category, draft.vendor.trim());
      draft.learn = learn.dataset.learn === "yes" ? "saved" : "declined";
      renderNewRecord(root, state, { onSave, learnRule });
      return;
    }
    const chip = e.target.closest("[data-reason]");
    if (chip) {
      draft.reason = chip.dataset.reason;
      root.querySelectorAll("[data-reason]").forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-checked", on);
      });
      sync();
    }
    const act = e.target.closest("[data-action]");
    if (act) toast("Uploading a photo isn't part of this demo.", { duration: 3000 });
    const save = e.target.closest("[data-save]");
    if (save && !save.disabled) { e.preventDefault(); save.dataset.save === "approve" ? commit(true) : commit(false); }
  };

  form.oninput = (e) => {
    const { name, value } = e.target;
    if (name === "vendor") { draft.vendor = value; title.textContent = value || "New record"; }
    if (name === "total") draft.total = value;
    sync();
  };
  form.onchange = (e) => {
    const { name, value } = e.target;
    if (name === "date") draft.date = value;
    if (name === "category") {
      draft.category = value;
      // Choosing a category by hand always offers to remember it for this vendor.
      draft.learn = draft.vendor.trim() ? "asking" : null;
      renderNewRecord(root, state, { onSave, learnRule });
    }
  };
  form.total.addEventListener("focus", (e) => { e.target.value = draft.total ? String(parseTotal(draft.total)) : ""; });
  form.total.addEventListener("blur", (e) => { const n = parseTotal(e.target.value); draft.total = n ? String(n) : ""; e.target.value = n ? naira(n) : ""; sync(); });
  form.onsubmit = (e) => e.preventDefault();

  function commit(approve) {
    const record = {
      id: "manual-" + Date.now(),
      manual: true,
      vendor: draft.vendor.trim() || "No vendor",
      place: `No receipt · ${draft.reason}`,
      date: draft.date,
      category: draft.category || null,
      total: parseTotal(draft.total),
      status: approve ? "approved" : "ready",
    };
    state.draft = null;
    onSave(record);
  }
}
