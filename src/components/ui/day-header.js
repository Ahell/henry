import { html } from 'lit';

/**
 * Render a <th> for a day header in the detail view.
 * The parent computes `presentation` via `getDetailDayHeaderPresentation` and passes it in.
 * @param {string} dateStr
 * @param {{className:string,title:string,clickMode:('toggleTeachingDay'|'setExamDate'|null)}} presentation
 * @param {function|null} onClick
 * @returns {import('lit').TemplateResult}
 */
export function renderDayHeader(dateStr, presentation, onClick) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('sv-SE', { month: 'short' });
  const weekday = d.toLocaleString('sv-SE', { weekday: 'short' });

  const clickHandler = onClick || null;

  return html`<th
    class="${presentation.className}"
    @click=${clickHandler}
    title="${presentation.title}"
    style="cursor: ${clickHandler ? 'pointer' : 'not-allowed'};"
  >
    ${weekday}<br />${day} ${month}
  </th>`;
}
