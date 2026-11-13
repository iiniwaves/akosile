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

// status: ready | check | failed | reading | approved
export const receipts = [
  { id: "cafe-neo", vendor: "Café Neo", place: "Lekki Phase 1", date: "10 Nov 2026", category: "Meals", total: 9600, status: "ready" },
  { id: "shell", vendor: "Shell", place: "Admiralty Way", date: "12 Nov 2026", category: "Fuel", total: 72300, status: "check", checkLabel: "Check total", flagged: ["total"] },
  { id: "yellow-chilli", vendor: "The Yellow Chilli", place: "Victoria Island", date: "12 Nov 2026", category: "Meals", total: 138225, status: "check", checkLabel: "Check total", flagged: ["total"] },
  { id: "uber", vendor: "Uber", place: "Trip to Ikeja", date: "13 Nov 2026", category: "Travel", total: 22200, status: "ready" },
  { id: "bolt", vendor: "Bolt", place: "Trip to Yaba", date: "13 Nov 2026", category: "Transport", total: 14400, status: "ready" },
  { id: "img-2291", vendor: "IMG_2291.jpg", place: "Too blurry to read", date: null, category: null, total: null, status: "failed" },
];

// Receipts selected when the inbox first opens (matches the hi-fi screen).
export const initialSelection = ["cafe-neo", "uber", "bolt"];
