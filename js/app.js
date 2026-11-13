import { renderSidebar, bindSidebar, setActiveNav } from "./shell.js";
import { renderInbox } from "./views/inbox.js";
import { receipts, initialSelection } from "./data.js";

// In-memory demo state. A reload starts the demo again.
const state = {
  receipts: structuredClone(receipts),
  selected: new Set(initialSelection),
};

const app = document.getElementById("app");
app.innerHTML = `${renderSidebar({ inbox: 6, rules: 0 })}<main class="main" id="main" tabindex="-1"></main>`;
bindSidebar(app);

const main = document.getElementById("main");

const routes = {
  inbox: () => renderInbox(main, state),
};

function placeholder(name) {
  main.onclick = main.onchange = null;
  main.innerHTML = `
    <header class="page-head"><div class="page-head__title"><span class="t-overline muted">Kola &amp; Co.</span><h1 class="t-heading-lg">${name}</h1></div></header>
    <section class="card empty-note">This screen arrives in a later stage of the demo.</section>`;
}

function route() {
  const id = (location.hash.replace(/^#\//, "") || "inbox").split("/")[0];
  setActiveNav(id);
  const view = routes[id];
  if (view) view();
  else placeholder({ reports: "Reports", rules: "Learned rules", settings: "Settings" }[id] || "Not found");
}

window.addEventListener("hashchange", route);
route();
