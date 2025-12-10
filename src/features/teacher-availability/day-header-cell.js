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
  const day = d.getDate();
  const month = d.toLocaleString("sv-SE", { month: "short" });
  const weekday = d.toLocaleString("sv-SE", { weekday: "short" });

  const clickHandler = onClick || null;
  const cursor = clickHandler ? "pointer" : "not-allowed";

  return html`<th
    class="${presentation.className}"
    @click=${clickHandler}
    title="${presentation.title}"
    style="cursor: ${cursor};"
  >
    ${weekday}<br />${day} ${month}
  </th>`;
}
