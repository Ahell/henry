import { html } from "lit";

/**
 * Render a <th> for a day header in the detail view.
 * Kept as a function to preserve table semantics (custom elements inside <tr> can be flaky).
 * @param {object} options
 * @param {string} options.dateStr
 * @param {{className:string,title:string}} options.presentation
 * @param {Function|null} [options.onClick]
 * @returns {import('lit').TemplateResult}
 */
export function renderDayHeaderCell({ dateStr, presentation, onClick }) {
  const d = new Date(dateStr);
  const year = d.getFullYear().toString().slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const compact = `${year}${month}${day}`;

  const clickHandler = onClick || null;
  const cursor = clickHandler ? "pointer" : "not-allowed";

  return html`<th
    class="${presentation.className}"
    @click=${clickHandler}
    title="${presentation.title}"
    style="cursor: ${cursor};"
  >
    ${compact}
  </th>`;
}
