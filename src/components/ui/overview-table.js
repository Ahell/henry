import { LitElement, html } from 'lit';

export class OverviewTable extends LitElement {
  static properties = {
    teachers: { type: Array },
    slotDates: { type: Array },
    isPainting: { type: Boolean },
    dateHeaderRenderer: { type: Object },
    teacherCellRenderer: { type: Object },
  };

  // Render into light DOM to reuse page CSS and table layout
  createRenderRoot() { return this; }

  constructor() {
    super();
    this.teachers = [];
    this.slotDates = [];
    this.isPainting = false;
    this.dateHeaderRenderer = null;
    this.teacherCellRenderer = null;
  }

  render() {
    return html`
      <div
        class="table-container ${this.isPainting ? 'painting-active' : ''}"
      >
        <table class="teacher-timeline-table">
          <thead>
            <tr>
              <th>Lärare</th>
              ${this.slotDates.map(date => (this.dateHeaderRenderer ? this.dateHeaderRenderer(date) : html`<th>${date}</th>`))}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map(teacher => html`
              <tr>
                <td>
                  <span class="teacher-name">${teacher.name}</span>
                  <span class="teacher-department">${teacher.home_department}</span>
                </td>
                ${this.slotDates.map(date => (this.teacherCellRenderer ? this.teacherCellRenderer(teacher, date) : html`<td></td>`))}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('overview-table', OverviewTable);
