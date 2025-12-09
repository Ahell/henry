import { html } from 'lit';

/**
 * Render the sticky left column cell for a teacher row (name + department).
 * Returns a <td> TemplateResult suitable to be placed inside a <tr>.
 * @param {object} teacher
 */
export function renderTeacherInfo(teacher) {
  return html`
    <td>
      <span class="teacher-name">${teacher?.name ?? ''}</span>
      <span class="teacher-department">${teacher?.home_department ?? ''}</span>
    </td>
  `;
}
