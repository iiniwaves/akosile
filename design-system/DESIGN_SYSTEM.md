# Akọsílẹ̀ design system

Akọsílẹ̀ is an AI receipt and invoice extractor for small Nigerian businesses. The AI reads receipts, a person checks and approves them, and approved receipts go into monthly expense reports. The design work is about how the AI behaves when it is sure, unsure, wrong or unable to read.

Source of truth: Figma file `qIBx1GlJRR4p4BlhUZf77k` (pages: Design system, Logo, Screens > Hi-fi, User flow) and the behaviour spec doc. When this file and Figma disagree, Figma wins, then update this file.

## The four rules (every screen must prove at least one)

1. **Quiet when sure, loud when not.** Only fields that need a look get a flag. No confidence numbers anywhere.
2. **Every value shows its source.** Selecting a field highlights the exact spot on the receipt it was read from.
3. **Everything is reversible.** Every edit has undo; bulk approval can be undone until the report is submitted.
4. **Failure is specific and hands off.** Say what couldn't be read, keep what was read, offer a clear next step.

The AI never approves, submits, edits a user's value or deletes. Only a person does.

## Colour

Every colour has one job. Build with semantic tokens, never raw hex.

| Token | Value | Job |
|---|---|---|
| `--bg-canvas` | #FAFAFB | page behind panels (app main area uses `--ink-50` #F4F5F7) |
| `--bg-surface` | #FFFFFF | cards, tables, sidebar, panels |
| `--bg-subtle` | #EEF0F3 | active nav, hover rows, quiet chips |
| `--bg-inverse` | #111318 | approve bar, toasts, tooltips |
| `--text-primary` | #111318 | |
| `--text-secondary` | #6B7180 | sublabels, inactive nav, column headers |
| `--text-tertiary` | #9AA0AC | placeholders, counts, hints (never for essential text) |
| `--text-inverse` | #FFFFFF | |
| `--border-default` | #E3E5EA | cards, inputs, table rows, secondary buttons in screens |
| `--border-strong` | #C9CDD5 | checkboxes, secondary button component, dividers that must show |
| `--border-focus` | #111318 | focus, selected field |
| `--action-primary` | #111318 | primary buttons, checked boxes (hover #3A3F4A) |
| `--evidence-soft` | #FFF1A1 | marker on a receipt line the AI read |
| `--evidence-full` | #FFE14D | marker on the selected field's source; logo box |
| `--status-ready` | #0C8048 | Ready badge, white text (5.0:1) |
| `--status-check` | #FFA41B | Check badge and flag outlines, ink text |
| `--status-failed` | #D12C2C | Couldn't read badge, white text (5.1:1); failure sublines |
| `--status-reading` | #2B4EFF | Reading badge; cobalt caret |
| `--status-approved` | #3A3F4A | Approved / Submitted badge |

Rules:
- **Marker yellow** appears only on a receipt or document, only where the AI read something. Never on buttons, badges, search matches or guesses. Exceptions: the logo box and the assistant mark (they are the brand), and the Undo pill in toasts, because undo always points back at something the AI read.
- **Cobalt** means only one thing: the AI is reading right now (the caret and the Reading badge). Not for links or buttons.
- **Actions, focus and selection are ink.** No blue buttons.
- **Badges are solid**, full-strength fill, white or ink text. No tints, no dots, 6px radius.
- **Flags** are a 1.5px amber outline (radius 3 on amounts, radius 8 on fields). Not dashed.

## Type

Sora for everything you read. Geist Mono for everything you compare: amounts, dates, column headers, overlines, keycaps.

| Style | Font | Size / line height | Tracking |
|---|---|---|---|
| Display | Sora 600 | 36 / 120% | -3% |
| Heading/Large (page title) | Sora 600 | 26 / 125% | -2% |
| Heading/Medium | Sora 600 | 20 / 130% | -2% |
| Heading/Small (panel title) | Sora 600 | 16 / 135% | -1% |
| Body/Medium | Sora 400 | 14 / 150% | 0 |
| Body/Small | Sora 400 | 12 / 145% | 0 |
| Caption | Sora 400 | 11 / 140% | 0 |
| Label/Medium | Sora 600 | 13 / 130% | 0 |
| Label/Small (buttons, row titles) | Sora 600 | 12 / 130% | 0 |
| Mono/Amount | Geist Mono 500 | 13 / 130% (12 in tables) | 0 |
| Mono/Data (dates) | Geist Mono 400 | 12 / 130% | 0 |
| Mono/Overline (column heads, eyebrows) | Geist Mono 400 | 10–11 / 130%, UPPERCASE | 6% |

