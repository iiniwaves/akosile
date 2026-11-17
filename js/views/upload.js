import { button } from "../ui.js";

// Empty state. One clear action, plus a line on how the AI works before the first upload.
export function renderUpload(root, { onFiles }) {
  root.innerHTML = `
    <header class="page-head page-head--tall">
      <div class="page-head__title">
        <h1 class="t-heading-lg">Inbox</h1>
      </div>
    </header>

    <section class="dropzone" data-dropzone aria-label="Upload receipts">
      <span class="doc-placeholder" style="width:44px;height:56px" aria-hidden="true"></span>
      <h2 class="dropzone__title">Drop receipts here</h2>
      <p class="dropzone__hint">PDF, JPG or PNG. Up to 20 at a time.</p>
      <div class="dropzone__actions">
        ${button({ label: "Choose files", iconName: "folder", variant: "primary", attrs: 'data-action="choose"' })}
        ${button({ label: "Add without a receipt", iconName: "pen", attrs: 'data-href="#/inbox/new"' })}
      </div>
      <p class="dropzone__note">Every value comes with the spot on the receipt it was read from.</p>
      <input type="file" multiple accept="image/*,application/pdf" hidden data-file>
    </section>
  `;

  const zone = root.querySelector("[data-dropzone]");
  const input = root.querySelector("[data-file]");

  root.onchange = null;
  root.onclick = (e) => {
    const link = e.target.closest("[data-href]");
    if (link) { location.hash = link.dataset.href; return; }
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    // Any files picked here are swapped for the scripted sample batch, so the demo plays the same way every time.
    if (btn.dataset.action === "choose") input.click();
  };
  input.onchange = () => onFiles();

  ["dragenter", "dragover"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove("is-over"); }));
  zone.addEventListener("drop", () => onFiles());
}
