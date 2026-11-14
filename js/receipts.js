// What the AI "read" from each sample receipt.
// lines: the printed receipt, top to bottom. A line with `src` is where a field was read from.
// fields: one entry per extracted field. state: ready | check | missing | guessed | edited | confirmed | rule

export const documents = {
  "cafe-neo": {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "CAFÉ NEO", src: "vendor" },
      { left: "Lekki Phase 1" },
      { left: "10/11/2026  09:15", src: "date" },
      { kind: "divider" },
      { left: "Flat white x2", right: "5,200.00" },
      { left: "Croissant", right: "2,400.00" },
      { left: "Water", right: "2,000.00" },
      { kind: "divider" },
      { kind: "total", left: "TOTAL", right: "9,600.00", src: "total" },
      { left: "VAT 7.5% incl.", right: "669.77", src: "tax" },
      { left: "Thank you" },
    ],
    fields: {
      vendor: { value: "Café Neo", state: "ready" },
      date: { value: "10 Nov 2026", state: "ready" },
      total: { value: 9600, state: "ready" },
      tax: { value: 669.77, state: "ready" },
      category: { value: "Meals", state: "guessed" },
    },
  },

  shell: {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "SHELL", src: "vendor" },
      { left: "Admiralty Way, Lekki" },
      { left: "12/11/2026  14:32", src: "date" },
      { kind: "divider" },
      { left: "PMS 32.4L", right: "67,260.00" },
      { id: "subtotal", left: "SUBTOTAL", right: "67,260.00" },
      { left: "VAT 7.5%", right: "5,040.00", src: "tax" },
      { kind: "divider" },
      { kind: "total", id: "total", left: "TOTAL", right: "72,300.00", src: "total" },
      { left: "CARD **** 2291", right: "72,300.00" },
      { left: "Thank you" },
    ],
    fields: {
      vendor: { value: "Shell", state: "ready" },
      date: { value: "12 Nov 2026", state: "ready" },
      total: {
        value: 72300, state: "check",
        reason: "Found two totals. Used the one labelled Total.",
        alternatives: [
          { value: 72300, line: "total", note: "the one labelled Total" },
          { value: 67260, line: "subtotal", note: "the subtotal" },
        ],
      },
      tax: { value: 5040, state: "ready" },
      category: { value: "Fuel", state: "guessed" },
    },
  },

  "yellow-chilli": {
    caption: "Handwritten lines are read, but always flagged",
    lines: [
      { kind: "title", text: "THE YELLOW CHILLI", src: "vendor", small: true },
      { left: "Victoria Island" },
      { left: "12/11/2026  20:14", src: "date" },
      { kind: "divider" },
      { left: "Jollof rice x2", right: "57,000.00" },
      { left: "Suya platter", right: "48,000.00" },
      { left: "Chapman x2", right: "23,580.00" },
      { left: "SUBTOTAL", right: "128,580.00" },
      { left: "VAT 7.5%", right: "9,645.00", src: "tax" },
      { kind: "divider" },
      { kind: "total", id: "printed", left: "TOTAL", right: "138,225.00", src: "total" },
      { kind: "hand", left: "Tip", right: "+7,500.00" },
      { kind: "hand", id: "handwritten", left: "Total", right: "145,725.00" },
    ],
    fields: {
      vendor: { value: "The Yellow Chilli", state: "ready" },
      date: { value: "12 Nov 2026", state: "ready" },
      total: {
        value: 138225, state: "check",
        reason: "There's a handwritten total under the printed one. Used the printed total.",
        alternatives: [
          { value: 138225, line: "printed", note: "the printed total" },
          { value: 145725, line: "handwritten", note: "the handwritten total" },
        ],
      },
      tax: { value: 9645, state: "ready" },
      category: { value: "Meals", state: "guessed" },
    },
  },

  uber: {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "Uber", src: "vendor" },
      { left: "Trip to Ikeja" },
      { left: "13 Nov 2026  08:42", src: "date" },
      { kind: "divider" },
      { left: "Trip fare", right: "19,350.00" },
      { left: "Booking fee", right: "2,850.00" },
      { kind: "divider" },
      { kind: "total", left: "TOTAL", right: "22,200.00", src: "total" },
      { left: "Paid by card" },
    ],
    fields: {
      vendor: { value: "Uber", state: "ready" },
      date: { value: "13 Nov 2026", state: "ready" },
      total: { value: 22200, state: "ready" },
      category: { value: "Travel", state: "guessed" },
    },
  },

  bolt: {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "Bolt", src: "vendor" },
      { left: "Trip to Yaba" },
      { left: "13 Nov 2026  19:20", src: "date" },
      { kind: "divider" },
      { left: "Trip fare", right: "12,600.00" },
      { left: "Booking fee", right: "1,800.00" },
      { kind: "divider" },
      { kind: "total", left: "TOTAL", right: "14,400.00", src: "total" },
      { left: "Paid by card" },
    ],
    fields: {
      vendor: { value: "Bolt", state: "ready" },
      date: { value: "13 Nov 2026", state: "ready" },
      total: { value: 14400, state: "ready" },
      category: { value: "Transport", state: "guessed" },
    },
  },

  // Arrives after the person teaches the Uber rule, to show the rule at work.
  "uber-20": {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "Uber", src: "vendor" },
      { left: "Trip to Yaba" },
      { left: "14 Nov 2026  18:05", src: "date" },
      { kind: "divider" },
      { left: "Trip fare", right: "14,550.00" },
      { left: "Booking fee", right: "2,400.00" },
      { kind: "divider" },
      { kind: "total", left: "TOTAL", right: "16,950.00", src: "total" },
      { left: "Paid by card" },
    ],
    fields: {
      vendor: { value: "Uber", state: "ready" },
      date: { value: "14 Nov 2026", state: "ready" },
      total: { value: 16950, state: "ready" },
      category: { value: "Travel", state: "guessed" },
    },
  },
  // ---------- Second batch: when reading goes wrong ----------

  // The photo cuts off above the total, so total and tax are missing.
  "chicken-republic": {
    caption: "Highlights show where each value was read",
    cropped: true,
    lines: [
      { kind: "title", small: true, text: "CHICKEN REPUBLIC", src: "vendor" },
      { left: "Admiralty Way, Lekki" },
      { left: "11/11/2026  13:10", src: "date" },
      { kind: "divider" },
      { left: "Refuel meal", right: "14,250.00" },
      { left: "Coke 50cl", right: "2,700.00" },
      { left: "SUBTOTAL", right: "16,950.00" },
      { left: "VAT 7.5%", right: "1,275.00" },
      { kind: "divider" },
      { kind: "strong", left: "TOTAL", right: "18,225.00" },
    ],
    fields: {
      vendor: { value: "Chicken Republic", state: "ready" },
      date: { value: "11 Nov 2026", state: "ready" },
      total: { value: null, state: "missing" },
      tax: { value: null, state: "missing" },
      category: { value: "Meals", state: "guessed" },
    },
  },

  // Too blurry to read. The photo is kept as proof.
  "img-2291": {
    caption: "The photo stays attached as proof, even when it can't be read.",
    lines: [
      { kind: "title", small: true, text: "SPAR" },
      { left: "Lekki Phase 1" },
      { left: "14/11/2026" },
      { kind: "divider" },
      { left: "Bread", right: "3,150.00" },
      { left: "Milk 1L", right: "5,100.00" },
      { left: "Eggs x12", right: "6,300.00" },
      { left: "SUBTOTAL", right: "14,550.00" },
      { kind: "divider" },
      { kind: "strong", left: "TOTAL", right: "15,645.00" },
    ],
    fields: {},
  },

  // A photo of a whiteboard. Nothing is read from it.
  "img-2304": { photo: "A whiteboard from a meeting", caption: "The photo stays attached as proof, even when it can't be read.", lines: [], fields: {} },

  // Same vendor, date and total as the Shell receipt already in the inbox.
  "shell-copy": {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", small: true, text: "SHELL", src: "vendor" },
      { left: "Admiralty Way, Lekki" },
      { left: "12/11/2026  14:32", src: "date" },
      { kind: "divider" },
      { left: "PMS 32.4L", right: "67,260.00" },
      { left: "VAT 7.5%", right: "5,040.00" },
      { kind: "divider" },
      { kind: "strong", left: "TOTAL", right: "72,300.00", src: "total" },
    ],
    fields: {
      vendor: { value: "Shell", state: "ready" },
      date: { value: "12 Nov 2026", state: "ready" },
      total: { value: 72300, state: "ready" },
      category: { value: "Fuel", state: "guessed" },
    },
  },

  // The slow file. After Try again it reads normally.
  "img-2310": {
    caption: "Highlights show where each value was read",
    lines: [
      { kind: "title", text: "CHOWDECK", src: "vendor" },
      { left: "Delivery to Lekki" },
      { left: "13/11/2026  19:40", src: "date" },
      { kind: "divider" },
      { left: "Jollof rice x2", right: "5,500.00" },
      { left: "Delivery", right: "1,950.00" },
      { left: "Service fee", right: "1,000.00" },
      { kind: "divider" },
      { kind: "total", left: "TOTAL", right: "8,450.00", src: "total" },
    ],
    fields: {
      vendor: { value: "Chowdeck", state: "ready" },
      date: { value: "13 Nov 2026", state: "ready" },
      total: { value: 8450, state: "ready" },
      category: { value: "Meals", state: "guessed" },
    },
  },
};

