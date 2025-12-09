import { LitElement, html } from 'lit';

export class DetailTable extends LitElement {
  static properties = {
    teachers: { type: Array },
    days: { type: Array },
    slotId: { type: Number },
    slotDate: { type: String },
    isPainting: { type: Boolean },
    dayHeaderRenderer: { type: Object },
    teacherDayCellRenderer: { type: Object },
  };

  createRenderRoot() { return this; }

  constructor() {
    super();
    this.teachers = [];
    this.days = [];
    this.slotId = null;
    this.slotDate = '';
    this.isPainting = false;
    this.dayHeaderRenderer = null;
    this.teacherDayCellRenderer = null;
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
              ${this.days.map(day => (this.dayHeaderRenderer ? this.dayHeaderRenderer(day) : html`<th>${day}</th>`))}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map(teacher => html`
              <teacher-row .teacher=${teacher} .dates=${this.days} .cellRenderer=${this.teacherDayCellRenderer}></teacher-row>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('detail-table', DetailTable);
