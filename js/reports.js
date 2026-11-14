// Reports for the year. Earlier months are sample data for the team; November fills in as people submit.
// Ada's November report is created by the demo when you submit from the inbox.

export const YEAR = 2026;
export const CURRENT_MONTH = 10; // November, zero-based
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PEOPLE = {
  AB: { name: "Ada Bello", title: "Lekki office" },
  TA: { name: "Tunde Ade", title: "Field team" },
  KO: { name: "Kemi Ojo", title: "Office supplies run" },
};

// [month, person, receipts, total, day submitted]
const SAMPLE = [
  [0, "AB", 16, 150200, 30], [0, "TA", 12, 108900, 29], [0, "KO", 6, 53500, 30],
  [1, "AB", 18, 162250, 27], [1, "TA", 9, 88000, 26], [1, "KO", 4, 38500, 27],
  [2, "AB", 17, 186400, 30], [2, "TA", 14, 152300, 31], [2, "KO", 7, 63400, 31],
  [3, "AB", 16, 168700, 29], [3, "TA", 13, 132100, 30], [3, "KO", 7, 55400, 30],
  [4, "AB", 17, 171250, 29], [4, "TA", 13, 127000, 28],
  [5, "AB", 18, 205600, 30], [5, "TA", 15, 172400, 29], [5, "KO", 7, 63900, 30],
  [6, "AB", 16, 181200, 31], [6, "TA", 13, 149850, 30], [6, "KO", 6, 58900, 31],
  [7, "AB", 20, 196100, 31], [7, "TA", 16, 158700, 29], [7, "KO", 8, 60500, 31],
  [8, "AB", 21, 211400, 30], [8, "TA", 16, 156500, 29],
  [9, "AB", 21, 214650, 30], [9, "TA", 17, 172300, 31], [9, "KO", 8, 65800, 31],
  [10, "TA", 28, 118400, 12],
];

export const sampleReports = [
  ...SAMPLE.map(([month, person, count, total, day]) => ({
    id: `${YEAR}-${String(month + 1).padStart(2, "0")}-${person.toLowerCase()}`,
    month, person, title: PEOPLE[person].title, count, total, status: "submitted",
    when: `${day} ${MONTH_SHORT[month]}`, at: `${day} ${MONTH_SHORT[month]} ${YEAR} at ${["09:12", "11:40", "15:05", "17:30"][day % 4]}`,
  })),
  { id: `${YEAR}-11-ko`, month: 10, person: "KO", title: "Office supplies run", count: 8, total: 42150, status: "draft", when: "13 Nov", at: `13 Nov ${YEAR} at 10:25` },
];

// Spend by category for everything except Ada's November report, which is added from what you submit.
export const sampleCategories = { Meals: 1255836, Transport: 876504, Fuel: 674785, Groceries: 498057, "Office supplies": 373543, Other: 207525 };
export const sampleEnteredByHand = 9;

// Receipts inside the sample reports, made up the same way every time so the pages stay stable.
const VENDORS = {
  AB: [["Café Neo", "Meals"], ["Chicken Republic", "Meals"], ["Uber", "Transport"], ["Bolt", "Transport"], ["Shell", "Fuel"], ["Spar", "Groceries"], ["The Yellow Chilli", "Meals"]],
  TA: [["Total Energies", "Fuel"], ["Bolt", "Transport"], ["Uber", "Transport"], ["Mama Put, Yaba", "Meals"], ["Shell", "Fuel"], ["Chowdeck", "Meals"]],
  KO: [["Jumia", "Office supplies"], ["Konga", "Office supplies"], ["Spar", "Groceries"], ["Shoprite", "Groceries"], ["Printing Plus", "Other"]],
};
const SOURCES = ["Read", "Read", "Read", "Read", "Read, total confirmed", "Read, total edited", "Read, team rule"];

export function sampleReceipts(report) {
  let seed = [...report.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const pool = VENDORS[report.person];
  const weights = Array.from({ length: report.count }, () => 0.4 + rand());
  const sum = weights.reduce((a, b) => a + b, 0);
  let left = report.total;
  return weights.map((w, i) => {
    const [vendor, category] = pool[Math.floor(rand() * pool.length)];
    const amount = i === report.count - 1 ? left : Math.max(50, Math.round((report.total * w) / sum / 50) * 50);
    left -= amount;
    const last = report.month === 10 ? 13 : 28;
    return {
      id: `${report.id}-${i}`, vendor, category, total: amount,
      day: 1 + Math.floor((rand() * last * (i + 1)) / report.count) % last,
      source: SOURCES[Math.floor(rand() * SOURCES.length)],
    };
  }).sort((a, b) => a.day - b.day);
}
