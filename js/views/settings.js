import { icon } from "../icons.js";
import { escapeHtml } from "../format.js";
import { toast } from "../ui.js";
import { people } from "../data.js";

// Workspace basics, the people in it, and how the AI behaves. The settings that protect trust are locked on.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const select = (name, options, value, { disabled = false, width } = {}) => `
  <span class="select${disabled ? " is-disabled" : ""}"${width ? ` style="width:${width}px"` : ""}>
    <select class="select__control" name="${name}" ${disabled ? "disabled" : ""}>
      ${options.map((o) => `<option ${o === value ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
    </select>${icon("chevronDown", 16, 1.6)}
  </span>`;

const toggle = (name, on, locked) => `
  <button type="button" class="switch${on ? " is-on" : ""}" role="switch" aria-checked="${on}" data-switch="${name}" ${locked ? 'disabled title="Always on"' : ""}><span></span></button>`;

const row = (title, sub, control, wide) => `
  <div class="setting${wide ? " setting--wide" : ""}">
    <div class="setting__text"><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ""}</div>
    ${control}
  </div>`;

export function renderSettings(root, state, { onRename }) {
  const s = (state.settings ||= { currency: "Naira (₦)", yearStart: "January", flagLevel: "Balanced", handwritten: true, roles: Object.fromEntries(people.map((p) => [p.initials, p.role])) });

  root.innerHTML = `
    <header class="page-head">
      <div class="page-head__title">
        <span class="t-overline muted">Settings  ·  ${escapeHtml(state.workspaceName)}</span>
        <h1 class="t-heading-lg t-heading-lg--plain">Settings</h1>
      </div>
    </header>

    <div class="settings">
      <div class="settings__col">
        <section class="card settings__card">
          <h2>Workspace</h2>
          ${row("Name", "", `<input class="text-input" name="workspace" value="${escapeHtml(state.workspaceName)}" aria-label="Workspace name" autocomplete="off">`)}
          ${row("Currency", "Every amount is shown with kobo.", select("currency", ["Naira (₦)"], s.currency, { width: 190 }))}
          ${row("Year starts in", "Sets the reports timeline.", select("yearStart", MONTHS, s.yearStart, { width: 190 }))}
        </section>

        <section class="card settings__card">
          <div class="settings__head"><h2>People</h2><button type="button" class="btn btn--sm" data-act="invite">${icon("pen", 14)}<span>Invite people</span></button></div>
          ${people.map((p) => `
            <div class="person">
              <span class="avatar avatar--person avatar--28">${p.initials}</span>
              <span class="person__text"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.detail)}</span></span>
              ${select(`role-${p.initials}`, ["Admin", "Member"], s.roles[p.initials], { disabled: p.locked, width: 120 })}
            </div>`).join("")}
        </section>
      </div>

      <div class="settings__col">
        <section class="card settings__card">
          <div class="settings__intro"><h2>How the AI behaves</h2><span>Applies to everyone in ${escapeHtml(state.workspaceName)}.</span></div>
          ${row("How often to flag", "Balanced flags a field when the AI is less than sure. Strict flags more, relaxed flags less.", select("flagLevel", ["Strict", "Balanced", "Relaxed"], s.flagLevel, { width: 190 }))}
          ${row("Always flag handwritten amounts", "Tips and corrected totals always get a second look.", toggle("handwritten", s.handwritten), true)}
          ${row("Show the reason for every flag", "Always on. A flag without a reason isn't useful.", toggle("reasons", true, true), true)}
          ${row("Ask before saving a rule", "Always on. Rules only save when someone says yes.", toggle("ask", true, true), true)}
          ${row("What the assistant can see", "Only this workspace's receipts and rules.", select("scope", ["This workspace"], "This workspace", { disabled: true, width: 190 }))}
          <div class="settings__foot"><a class="btn btn--sm" href="#/rules">${icon("rules", 14)}<span>Manage learned rules</span></a></div>
        </section>
      </div>
    </div>
  `;

  root.onclick = (e) => {
    const sw = e.target.closest("[data-switch]");
    if (sw && !sw.disabled) {
      s[sw.dataset.switch] = !s[sw.dataset.switch];
      sw.classList.toggle("is-on", s[sw.dataset.switch]);
      sw.setAttribute("aria-checked", s[sw.dataset.switch]);
      toast(s.handwritten ? "Handwritten amounts will always be flagged." : "Handwritten amounts will only be flagged when the AI is unsure.", { duration: 3000 });
    }
    if (e.target.closest('[data-act="invite"]')) toast("Inviting people isn't part of this demo.", { duration: 3000 });
  };
  root.onchange = (e) => {
    const { name, value } = e.target;
    if (name === "workspace") {
      const v = value.trim();
      if (v && v !== state.workspaceName) { onRename(v); toast(`Workspace renamed to ${v}.`, { duration: 3000 }); }
      else e.target.value = state.workspaceName;
      return;
    }
    if (name.startsWith("role-")) { s.roles[name.slice(5)] = value; toast(`${people.find((p) => p.initials === name.slice(5)).name} is now ${value === "Admin" ? "an admin" : "a member"}.`, { duration: 3000 }); return; }
    if (name in s) s[name] = value;
  };
  root.onkeydown = (e) => { if (e.key === "Enter" && e.target.name === "workspace") e.target.blur(); };
}
