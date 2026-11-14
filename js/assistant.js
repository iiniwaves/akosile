import { naira } from "./format.js";
import { sampleReceipts, sampleReports, MONTHS, MONTH_SHORT, CURRENT_MONTH, YEAR } from "./reports.js";
import { categories } from "./data.js";

// The record keeper's answers, worked out from what's in the demo. It can look things up and filter.
// It never approves, edits or deletes, and every answer shows the receipts behind it and what it left out.

const MONTH_LABEL = `${MONTHS[CURRENT_MONTH]} ${YEAR}`;
const dayOf = (date) => Number(String(date || "").split(" ")[0]) || 14;
const short = (r) => `${dayOf(r.date)} ${MONTH_SHORT[CURRENT_MONTH]}`;
const flaggedTotal = (state, r) => ["check", "missing"].includes(state.docs[r.id]?.fields?.total?.state);

// Your receipts this month: the inbox and what you've already submitted.
export function yourReceipts(state) {
  return [...state.receipts, ...state.submitted].filter((r) => !state.reading.has(r.id) && !r.slow);
}

// Everyone's receipts this year, for questions about the year.
export function yearReceipts(state) {
  const team = [...sampleReports].flatMap((rep) => sampleReceipts(rep).map((i) => ({ ...i, month: rep.month, where: rep.title })));
  const mine = yourReceipts(state).filter((r) => r.total).map((r) => ({ id: r.id, receiptId: r.id, vendor: r.vendor, place: r.place, category: r.category, total: r.total, day: dayOf(r.date), month: CURRENT_MONTH, where: r.report ? state.myReports.find((x) => x.id === r.report)?.title : "Inbox" }));
  return [...team, ...mine];
}

export function vendorNames(state) {
  return [...new Set(yearReceipts(state).map((r) => r.vendor))];
}

function source(state, r) {
  const badge = r.status === "failed" ? { tone: "failed", label: r.checkLabel || "Couldn't read" }
    : r.status === "check" ? { tone: "check", label: r.checkLabel || "Check this" } : null;
  return { id: r.id, vendor: r.fileLabel || r.vendor, sub: r.date ? `${short(r)} · ${r.place}` : r.place, total: r.total, badge };
}

function otherReading(state, r) {
  const f = state.docs[r.id]?.fields?.total;
  const alt = f?.alternatives?.find((a) => a.value !== f.value);
  return alt ? naira(alt.value) : null;
}

function statusPhrase(list) {
  const a = list.filter((r) => r.status === "approved").length;
  const n = list.length;
  if (a === n) return n === 2 ? "both approved" : n === 1 ? "approved" : "all approved";
  if (a === 0) return n === 2 ? "both ready to approve" : n === 1 ? "not approved yet" : "none approved yet";
  return `${a} approved`;
}

function leftOutNote(state) {
  const failed = yourReceipts(state).filter((r) => r.status === "failed");
  if (!failed.length) return "";
  return failed.length === 1
    ? `Not included: ${failed[0].fileLabel || failed[0].vendor} couldn't be read, so it isn't counted yet.`
    : `Not included: ${failed.length} receipts couldn't be read, so they aren't counted yet.`;
}

const PAST = { approve: "approved", delete: "deleted", remove: "removed", edit: "edited", change: "changed", submit: "submitted", send: "sent" };