// What a clearer photo reads, for Upload again and Upload a better photo.
export const rereads = {
  "img-2291": {
    row: { vendor: "Spar", place: "Lekki Phase 1", date: "14 Nov 2026", category: "Groceries", total: 15645 },
    doc: {
      caption: "Highlights show where each value was read",
      lines: [
        { kind: "title", small: true, text: "SPAR", src: "vendor" },
        { left: "Lekki Phase 1" },
        { left: "14/11/2026", src: "date" },
        { kind: "divider" },
        { left: "Bread", right: "3,150.00" },
        { left: "Milk 1L", right: "5,100.00" },
        { left: "Eggs x12", right: "6,300.00" },
        { left: "SUBTOTAL", right: "14,550.00" },
        { kind: "divider" },
        { kind: "strong", left: "TOTAL", right: "15,645.00", src: "total" },
      ],
      fields: {
        vendor: { value: "Spar", state: "ready" },
        date: { value: "14 Nov 2026", state: "ready" },
        total: { value: 15645, state: "ready" },
        category: { value: "Groceries", state: "rule" },
      },
    },
  },
  "chicken-republic": {
    row: { total: 18225 },
    fields: { total: { value: 18225, state: "ready" }, tax: { value: 1275, state: "ready" } },
    sources: { total: "TOTAL", tax: "VAT 7.5%" },
  },
  "img-2310": {
    row: { vendor: "Chowdeck", place: "Delivery to Lekki", date: "13 Nov 2026", category: "Meals", total: 8450 },
  },
};

export const nextUber = {
  id: "uber-20", vendor: "Uber", place: "Trip to Yaba", date: "14 Nov 2026",
  category: "Travel", total: 16950, status: "ready", readMs: 1400,
};

// Fields that describe the vendor rather than one receipt. Only these can be learned.
export const learnable = ["category"];

export const FIELD_ORDER = ["vendor", "date", "total", "tax", "category"];
export const FIELD_LABEL = { vendor: "Vendor", date: "Date", total: "Total", tax: "Tax", category: "Category" };
export const MONEY = ["total", "tax"];
