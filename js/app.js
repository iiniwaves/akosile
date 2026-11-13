import { renderSidebar, bindSidebar, setActiveNav } from "./shell.js";
import { renderInbox } from "./views/inbox.js";
import { renderUpload } from "./views/upload.js";
import { renderNewRecord } from "./views/new-record.js";
import { sampleBatch } from "./data.js";
import { toast } from "./ui.js";
import { escapeHtml } from "./format.js";

// In-memory demo state. A reload starts the demo again.
const state = {
  receipts: [],
  selected: new Set(),
  reading: new Set(),
  draft: null,
  timers: [],
};

const app = document.getElementById("app");
app.innerHTML = `${renderSidebar({ inbox: "", rules: 0 })}<main class="main" id="main" tabindex="-1"></main>`;
bindSidebar(app);
const main = document.getElementById("main");

// Starts (or restarts) the scripted batch. Rows fill in one by one; one slow or failed file never blocks the rest.
function startReading() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  const manual = state.receipts.filter((r) => r.manual);
  state.receipts = [...structuredClone(sampleBatch).map((r) => ({ ...r, batch: true })), ...manual];
  state.selected = new Set();
  state.reading = new Set(sampleBatch.map((r) => r.id));

  sampleBatch.forEach((r) => {
    state.timers.push(setTimeout(() => {
      state.reading.delete(r.id);
      if (!state.reading.size) {
        // Ready receipts start selected so approving them is one click. Nothing is approved until a person does it.
        state.receipts.filter((x) => x.status === "ready" && x.batch).forEach((x) => state.selected.add(x.id));
      }
      if (currentView() === "inbox") renderInbox(main, state);
    }, r.readMs));
  });
  location.hash = "#/inbox";
}

function currentView() {
  return (location.hash.replace(/^#\//, "") || "inbox");
}

const routes = {
  "inbox": () => (state.receipts.length ? renderInbox(main, state) : renderUpload(main, { onFiles: startReading })),
  "inbox/upload": () => renderUpload(main, { onFiles: startReading }),
  "inbox/new": () => renderNewRecord(main, state, {
    onSave: (record) => {
      state.receipts.push(record);
      location.hash = "#/inbox";
      toast(`Added ${record.vendor}${record.status === "approved" ? " and approved it" : ""}.`, {
        undo: () => {
          state.receipts = state.receipts.filter((r) => r.id !== record.id);
          if (currentView() === "inbox") route();
        },
      });
    },
  }),
};

function placeholder(name) {
  main.onclick = main.onchange = null;
  main.innerHTML = `
    <header class="page-head"><div class="page-head__title"><span class="t-overline muted">Kola &amp; Co.</span><h1 class="t-heading-lg">${escapeHtml(name)}</h1></div></header>
    <section class="card empty-note">This screen arrives in a later stage of the demo.</section>`;
}

function route() {
  const path = currentView();
  setActiveNav(path.split("/")[0]);
  main.onclick = main.onchange = main.oninput = null;
  document.body.classList.remove("has-approve-bar");
  const view = routes[path];
  if (view) view();
  else placeholder({ reports: "Reports", rules: "Learned rules", settings: "Settings" }[path.split("/")[0]] || "Not found");
  main.scrollTop = 0;
}

window.addEventListener("hashchange", route);
route();