export function answer(state, question) {
  const q = question.toLowerCase();
  const mine = yourReceipts(state);
  const vendor = vendorNames(state).sort((a, b) => b.length - a.length).find((v) => q.includes(v.toLowerCase()));
  const category = categories.find((c) => q.includes(c.toLowerCase()));

  // Asked to act: say plainly that it can't, and point to where a person can.
  const verb = Object.keys(PAST).find((v) => new RegExp(`\\b${v}`).test(q));
  if (verb) {
    const list = mine.filter((r) => (!vendor || r.vendor === vendor) && r.status !== "approved" && !r.report);
    const ready = list.filter((r) => r.status === "ready");
    let detail = "";
    if (vendor && list.length) {
      detail = ready.length === list.length
        ? list.length === 1 ? `${vendor} is ready, so you can approve it from the inbox.` : list.length === 2 ? `Both ${vendor} receipts are ready, so you can approve them together.` : `All ${list.length} ${vendor} receipts are ready, so you can approve them together.`
        : `${list.length - ready.length} of them still need a look before they can be approved.`;
    }
    return {
      kind: "cant",
      title: `Receipts can't be ${PAST[verb]} from here. Only a person can, from the inbox.`,
      line: detail,
      sources: vendor ? list.map((r) => source(state, r)) : [],
      actions: vendor && list.length ? [{ act: "show", label: "Show in inbox", icon: "search" }] : [],
      filter: vendor && list.length ? { label: `${vendor}, ${MONTHS[CURRENT_MONTH]}`, desc: `${vendor} receipts from ${MONTHS[CURRENT_MONTH]}`, ids: list.map((r) => r.id) } : null,
    };
  }

  // What still needs a person.
  if (/waiting|review|need(s)? (me|you|a look)|to check|pending/.test(q)) {
    const list = mine.filter((r) => !r.report && (r.status === "check" || r.status === "failed" || r.problem));
    const look = list.filter((r) => r.status === "check").length;
    const failed = list.length - look;
    const line = !list.length ? "Nothing is waiting. Everything in the inbox is ready or approved."
      : [look && `${look} need${look === 1 ? "s" : ""} a quick look`, failed && `${failed} couldn't be read`].filter(Boolean).join(" and ") + ".";
    return {
      kind: "figure", overline: `Waiting for review · ${MONTH_LABEL}`, figure: `${list.length} receipt${list.length === 1 ? "" : "s"}`, line,
      sources: list.map((r) => source(state, r)),
      actions: list.length ? [{ act: "show", label: "Show in inbox", icon: "search" }, { act: "copy", label: "Copy", icon: "copy" }] : [],
      filter: { label: "Waiting for review", desc: "Receipts waiting for review", ids: list.map((r) => r.id) },
      copy: `${list.length} receipts waiting for review: ${list.map((r) => r.fileLabel || r.vendor).join(", ")}.`,
    };
  }

  // The single biggest receipt.
  if (/biggest|largest|most expensive|highest/.test(q)) {
    const top = mine.filter((r) => r.total).sort((a, b) => b.total - a.total)[0];
    if (!top) return none();
    const flagged = flaggedTotal(state, top);
    const other = flagged && otherReading(state, top);
    return {
      kind: "figure", overline: `Biggest expense · ${MONTH_LABEL}`, figure: naira(top.total),
      line: flagged ? `Probably ${top.vendor}, but this total is still flagged.` : `${top.vendor} on ${short(top)}.`, strong: flagged,
      sources: [source(state, top)],
      note: other ? `There's another total of ${other} on the receipt. Check it before you rely on this figure.` : "",
      actions: [{ act: "open", id: top.id, label: `Review ${top.vendor}`, icon: "search" }, { act: "copy", label: "Copy", icon: "copy" }],
      copy: `Biggest expense in ${MONTH_LABEL}: ${top.vendor}, ${naira(top.total)}.`,
    };
  }

  // Spend split by category.
  if (/categor/.test(q)) {
    const list = mine.filter((r) => r.total);
    const groups = {};
    for (const r of list) (groups[r.category || "Other"] ||= []).push(r);
    const rows = Object.entries(groups).map(([name, rs]) => ({ name, count: rs.length, total: rs.reduce((t, r) => t + r.total, 0) })).sort((a, b) => b.total - a.total);
    const flagged = list.filter((r) => flaggedTotal(state, r)).length;
    const sum = rows.reduce((t, r) => t + r.total, 0);
    return {
      kind: "figure", overline: `Spend by category · ${MONTH_LABEL}`, figure: naira(sum), line: `Across ${list.length} receipts with a total.`,
      rows, note: [leftOutNote(state), flagged ? `${flagged} total${flagged === 1 ? " is" : "s are"} still flagged.` : ""].filter(Boolean).join(" "),
      actions: [{ act: "copy", label: "Copy", icon: "copy" }],
      copy: rows.map((r) => `${r.name}: ${naira(r.total)}`).join("\n"),
    };
  }

  // How much on a vendor or a category, this month or this year.
  if ((vendor || category) && /spend|spent|cost|how much|total|pay|paid/.test(q)) {
    const label = vendor || category;
    const year = /year|2026|so far/.test(q);
    const match = (r) => (vendor ? r.vendor === vendor : r.category === category);
    if (year) {
      const list = yearReceipts(state).filter(match).sort((a, b) => b.month - a.month || b.day - a.day);
      const sum = list.reduce((t, r) => t + r.total, 0);
      return {
        kind: "figure", overline: `${label} · ${YEAR}`, figure: naira(sum), line: `Across ${list.length} receipts this year, from everyone in ${state.workspaceName}.`,
        sources: list.slice(0, 3).map((r) => ({ id: r.receiptId, vendor: r.vendor, sub: `${r.day} ${MONTH_SHORT[r.month]} · ${r.where}`, total: r.total })),
        more: list.length > 3 ? list.length - 3 : 0,
        actions: [{ act: "copy", label: "Copy", icon: "copy" }],
        copy: `${label}, ${YEAR}: ${naira(sum)} across ${list.length} receipts.`,
      };
    }
    const list = mine.filter((r) => r.total && match(r));
    if (!list.length) return { kind: "figure", overline: `${label} · ${MONTH_LABEL}`, figure: naira(0), line: `No ${label} receipts this month.`, sources: [], actions: [] };
    const sum = list.reduce((t, r) => t + r.total, 0);
    const flagged = list.filter((r) => flaggedTotal(state, r));
    const one = flagged.length === 1 && list.length === 1;
    const other = one && otherReading(state, flagged[0]);
    const inInbox = list.filter((r) => !r.report);
    return {
      kind: "figure", overline: `${label} · ${MONTH_LABEL}`, figure: naira(sum),
      line: flagged.length ? (one ? "Probably, but this total is still flagged." : `Probably, but ${flagged.length} of these totals are still flagged.`) : `Across ${list.length} receipt${list.length === 1 ? "" : "s"}, ${statusPhrase(list)}.`,
      strong: !!flagged.length,
      sources: list.map((r) => source(state, r)),
      note: one ? (other ? `The receipt shows two totals. If the other reading is right, it's ${other}. Check it before you rely on this figure.` : "") : leftOutNote(state),
      actions: [
        one ? { act: "open", id: flagged[0].id, label: `Review ${flagged[0].vendor}`, icon: "search" } : inInbox.length ? { act: "show", label: "Show in inbox", icon: "search" } : null,
        { act: "copy", label: "Copy", icon: "copy" },
      ].filter(Boolean),
      filter: inInbox.length ? { label: `${label}, ${MONTHS[CURRENT_MONTH]}`, desc: `${label} receipts from ${MONTHS[CURRENT_MONTH]}`, ids: inInbox.map((r) => r.id) } : null,
      copy: `${label}, ${MONTH_LABEL}: ${naira(sum)} across ${list.length} receipts.`,
    };
  }

  return none();
}

function none() {
  return {
    kind: "cant",
    title: "That isn't something the receipts can answer.",
    line: "Ask about spending, a vendor, a category or what's waiting for review. The suggestions below are a good start.",
    sources: [], actions: [],
  };
}

export const SUGGESTIONS = ["What's still waiting for review?", "Biggest expense this month", "Spend by category"];
