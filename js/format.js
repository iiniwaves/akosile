// Naira: comma groups and two kobo digits. From ₦1bn up, tables use a short figure.
export function naira(value, { short = false } = {}) {
  if (value == null) return "";
  if (short && value >= 1e9) {
    const bn = value / 1e9;
    return `₦${bn.toFixed(bn >= 100 ? 0 : 1)}bn`;
  }
  return "₦" + value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function plural(n, one, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}
