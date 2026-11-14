// Scripted demo data. Everything the AI "reads" is written here, so every behaviour in the spec shows up without a live model.

export const workspace = {
  name: "Kola & Co.",
  initials: "KC",
  people: 4,
};

export const me = {
  name: "Ada Bello",
  initials: "AB",
  role: "Admin",
  email: "ada@kolaco.ng",
};

// The sample batch. status is what the AI ends up with: ready | check | failed.
// readMs is when each receipt finishes reading, so rows fill in one by one.
export const sampleBatch = [
  { id: "cafe-neo", vendor: "Café Neo", place: "Lekki Phase 1", date: "10 Nov 2026", category: "Meals", total: 9600, status: "ready", readMs: 900 },
  { id: "shell", vendor: "Shell", place: "Admiralty Way", date: "12 Nov 2026", category: "Fuel", total: 72300, status: "check", checkLabel: "Check total", flagged: ["total"], readMs: 1700 },
  { id: "yellow-chilli", vendor: "The Yellow Chilli", place: "Victoria Island", date: "12 Nov 2026", category: "Meals", total: 138225, status: "check", checkLabel: "Check total", flagged: ["total"], readMs: 2600 },
  { id: "uber", vendor: "Uber", place: "Trip to Ikeja", date: "13 Nov 2026", category: "Travel", total: 22200, status: "ready", readMs: 3300 },
  { id: "bolt", vendor: "Bolt", place: "Trip to Yaba", date: "13 Nov 2026", category: "Transport", total: 14400, status: "ready", readMs: 3900 },
  { id: "img-2291", vendor: "IMG_2291.jpg", place: "Too blurry to read", date: null, category: null, total: null, status: "failed", problem: "unreadable", readMs: 5000 },
];

// The second upload: one of each way reading can go wrong. problem says which screen handles it.
// IMG_2310 is slow on purpose. It shows Taking a while after slowMs, and reads normally after Try again.
export const secondBatch = [
  { id: "chicken-republic", vendor: "Chicken Republic", place: "Admiralty Way, Lekki", date: "11 Nov 2026", category: "Meals", total: null, status: "check", checkLabel: "2 missing", problem: "partial", readMs: 1200 },
  { id: "img-2304", vendor: "IMG_2304.jpg", place: "Not a receipt or invoice", date: null, category: null, total: null, status: "failed", checkLabel: "Not a receipt", problem: "notReceipt", readMs: 2000 },
  { id: "shell-copy", vendor: "Shell", place: "Admiralty Way", date: "12 Nov 2026", category: "Fuel", total: 72300, status: "check", checkLabel: "Possible copy", problem: "duplicate", readMs: 2700 },
  { id: "img-2310", vendor: "IMG_2310.jpg", place: "Still reading", date: null, category: null, total: null, status: "reading", slowMs: 4200, retryMs: 1800 },
];

// Rules the team saved before the demo starts.
export const seedRules = [
  { vendor: "Spar", field: "category", value: "Groceries", by: "Kemi", on: "2 Nov" },
];

export const categories = ["Meals", "Transport", "Fuel", "Travel", "Groceries", "Office supplies", "Other"];

export const noReceiptReasons = ["Paid cash", "Receipt lost", "Other"];

// Dates offered when adding a record by hand (most recent first).
export const recentDates = ["14 Nov 2026", "13 Nov 2026", "12 Nov 2026", "11 Nov 2026", "10 Nov 2026", "9 Nov 2026", "8 Nov 2026", "7 Nov 2026"];
