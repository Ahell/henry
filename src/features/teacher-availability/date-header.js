import { html } from "lit";

/**
 * Render a <th> for a slot date header in overview table.
 * This is a lightweight helper that returns a TemplateResult for use inside a table row.
 * @param {string} dateStr - start_date string
 * @param {number} slotId - optional slot id
 * @param {function} onEnterDetail - callback (slotDate, slotId) to be called on click
 * @returns {import('lit').TemplateResult}
 */
export function renderDateHeader(dateStr, slotId, onEnterDetail) {
  const d = new Date(dateStr);
  const year = d.getFullYear().toString().slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const compact = `${year}${month}${day}`;

  const handler = (e) => {
    if (typeof onEnterDetail === "function") onEnterDetail(dateStr, slotId);
  };

  return html`<th
    class="slot-header"
    @click=${handler}
    title="Klicka för att se dag-för-dag-vy"
  >
    ${compact}
  </th>`;
}
