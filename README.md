# Akọsílẹ̀ demo

A scripted, clickable demo of Akọsílẹ̀, an AI receipt and invoice reader for small businesses. It shows how the AI should behave when it is sure, unsure, wrong or unable to read: quiet when sure, loud when not, every value tied to its source, everything reversible, and failures that hand off clearly.

Nothing here calls a live model. Every receipt, reading and flag is scripted in `js/data.js` and `js/receipts.js`, so the behaviour is the same every time.

## Run it

It's a static site with no build step. From this folder:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000. Opening `index.html` straight from disk won't work, because browsers block ES modules on `file://`.

## Structure

```
index.html            app entry
css/tokens.css        design tokens (colour, type, spacing, radius, shadows) and fonts
css/base.css          resets and type styles
css/components.css    buttons, badges, checkbox, keycap, menu, toast
css/layout.css        sidebar, main area, tables, approve bar
css/review.css        receipt, fields, history and the learning prompt
css/reports.css       reports, charts and the submit dialog
js/app.js             state and routing
js/shell.js           sidebar: workspace, search, ask, nav, collapse, profile menu
js/views/             one file per screen
js/data.js            the scripted batch, workspace and people
js/receipts.js        what was read from each receipt, line by line
js/reports.js         sample reports for the year and the team
js/datepicker.js      the calendar used by every date field
js/icons.js           Lucide icons
assets/               fonts, logo, receipt thumbnail
design-system/        DESIGN_SYSTEM.md: tokens, type, components and copy rules
```

## Stages

1. Tokens, app shell and the Inbox (done)
2. Upload, reading and adding a record without a receipt (done)
3. Review, source highlight, edit and undo, learning and approval (done)
4. When reading goes wrong: partial read, couldn't read, enter it yourself, not a receipt, duplicate, taking too long (done)
5. Reports: submit, year, month and a submitted report (done)
6. Search, ask the record keeper, learned rules and settings

## Credits

Fonts: Sora, Geist Mono and Instrument Serif (SIL Open Font License). Icons: Lucide (ISC).
Design and spec: Inioluwa Olojede.
