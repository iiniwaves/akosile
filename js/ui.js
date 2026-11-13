import { icon } from "./icons.js";
import { escapeHtml } from "./format.js";

// Small DOM helpers shared by every view.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] ?? "" : ""), "");
}

export function badge(status, label) {
  const text = label || { ready: "Ready", check: "Check total", failed: "Couldn't read", reading: "Reading", approved: "Approved" }[status];
  return `<span class="badge badge--${status}">${escapeHtml(text)}</span>`;
}

export function button({ label, iconName, variant = "", size = "", attrs = "" }) {
  const cls = ["btn", variant && `btn--${variant}`, size && `btn--${size}`].filter(Boolean).join(" ");
  return `<button type="button" class="${cls}" ${attrs}>${iconName ? icon(iconName, 14) : ""}<span>${escapeHtml(label)}</span></button>`;
}

// Toasts: bottom centre, ink, with an optional Undo. Undo toasts last 8s and pause while hovered or focused.
export function toast(message, { undo, duration = 8000 } = {}) {
  let host = $(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${escapeHtml(message)}</span>${undo ? `<button type="button" class="btn btn--sm">${icon("undo", 14)}<span>Undo</span></button>` : ""}`;
  host.appendChild(el);

  let remaining = duration, started = Date.now(), timer;
  const close = () => el.remove();
  const start = () => { started = Date.now(); timer = setTimeout(close, remaining); };
  const pause = () => { clearTimeout(timer); remaining -= Date.now() - started; };
  el.addEventListener("mouseenter", pause);
  el.addEventListener("mouseleave", start);
  el.addEventListener("focusin", pause);
  el.addEventListener("focusout", start);
  if (undo) el.querySelector("button").addEventListener("click", () => { undo(); close(); });
  start();
  return close;
}
