import { LitElement, html } from 'lit';
import { renderTeacherRow } from './teacher-row.js';

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
    console.log('OverviewTable render:', { slotDates: this.slotDates?.length, dateHeaderRenderer: !!this.dateHeaderRenderer, teacherCellRenderer: !!this.teacherCellRenderer });
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
            ${this.teachers.map(teacher => renderTeacherRow(teacher, this.slotDates, this.teacherCellRenderer))}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('overview-table', OverviewTable);
