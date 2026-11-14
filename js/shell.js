import { icon } from "./icons.js";
import { workspace, me } from "./data.js";
import { $, $$, toast } from "./ui.js";

const NAV = [
  { id: "inbox", label: "Inbox", icon: "inbox", countKey: "inbox" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "rules", label: "Learned rules", icon: "rules" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function renderSidebar(counts = {}) {
  return `
  <aside class="sidebar" aria-label="Main">
    <div class="sidebar__logo">
      <img class="logo-word" src="assets/logo/wordmark-sidebar.svg" alt="Akọsílẹ̀" width="78" height="24">
      <img class="logo-icon" src="assets/logo/akosile-icon.svg" alt="Akọsílẹ̀" width="34" height="34">
    </div>

    <button type="button" class="ws" aria-label="Workspace: ${workspace.name}">
      <span class="avatar avatar--team">${workspace.initials}</span>
      <span class="ws__text"><span class="ws__name">${workspace.name}</span><span class="ws__detail">${workspace.people} people</span></span>
      ${icon("chevronDown", 14)}
    </button>

    <div class="find">
      <button type="button" class="search-field" data-action="search" aria-label="Search">
        <span class="search-field__lead">${icon("search", 15)}<span class="search-field__label">Search</span></span>
        <span class="keycap">/</span>
      </button>
      <button type="button" class="ask" data-action="ask">
        <span class="ask__lead"><span class="ask-mark"></span><span class="ask__label">Ask <img src="assets/logo/alakosile-name.svg" alt="Alákọsílẹ̀" width="59" height="14"></span></span>
        <span class="shortcut">⌘K</span>
      </button>
    </div>

    <nav class="nav">
      ${NAV.map((n) => `
        <a class="nav__item" href="#/${n.id}" data-nav="${n.id}" title="${n.label}">
          ${icon(n.icon, 17, 1.7)}<span class="nav__label">${n.label}</span>
          ${n.countKey ? `<span class="count" aria-label="${counts[n.countKey] || 0} need you">${counts[n.countKey] || ""}</span>` : ""}
        </a>`).join("")}
    </nav>

    <div class="sidebar__spacer"></div>

    <button type="button" class="icon-btn" data-action="collapse" aria-label="Collapse sidebar" title="Collapse sidebar">${icon("chevronLeft", 16)}</button>

    <div class="me-wrap">
      <button type="button" class="me" data-action="profile" aria-haspopup="menu" aria-expanded="false">
        <span class="avatar avatar--person">${me.initials}</span>
        <span class="me__text"><span class="me__name">${me.name}</span><span class="me__role">${me.role}</span></span>
        ${icon("chevronDown", 14)}
      </button>
    </div>
  </aside>`;
}

function profileMenu() {
  return `
  <div class="menu" role="menu" aria-label="Profile">
    <div class="menu__head"><strong>${me.name}</strong><span>${me.email}</span></div>
    <div class="menu__divider"></div>
    <button class="menu__item" role="menuitem" data-menu="profile">${icon("pen", 16)}<span>Your profile</span></button>
    <button class="menu__item" role="menuitem" data-menu="notifications">${icon("mail", 16)}<span>Notifications</span></button>
    <button class="menu__item" role="menuitem" data-menu="switch">${icon("folder", 16)}<span>Switch workspace</span>${icon("chevronRight", 16)}</button>
    <button class="menu__item" role="menuitem" data-menu="shortcuts">${icon("settings", 16)}<span>Keyboard shortcuts</span><kbd>?</kbd></button>
    <button class="menu__item" role="menuitem" data-menu="restart">${icon("retry", 16)}<span>Restart the demo</span></button>
    <div class="menu__divider menu__divider--after"></div>
    <button class="menu__item" role="menuitem" data-menu="signout">${icon("arrowRight", 16)}<span>Sign out</span></button>
  </div>`;
}

export function bindSidebar(app) {
  const sidebar = $(".sidebar", app);

  // Collapse and expand keep the toggle in the same spot.
  sidebar.addEventListener("click", (e) => {
    const item = e.target.closest("[data-menu]");
    if (item) { closeMenus(); menuAction(item.dataset.menu); return; }
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "collapse") {
      const collapsed = app.classList.toggle("is-collapsed");
      btn.innerHTML = icon(collapsed ? "chevronRight" : "chevronLeft", 16);
      btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      btn.title = btn.getAttribute("aria-label");
      try { localStorage.setItem("ak-collapsed", collapsed ? "1" : "0"); } catch {}
    }

    if (action === "profile") {
      const wrap = btn.parentElement;
      const open = btn.getAttribute("aria-expanded") === "true";
      closeMenus();
      if (!open) {
        wrap.insertAdjacentHTML("beforeend", profileMenu());
        btn.setAttribute("aria-expanded", "true");
        $(".menu__item", wrap)?.focus();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".me-wrap")) closeMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenus();
  });

  try {
    if (localStorage.getItem("ak-collapsed") === "1") $('[data-action="collapse"]', sidebar).click();
  } catch {}
}

export const SHORTCUTS = "Press / to search and ⌘K to ask the record keeper, from any screen.";

// Everything in the demo lives in memory, so restarting is a fresh page load on an empty inbox.
export function restartDemo() {
  try { sessionStorage.setItem("ak-restarted", "1"); } catch {}
  location.hash = "#/inbox";
  location.reload();
}

function menuAction(action) {
  if (action === "profile") location.hash = "#/settings";
  if (action === "shortcuts") toast(SHORTCUTS, { duration: 4000 });
  if (action === "restart") restartDemo();
  if (action === "notifications") toast("Notification settings aren't part of this demo.", { duration: 3000 });
  if (action === "switch") toast(`${workspace.name} is the only workspace in this demo.`, { duration: 3000 });
  if (action === "signout") toast("Signing out isn't part of this demo. Restart the demo to start over.", { duration: 3500 });
}

function closeMenus() {
  $$(".me-wrap .menu").forEach((m) => m.remove());
  $$('.me[aria-expanded="true"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
}

export function setActiveNav(id) {
  $$(".nav__item").forEach((a) => {
    if (a.dataset.nav === id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function setCount(key, value) {
  // Only the Inbox carries a count: receipts that still need a person. Zero hides it.
  const el = $(`[data-nav="${key}"] .count`);
  if (!el) return;
  el.textContent = value || "";
  el.setAttribute("aria-label", `${value || 0} need you`);
}
