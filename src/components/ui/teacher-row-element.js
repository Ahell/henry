import { LitElement, html } from 'lit';

export class TeacherRowElement extends LitElement {
  static properties = {
    teacher: { type: Object },
    dates: { type: Array },
    cellRenderer: { type: Object },
  };

  // Light DOM to preserve table structure
  createRenderRoot() { return this; }

  constructor() {
    super();
    this.teacher = null;
    this.dates = [];
    this.cellRenderer = null;
  }

  render() {
    return html`
      <tr>
        <td>
          <span class="teacher-name">${this.teacher?.name ?? ''}</span>
          <span class="teacher-department">${this.teacher?.home_department ?? ''}</span>
        </td>
        ${this.dates.map(d => (this.cellRenderer ? this.cellRenderer(this.teacher, d) : html`<td></td>`))}
      </tr>
    `;
  }
}

customElements.define('teacher-row', TeacherRowElement);