Sora has no glyphs for ọ, ẹ or the grave accent. **Never type the product name in UI copy.** Use the drawn SVG wordmark, the drawn "Alákọsílẹ̀" name SVG in the Ask button and assistant panel, or rewrite the sentence ("The rest look right.").

## Spacing, radius, elevation

- 4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48. Table rows use 8px vertical padding, panels 16px, page gutters 32px.
- Radius: sm 4 (keycaps, checkbox), md 6 (badges, nav items), lg 8 (buttons, inputs, fields, cards in sidebar), xl 10–12 (panels, tables, summary cards, approve bar), 2xl 14–16 (assistant panel, search panel, dialogs).
- Shadow/Document: 0 8px 24px rgba(18,20,26,.10), receipts only.
- Shadow/Popover: 0 12px 32px -4px rgba(18,20,26,.16), menus, search panel, dialogs, assistant panel.

## Layout (desktop web app, 1280×800 reference)

- **Sidebar** 200px, white, padding 28 16 24 16, gap 18. Order: wordmark (24px tall), workspace switcher, Search field + Ask button (gap 8), nav (gap 2), spacer, collapse button (34×34), profile card.
- **Collapsed sidebar** 72px: kọ icon, avatar only, icon-only search/ask/nav, expand button above the user avatar. Same spot as the collapse button so the toggle never moves.
- **Main** fills the rest, background #F4F5F7, padding 28 32, gap 18. Header: overline (Mono 10, secondary) above page title (26), actions right-aligned to the title baseline.
- **Detail pages** (a receipt, a new record, a month, a report) have no overline. Instead: a 36px back button (white, 1px border, radius 8, arrow-left 18) then the parent page and the current page in one line at title size, "Inbox / Shell" (parent Sora 600 26 secondary and clickable, slash Sora 400 26 border-strong, current Sora 600 26 ink), gap 12 after the button and 10 between words. Previous and Next sit on the right with a caption under them (Sora 11 secondary, centred, gap 6): "Receipt 1 of 2 to check", "Receipt 4 of 5" or "Receipt 1 of 4 that need you". Previous is disabled on the first receipt and Next on the last. A new record has no Previous or Next. Header aligns items to the centre and is 55px tall with the pager, 36px without.
- **Tables**: white, border default, radius 10. Header row #FAFAFB, Mono 10 uppercase secondary. Rows 47px, padding 8 16, column gap 20, row divider default. Columns for Inbox: checkbox 13, vendor 203, date 128, category 128, total 128, status 128, actions 136 (centred).
- **Review layout**: document area (grey #EEF0F3 panel) left, fields panel 360 right.

## Components

- **Button** radius 8, gap 6, icon 14px. Primary: ink fill, white Label/Small, padding 9 14. Secondary: white, 1px border, ink text. Small: padding 6 12. Table action buttons are a fixed 136px wide, centred content, so columns line up. Every button gets an icon when it helps predict the result. No ghost buttons.
- **Badge** padding 4 10, Sora 600 12, radius 6, solid colour (see tokens). Labels: Ready, Check total, Couldn't read, Reading, Approved, and for the second batch 2 missing, Possible copy (amber) and Not a receipt (red). A slow file shows a smaller amber Taking a while chip (padding 3 9, Sora 600 11) on a row at 85% opacity.
- **Checkbox** 13–16px, radius 3–4, 1.5px border-strong; checked = ink fill with white tick.
- **Nav item** padding 7 8, radius 6, icon 17px + gap 10, Sora 12. Active: bg-subtle, Sora 600 ink. Inactive: secondary text. Only the Inbox carries a count: receipts that still need a person, as an ink pill (min 20px wide, padding 1 6, radius 9, Geist Mono 500 11 white). Zero hides it. In the collapsed sidebar it becomes a small badge on the icon's top right (min 16px, Geist Mono 10).
- **Workspace switcher** white, 1px border, radius 8, padding 8 10 8 8: 28px ink avatar (radius 6, initials Sora 600 10 white), name Sora 600 12, detail Sora 10 secondary, chevron-down 14px right.
- **Search field** bg #F4F5F7, radius 8, padding 9 8 9 10, search icon 15 + "Search" Sora 12 secondary, keycap "/" right.
- **Ask button** white, 1px border, radius 8, padding 9 10: assistant mark 18px + "Ask Alákọsílẹ̀" (drawn) + "⌘K" (Inter 500 11 secondary).
- **Assistant mark** 18px marker-yellow tile, radius 5, with a 2×10 cobalt caret centred. Never a sparkle.
- **Keycap** white, 1px border, radius 4, padding 1 6, Geist Mono 10 secondary.
- **Field** (review panel) white, 1px border, radius 8, padding 10 12. Left 3px marker strip (soft yellow when read from the receipt, none when typed). Label Mono 11 uppercase secondary, value Mono 500 13 (amounts/dates) or Sora 600 12 (text). States: Ready; Check (1.5px amber border, amber "Check this" tag, chevron-down accordion, closed); Selected (2px ink border, padding 14, open: reason line Sora 12, "Other reading" chips, Confirm + Edit buttons); Missing ("Add total" placeholder tertiary + "Not found" subtle chip); Edited ("Edited by you" Caption secondary); Guessed ("Based on vendor" Caption secondary, no source box).
- **Receipt line** Geist Mono 12, padding 2 4, radius 4. Highlight Soft = #FFF1A1; Selected = #FFE14D with 1.5px ink outline.
- **History** inset lists every change with a compact Revert (padding 3 8, radius 6, Sora 600 11, undo icon 12). Edited fields keep their Edit button when selected, so Revert is a shortcut, never the only way to change a value again.
- **Slow file banner** replaces the summary card while a file is slow: white, 1.5px amber border, radius 10, padding 14. "IMG_2310.jpg is taking longer than usual" Sora 600 13, "Your file is safe. The rest of your receipts are ready to use." Sora 11 secondary, Try again button with the retry icon.
- **Problem screens** (Couldn't read, Partial read, Not a receipt, Duplicate) share the review layout and a pager captioned "Receipt N of M that need you". Row actions: Upload again, Fill in, Review, Compare, Try again. Every way out (Save, Remove, Keep both) moves to the next one and can be undone from the toast.
- **Toast** ink, radius 8, padding 10 14, gap 14, Sora 12 white + a marker-yellow Undo pill (padding 0 4, radius 3, undo icon 13 + Sora 600 12 ink). One at a time, centred over the main area, 24px from the bottom or 16px above the approve bar.
- **Approve bar** ink, radius 10, padding 10 10 10 18: "3 selected, ₦46,200.00" Sora 600 13 white + note Caption #9AA0AC, white secondary button "Approve 3" with check icon.
- **Date picker** every date field opens a calendar instead of a list: 274px popover, radius 12, popover shadow, padding 12, gap 8. Month in Sora 600 13 with 28px previous and next buttons, weekday initials in Mono 10, days in Geist Mono 12 on a 32px grid with 4px gaps. Selected day is ink with white text, today has a 1px border-strong ring, other months are tertiary, and days after today are disabled because a receipt can't be from the future. It opens under the field, right-aligned to the panel.
- **Learning prompt** appears whenever a category is chosen by hand, on every screen with a category (review, partial read, enter it yourself, add without a receipt), as long as there's a vendor: "Use Travel for all Chicken Republic receipts?" with Yes, always and Just this one.
- **Inbox rows** open their receipt when clicked anywhere, including rows that couldn't be read. Action buttons still do their own thing.
- **Select** label above, white 1px border radius 8, chevron-down; Open shows a menu with "FROM A TEAM RULE" overline section.
- **Profile card** avatar 28 (round, #E3E5EA, initials ink), name Sora 600 12, role Sora 10 secondary, chevron-down right. Opens the **Profile menu** upwards: 232px, radius 12, popover shadow, name + email header, items (Your profile, Notifications, Switch workspace ›, Keyboard shortcuts ?), divider, Sign out last.
- **Search panel** 660px, radius 14, popover shadow over a 35% ink scrim. Input row (18px search icon, query Sora 16, Esc keycap), filter chips (All active = ink), grouped results (RECEIPTS, REPORTS, VENDORS overlines), active row bg #F2F3F5 with Enter keycap, matches in **bold** (never yellow), last row "Ask the record keeper" with the question pre-written, footer hints ↑ ↓ move, Enter open, Esc close.
- **Assistant panel** 400px side panel, radius 14, popover shadow: mark + "Alákọsílẹ̀" + "The record keeper. Ask about your receipts." Answers: figure first (Mono), then the receipts behind it with markers and Open, then what was left out. Footer: "Can look things up and filter. Can't approve, edit or delete."

## Icons

Lucide, 24px grid, 2px stroke, round caps and joins. Used at 14px in buttons, 15 in search, 16–17 in nav and menus, stroke ≈1.7–1.8 at those sizes. Icons take the colour of the label beside them. Set: inbox, file-text (reports), list-checks (rules), settings-2, upload, pen-line, pencil (edit), undo-2, eye (open), search, check, send, chevron-left/right/down, trash-2, copy, rotate-cw (upload again / retry), camera, folder, zoom-in, image, mail, clock, arrow-right, x, plus.

## Logo

- Wordmark: "Akọsílẹ̀" in a rounded marker-yellow box (radius 0.16 of height) with a full-height cobalt caret right of it. Minimum 16px tall. Clear space 0.5× height.
- Icon: "kọ" on a yellow tile, radius 22.5%. Used in the collapsed sidebar and as favicon.
- One-colour ink version for wireframes and print. Never recolour the box, add effects, stretch, or put the caret anywhere else.

## Money, dates, data

- While you type an amount the field shows plain digits (`15645`), and it becomes `₦15,645.00` when you leave the field.
- Naira only: `₦72,300.00`. Comma groups, two kobo digits, Geist Mono. Tables show the full amount up to ₦999,999,999.99, then a short figure (₦12.4bn) with the full amount on hover. Review, reports and exports always show the full amount.
- Dates: `12 Nov 2026` in tables and fields; receipts show the raw printed format (12/11/2026).
- Workspace: Kola & Co. (4 people: Ada Bello Admin, Tunde Ade, Kemi Ojo, Bisi Lawal). Learned rules are saved to the workspace, not the person.

## Voice and copy

- Say what happened, then what to do. Plain words, no apology, no personality, no "I", no "Oops", no exclamation marks.
- **No em dashes** anywhere (UI, docs, comments, commit messages).
- Sentence case for everything except Mono overlines.
- Key strings: "6 receipts read", "2 need a quick look before you can approve them.", "Check this", "The rest look right.", "Found two totals. Used the one labelled Total.", "Edited by you", "Total changed to ₦145,725.00. Undo", "Use Transport for all Uber receipts?" (Yes, always / Just this one), "Category: Transport (your rule)", "Couldn't read this one. The photo is too blurry to pick out the text." (Upload again / Enter it myself), "Read 3 of 6 fields. Please fill in the rest.", "This doesn't look like a receipt or invoice.", "Looks like a copy of Shell, 12 Nov." (Keep both / Remove this one), "This is taking longer than usual. Your file is safe." (Try again), "Receipts with a flagged vendor, date or total stay out of bulk approval."

## Figma is the source of truth

Every screen and state in the demo must exist in the Hi-fi section of the Figma file and match it in size, spacing and colour. If the code needs a state Figma doesn't show, design it in Figma first (and in Wireframes), then build it. 1.5px strokes are built as a 1px border plus a 0.5px inset shadow so they measure like Figma.

## Never

Show a confidence number. Draw a source box for a guessed value. Overwrite a user's edit. Let the AI approve, submit or delete. Let one failed receipt block the batch. Use yellow outside documents and the brand. Use cobalt for anything but reading. Use dashed borders in hi-fi (dashes are wireframe only). Type the product name in Sora.
