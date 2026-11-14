import { icon } from "./icons.js";

// A calendar for date fields. Receipts can't be from the future, so days after today are disabled.
// Views call handleDatePicker first in their click handler; it returns true when it used the click.

export const TODAY = new Date(2026, 10, 14);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const formatDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export function parseDate(text) {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(text || "");
  return m ? new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])) : null;
}

// The trigger looks like a select, so date fields line up with the other dropdowns.
export function dateField({ name, value = "", placeholder = "Choose a date" }) {
  return `
    <span class="select datepick">
      <button type="button" class="select__control select__control--mono datepick__trigger${value ? "" : " is-empty"}" data-dp-toggle="${name}" aria-haspopup="dialog" aria-expanded="false">${value || placeholder}</button>
      ${icon("chevronDown", 16, 1.6)}
    </span>`;
}

let open = null; // { name, month: Date, trigger }

function render(panel) {
  panel.querySelector(".dp")?.remove();
  if (!open) return;
  const { month, name } = open;
  const selected = parseDate(open.trigger.dataset.value || open.trigger.textContent.trim());
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(1 - ((start.getDay() + 6) % 7)); // weeks start on Monday
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const other = d.getMonth() !== month.getMonth();
    const future = d > TODAY;
    const isSel = selected && d.getTime() === selected.getTime();
    const isToday = d.getTime() === TODAY.getTime();
    const cls = ["dp__day", other && "is-other", isSel && "is-selected", isToday && "is-today"].filter(Boolean).join(" ");
    days.push(`<button type="button" class="${cls}" data-dp-day="${formatDate(d)}" ${future ? "disabled" : ""} aria-label="${formatDate(d)}">${d.getDate()}</button>`);
  }
  const atLatest = month.getFullYear() === TODAY.getFullYear() && month.getMonth() === TODAY.getMonth();

  const t = open.trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "dp";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", `Pick a date for ${name}`);
  el.style.top = `${t.bottom - p.top + panel.scrollTop + 2}px`;
  el.innerHTML = `
    <div class="dp__head">
      <strong>${MONTHS_LONG[month.getMonth()]} ${month.getFullYear()}</strong>
      <div class="dp__nav">
        <button type="button" class="dp__navbtn" data-dp-move="-1" aria-label="Previous month">${icon("chevronLeft", 14)}</button>
        <button type="button" class="dp__navbtn" data-dp-move="1" aria-label="Next month" ${atLatest ? "disabled" : ""}>${icon("chevronRight", 14)}</button>
      </div>
    </div>
    <div class="dp__week">${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="dp__days">${days.join("")}</div>`;
  panel.appendChild(el);
}

function close(panel) {
  if (open) open.trigger.setAttribute("aria-expanded", "false");
  open = null;
  panel?.querySelector(".dp")?.remove();
}

export function handleDatePicker(e, root, onPick) {
  const panel = root.querySelector(".fields-panel");
  if (open && !open.trigger.isConnected) open = null;
  const toggle = e.target.closest("[data-dp-toggle]");
  if (toggle) {
    if (open?.trigger === toggle) { close(panel); return true; }
    const sel = parseDate(toggle.textContent.trim()) || TODAY;
    open = { name: toggle.dataset.dpToggle, month: new Date(sel.getFullYear(), sel.getMonth(), 1), trigger: toggle };
    toggle.setAttribute("aria-expanded", "true");
    render(panel);
    return true;
  }
  if (!open) return false;
  const move = e.target.closest("[data-dp-move]");
  if (move) {
    open.month = new Date(open.month.getFullYear(), open.month.getMonth() + Number(move.dataset.dpMove), 1);
    render(panel);
    return true;
  }
  const day = e.target.closest("[data-dp-day]");
  if (day && !day.disabled) {
    const { name, trigger } = open;
    trigger.textContent = day.dataset.dpDay;
    trigger.classList.remove("is-empty");
    close(panel);
    trigger.focus();
    onPick(name, day.dataset.dpDay);
    return true;
  }
  if (e.target.closest(".dp")) return true;
  close(panel);
  return false;
}

export function closeDatePicker(root) {
  close(root.querySelector(".fields-panel"));
}
