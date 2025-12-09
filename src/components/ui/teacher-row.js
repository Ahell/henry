import { html } from 'lit';

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
