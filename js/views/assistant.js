import { icon } from "../icons.js";
import { naira, escapeHtml } from "../format.js";
import { toast } from "../ui.js";
import { answer, yourReceipts, SUGGESTIONS } from "../assistant.js";

// The record keeper: a side panel that answers questions about the receipts.
// It reads first (the cobalt caret is the AI's only colour), then shows the answer in one go.

let host = null;
let current = null; // { question, reply, reading }

export function openAssistant(state, question) {
  if (!host) {
    host = document.createElement("aside");
    host.className = "assistant";
    host.setAttribute("aria-label", "Ask the record keeper");
    document.body.appendChild(host);
    host.addEventListener("click", (e) => onClick(e, state));
    host.addEventListener("submit", (e) => { e.preventDefault(); const v = host.querySelector("input").value.trim(); if (v) ask(state, v); });
    host.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAssistant(); });
  }
  document.querySelector('[data-action="ask"]')?.classList.add("is-active");
  render(state);
  if (question) ask(state, question);
  else host.querySelector("input")?.focus();
}

export function closeAssistant() {
  host?.remove();
  host = null;
  current = null;
  document.querySelector('[data-action="ask"]')?.classList.remove("is-active");
}

export const assistantOpen = () => !!host;

function ask(state, question) {
  const count = yourReceipts(state).length;
  current = { question, reading: true, count };
  render(state);
  const asked = current;
  setTimeout(() => {
    if (current !== asked) return;
    current = { question, reply: answer(state, question) };
    render(state);
  }, 900);
}

function onClick(e, state) {
  if (e.target.closest("[data-close]")) { closeAssistant(); return; }
  const sug = e.target.closest("[data-suggest]");
  if (sug) { ask(state, sug.dataset.suggest); return; }
  const open = e.target.closest("[data-open]");
  if (open) { if (open.dataset.open) location.hash = `#/review/${open.dataset.open}`; return; }
  const act = e.target.closest("[data-act]")?.dataset.act;
  const reply = current?.reply;
  if (!reply) return;
  if (act === "copy") {
    navigator.clipboard?.writeText(reply.copy || "").catch(() => {});
    toast("Answer copied.", { duration: 2500 });
  }
  if (act === "show" && reply.filter) {
    // The answer becomes a plain, labelled filter on the inbox. Nothing is hidden quietly.
    state.inboxFilter = reply.filter;
    if (location.hash === "#/inbox") window.dispatchEvent(new HashChangeEvent("hashchange"));
    else location.hash = "#/inbox";
  }
}

function sourceCard(s, eye = true) {
  const badge = s.badge ? `<span class="badge badge--${s.badge.tone} badge--sm">${escapeHtml(s.badge.label)}</span>` : "";
  return `
    <div class="src">
      <span class="src__strip"></span>
      <span class="src__text"><strong>${escapeHtml(s.vendor)}</strong><span>${escapeHtml(s.sub || "")}</span></span>
      ${badge}
      ${s.total ? `<span class="src__total">${naira(s.total)}</span>` : ""}
      ${eye && s.id && !s.badge ? `<button type="button" class="src__open" data-open="${s.id}" aria-label="Open ${escapeHtml(s.vendor)}">${icon("eye", 13)}</button>` : ""}
    </div>`;
}

function replyHtml(r) {
  const actions = r.actions?.length ? `<div class="answer__actions">${r.actions.map((a) =>
    `<button type="button" class="btn btn--sm" ${a.act === "open" ? `data-open="${a.id}"` : `data-act="${a.act}"`}>${icon(a.icon, 14)}<span>${escapeHtml(a.label)}</span></button>`).join("")}</div>` : "";
  if (r.kind === "cant") {
    return `
      <div class="answer">
        <p class="answer__title">${escapeHtml(r.title)}</p>
        ${r.line ? `<p class="answer__text">${escapeHtml(r.line)}</p>` : ""}
        ${r.sources.map((s) => sourceCard(s, false)).join("")}
        ${actions}
      </div>`;
  }
  const rows = r.rows ? `<div class="srcs">${r.rows.map((c) => `
      <div class="srcs__row srcs__row--cat"><span class="src__text"><strong>${escapeHtml(c.name)}</strong><span>${c.count} receipt${c.count === 1 ? "" : "s"}</span></span><span class="src__total">${naira(c.total)}</span></div>`).join("")}</div>` : "";
  const sources = r.sources?.length
    ? r.sources.length === 1 ? sourceCard(r.sources[0]) : `<div class="srcs">${r.sources.map((s) => sourceCard(s).replace('class="src"', 'class="src srcs__row"')).join("")}${r.more ? `<div class="srcs__more">And ${r.more} more</div>` : ""}</div>`
    : "";
  return `
    <div class="answer">
      <strong class="answer__figure">${escapeHtml(r.figure)}</strong>
      <p class="answer__line${r.strong ? " is-strong" : ""}">${escapeHtml(r.line)}</p>
      ${rows}${sources}
      ${r.note ? `<p class="answer__note">${escapeHtml(r.note)}</p>` : ""}
      ${actions}
    </div>`;
}

function render(state) {
  if (!host) return;
  const body = !current ? ""
    : `<div class="bubble"><p>${escapeHtml(current.question)}</p></div>
       ${current.reading
         ? `<div class="answer answer--reading" aria-live="polite"><p class="reading"><span class="reading__caret"></span>Reading ${current.count} receipt${current.count === 1 ? "" : "s"} in ${escapeHtml(state.workspaceName)}</p>
            <span class="skeleton skeleton--10" style="width:300px"></span><span class="skeleton skeleton--10" style="width:240px"></span><span class="skeleton skeleton--10" style="width:280px"></span><span class="skeleton skeleton--10" style="width:180px"></span></div>`
         : `<div aria-live="polite">${replyHtml(current.reply)}</div>`}`;
  host.innerHTML = `
    <header class="assistant__head">
      <span class="ask-mark ask-mark--28"></span>
      <span class="assistant__name"><img src="assets/logo/alakosile-name.svg" alt="Alákọsílẹ̀" width="78" height="18"><span>The record keeper. Ask about your receipts.</span></span>
      <button type="button" class="assistant__close" data-close aria-label="Close">${icon("x", 14)}</button>
    </header>
    <div class="assistant__thread">${body}</div>
    <div class="assistant__suggest">${SUGGESTIONS.map((s) => `<button type="button" class="suggest" data-suggest="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}</div>
    <form class="assistant__input">
      <input type="text" placeholder="Ask about your receipts…" aria-label="Ask about your receipts" autocomplete="off">
      <button type="submit" class="assistant__send" aria-label="Ask">${icon("send", 14)}</button>
    </form>
    <p class="assistant__foot">Can look things up and filter. Can't approve, edit or delete.</p>`;
}
