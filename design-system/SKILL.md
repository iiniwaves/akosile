---
name: akosile-design-system
description: Use when designing or coding any Akọsílẹ̀ screen, component or copy (Figma or HTML/CSS/JS demo). Holds the tokens, type, components, layout, behaviour rules and voice.
---

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
- **Marker yellow** appears only on a receipt or document, only where the AI read something. Never on buttons, badges, search matches or guesses. Exceptions: the logo box and the assistant mark (they are the brand).
- **Cobalt** means only one thing: the AI is reading right now (the caret, the Reading badge, capture corners). Not for links or buttons.
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
- **Tables**: white, border default, radius 10. Header row #FAFAFB, Mono 10 uppercase secondary. Rows 47px, padding 8 16, column gap 20, row divider default. Columns for Inbox: checkbox 13, vendor 203, date 128, category 128, total 128, status 128, actions 136 (centred).
- **Review layout**: document area (grey #EEF0F3 panel) left, fields panel 360 right.

## Components

- **Button** radius 8, gap 6, icon 14px. Primary: ink fill, white Label/Small, padding 9 14. Secondary: white, 1px border, ink text. Small: padding 6 12. Table action buttons are a fixed 136px wide, centred content, so columns line up. Every button gets an icon when it helps predict the result. No ghost buttons.
- **Badge** padding 4 10, Sora 600 12, radius 6, solid colour (see tokens). Labels: Ready, Check total, Couldn't read, Reading, Approved.
- **Checkbox** 13–16px, radius 3–4, 1.5px border-strong; checked = ink fill with white tick.
- **Nav item** padding 7 8, radius 6, icon 17px + gap 10, Sora 12. Active: bg-subtle, Sora 600 ink. Inactive: secondary text. Counts in Mono 11 tertiary on the right.
- **Workspace switcher** white, 1px border, radius 8, padding 8 10 8 8: 28px ink avatar (radius 6, initials Sora 600 10 white), name Sora 600 12, detail Sora 10 secondary, chevron-down 14px right.
- **Search field** bg #F4F5F7, radius 8, padding 9 8 9 10, search icon 15 + "Search" Sora 12 secondary, keycap "/" right.
- **Ask button** white, 1px border, radius 8, padding 9 10: assistant mark 18px + "Ask Alákọsílẹ̀" (drawn) + "⌘K" (Inter 500 11 secondary).
- **Assistant mark** 18px marker-yellow tile, radius 5, with a 2×10 cobalt caret centred. Never a sparkle.
- **Keycap** white, 1px border, radius 4, padding 1 6, Geist Mono 10 secondary.
- **Field** (review panel) white, 1px border, radius 8, padding 10 12. Left 3px marker strip (soft yellow when read from the receipt, none when typed). Label Mono 11 uppercase secondary, value Mono 500 13 (amounts/dates) or Sora 600 12 (text). States: Ready; Check (1.5px amber border, amber "Check this" tag, chevron-down accordion, closed); Selected (2px ink border, padding 14, open: reason line Sora 12, "Other reading" chips, Confirm + Edit buttons); Missing ("Add total" placeholder tertiary + "Not found" subtle chip); Edited ("Edited by you" Caption secondary); Guessed ("Based on vendor" Caption secondary, no source box).
- **Receipt line** Geist Mono 12, padding 2 4, radius 4. Highlight Soft = #FFF1A1; Selected = #FFE14D with 1.5px ink outline.
- **Toast** ink, radius 8, padding 10 14, Sora 12 white + white "Undo" button with undo icon. Bottom centre.
- **Approve bar** ink, radius 10, padding 10 10 10 18: "3 selected, ₦46,200.00" Sora 600 13 white + note Caption #9AA0AC, white secondary button "Approve 3" with check icon.
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

- Naira only: `₦72,300.00`. Comma groups, two kobo digits, Geist Mono. Tables show the full amount up to ₦999,999,999.99, then a short figure (₦12.4bn) with the full amount on hover. Review, reports and exports always show the full amount.
- Dates: `12 Nov 2026` in tables and fields; receipts show the raw printed format (12/11/2026).
- Workspace: Kola & Co. (4 people: Ada Bello Admin, Tunde Ade, Kemi Ojo, Bisi Lawal). Learned rules are saved to the workspace, not the person.

## Voice and copy

- Say what happened, then what to do. Plain words, no apology, no personality, no "I", no "Oops", no exclamation marks.
- **No em dashes** anywhere (UI, docs, comments, commit messages).
- Sentence case for everything except Mono overlines.
- Key strings: "6 receipts read", "2 need a quick look before you can approve them.", "Check this", "The rest look right.", "Found two totals. Used the one labelled Total.", "Edited by you", "Total changed to ₦145,725.00. Undo", "Use Transport for all Uber receipts?" (Yes, always / Just this one), "Category: Transport (your rule)", "Couldn't read this one. The photo is too blurry to pick out the text." (Upload again / Enter it myself), "Read 3 of 6 fields. Please fill in the rest.", "This doesn't look like a receipt or invoice.", "Looks like a copy of Shell, 12 Nov." (Keep both / Remove this one), "This is taking longer than usual. Your file is safe." (Try again), "Receipts with a flagged vendor, date or total stay out of bulk approval."

## Never

Show a confidence number. Draw a source box for a guessed value. Overwrite a user's edit. Let the AI approve, submit or delete. Let one failed receipt block the batch. Use yellow outside documents and the brand. Use cobalt for anything but reading. Use dashed borders in hi-fi (dashes are wireframe only). Type the product name in Sora.

## Building the demo (HTML/CSS/JS)

- Static site, no build step: `index.html`, `css/tokens.css`, `css/base.css`, `css/components.css`, `js/` ES modules. Fonts self-hosted in `assets/fonts` (Sora 400/600, Geist Mono 400/500, latin + latin-ext so ₦ renders).
- Tokens live only in `tokens.css` as CSS custom properties named as above. Components never use raw hex.
- Scripted data in `js/data.js` (receipts with fields, state per field, bounding boxes as % of the receipt, reason lines, alternatives). Processing is simulated with 0.8–2s staggered delays. State is in memory with a Reset demo control.
- Match the Hi-fi frames at 1280×800 pixel for pixel; compare with a screenshot before calling a screen done.
