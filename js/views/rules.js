import { icon } from "../icons.js";
import { escapeHtml, plural } from "../format.js";
import { button, toast } from "../ui.js";
import { people } from "../data.js";

// Where learning lives. Every rule belongs to the workspace, says who added it and how often
// it's been used, and anyone on the team can remove it.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayOf = (on) => { const [d, m] = on.split(" "); return MONTHS.indexOf(m) * 31 + Number(d); };
const fullName = (first) => people.find((p) => p.name.startsWith(first))?.name || first;

// How many receipts a rule has filled in: the ones before the demo, plus any in it now.
export function ruleUses(state, rule) {
  const all = [...state.receipts, ...state.submitted];
  const here = all.filter((r) => r.vendor === rule.vendor && state.docs[r.id]?.fields?.category?.state === "rule").length;
  return (rule.used || 0) + here;
}

export function renderRules(root, state, { onSee }) {
  const rules = [...state.rules].sort((a, b) => dayOf(b.on) - dayOf(a.on));
  root.innerHTML = `
    <header class="page-head">
      <div class="page-head__title">
        <h1 class="t-heading-lg t-heading-lg--plain">Learned rules</h1>
      </div>
    </header>

    <section class="card intro">
      <h2>${rules.length ? `${plural(rules.length, "rule")}, learned from your team's corrections` : "No rules yet"}</h2>
      <p>Rules belong to this workspace and apply to everyone in it. A rule is only saved when someone says yes, and never from amounts or dates.</p>
    </section>

    ${rules.length ? `
    <section class="card table table--rules" role="table" aria-label="Learned rules">
      <div class="table__row table__head" role="row"><span>Rule</span><span>Added by</span><span>Used on</span><span></span></div>
      ${rules.map((r) => `
        <div class="table__row" role="row">
          <span class="rule">
            <span class="rule__line"><span class="rule__vendor">${escapeHtml(r.vendor)}</span><span class="muted">is always</span><strong>${escapeHtml(r.value)}</strong></span>
            <span class="rule__sub">Category</span>
          </span>
          <span class="rule__who"><strong>${escapeHtml(fullName(r.by))}</strong><span>${r.on} 2026</span></span>
          <span class="rule__used">${plural(ruleUses(state, r), "receipt")}</span>
          <span class="rule__actions">
            ${button({ label: "See receipts", iconName: "reports", attrs: `data-see="${escapeHtml(r.vendor)}"` })}
            ${button({ label: "Remove", iconName: "trash", attrs: `data-remove="${escapeHtml(r.vendor)}"` })}
          </span>
        </div>`).join("")}
    </section>` : ""}

    <div class="main__spacer"></div>
    <p class="footnote">Removing a rule doesn't change receipts already approved. It just stops being used from now on.</p>
  `;

  root.onclick = (e) => {
    const see = e.target.closest("[data-see]");
    if (see) { onSee(see.dataset.see); return; }
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const i = state.rules.findIndex((r) => r.vendor === rm.dataset.remove);
      const [rule] = state.rules.splice(i, 1);
      renderRules(root, state, { onSee });
      toast(`Rule removed. ${rule.vendor} won't be filled in as ${rule.value} any more.`, {
        undo: () => { state.rules.splice(i, 0, rule); if (location.hash === "#/rules") renderRules(root, state, { onSee }); },
      });
    }
  };
}
