import { html } from 'lit';

/**
 * Render a teacher row (<tr>) and map dates/days to cells via a cellRenderer function.
 * @param {object} teacher
 * @param {Array<string>} dates
 * @param {function} cellRenderer - (teacher, date) => TemplateResult
 * @returns {import('lit').TemplateResult}
 */
export function renderTeacherRow(teacher, dates, cellRenderer) {
  return html`
    <tr>
      <td>
        <span class="teacher-name">${teacher.name}</span>
        <span class="teacher-department">${teacher.home_department}</span>
      </td>
      ${dates.map((d) => cellRenderer(teacher, d))}
    </tr>
  `;
}
