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
  const getISOWeek = (date) => {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    // Thursday in current week decides the year
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  };

  const clickHandler = onClick || null;
  const cursor = clickHandler ? "pointer" : "not-allowed";

  // Map presentation.className to a canonical teaching-state for accessibility
  const stateMap = {
    "teaching-day-default-header": "default-active",
    "teaching-day-default-dimmed-header": "default-dimmed",
    "teaching-day-alt-header": "alt",
    "exam-date-locked-header": "exam-locked",
    "exam-date-unlocked-header": "exam-unlocked",
    "exam-date-new-header": "exam-new",
  };
  const getState = (className) => {
    if (!className) return "none";
    for (const key of Object.keys(stateMap)) {
      if (className.includes(key)) return stateMap[key];
    }
    return "none";
  };
  const teachingState = getState(presentation.className);

  return html`<th
    class="slot-header ${presentation.className}"
    @click=${clickHandler}
    title="${presentation.title}"
    style="cursor: ${cursor};"
    role=${clickHandler ? "button" : "columnheader"}
    aria-pressed=${teachingState === "default-active" || teachingState === "alt"
      ? "true"
      : "false"}
    data-teaching-state=${teachingState}
    tabindex=${clickHandler ? "0" : "-1"}
  >
    <div
      style="display: flex; flex-direction: column; gap: 2px; align-items: center;"
    >
      <div style="font-weight: 700;">${compact}</div>
    </div>
  </th>`;
}
