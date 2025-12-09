import { html } from "lit";
import { renderTeacherInfo } from "./teacher-info.js";

export function renderTeacherRow(teacher, dates, cellRenderer) {
  return html`
    <tr>
      ${renderTeacherInfo(teacher)}
      ${dates.map((d) => cellRenderer(teacher, d))}
    </tr>
  `;
}
