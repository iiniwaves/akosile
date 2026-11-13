# Akọsílẹ̀ demo

A scripted, clickable demo of Akọsílẹ̀, an AI receipt and invoice reader for small businesses. It shows how the AI should behave when it is sure, unsure, wrong or unable to read: quiet when sure, loud when not, every value tied to its source, everything reversible, and failures that hand off clearly.

Nothing here calls a live model. Every receipt, reading and flag is scripted in `js/data.js`, so the behaviour is the same every time.

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
js/app.js             state and routing
js/shell.js           sidebar: workspace, search, ask, nav, collapse, profile menu
js/views/             one file per screen
js/data.js            scripted receipts
js/icons.js           Lucide icons
assets/               fonts, logo, receipt thumbnail
design-system/        SKILL.md, the design system written down for building screens
```

## Stages

1. Tokens, app shell and the Inbox (done)
2. Upload, reading and adding a record without a receipt
3. Review, source highlight, edit and undo, learning and approval
4. When reading goes wrong: partial read, couldn't read, enter it yourself, not a receipt, duplicate, taking too long
5. Reports: submit, year, month and a submitted report
6. Search, ask the record keeper, learned rules and settings

## Credits

Fonts: Sora and Geist Mono (SIL Open Font License). Icons: Lucide (ISC).
Design and spec: Inioluwa Olojede.
