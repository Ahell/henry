import { LitElement, html } from "lit";
import { store } from "../../utils/store.js";

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

  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.teachers = [];
    this.days = [];
    this.slotId = null;
    this.slotDate = "";
    this.isPainting = false;
    this.dayHeaderRenderer = null;
    this.teacherDayCellRenderer = null;
  }

  render() {
    let days = this.days && this.days.length ? this.days : store.getSlotDays(this.slotId || this.slotDate);
    // Robust fallback: if store didn't compute days (maybe slot date mismatched), compute days from store.slots directly
    if ((!days || days.length === 0) && store && Array.isArray(store.slots)) {
      const slotIdOrDate = this.slotId || this.slotDate;
      const slot = typeof slotIdOrDate === "number"
        ? store.slots.find((s) => s.slot_id === slotIdOrDate)
        : store.slots.find((s) => s.start_date === slotIdOrDate);
      if (slot) {
        const allSlots = store.slots.slice().sort((a,b)=> new Date(a.start_date)-new Date(b.start_date));
        const idx = allSlots.findIndex((s)=> s.slot_id === slot.slot_id);
        let endDate;
        if (idx >= 0 && idx < allSlots.length - 1) {
          endDate = new Date(allSlots[idx+1].start_date);
        } else {
          endDate = new Date(slot.start_date);
          endDate.setDate(endDate.getDate()+28);
        }
        days = [];
        const current = new Date(slot.start_date);
        while (current < endDate) {
          days.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate()+1);
        }
      }
    }
    if (!days || days.length === 0) {
      console.warn("DetailTable: computed days is empty", { slotId: this.slotId, slotDate: this.slotDate, days });
    }
    return html`
      <div class="table-container ${this.isPainting ? "painting-active" : ""}">
        <table class="teacher-timeline-table">
          <thead>
            <tr>
              <th>Lärare</th>
              ${days.map((day) =>
                this.dayHeaderRenderer
                  ? this.dayHeaderRenderer(day)
                  : html`<th>${day}</th>`
              )}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map(
              (teacher) => html`
                <tr>
                  ${renderTeacherInfoCell(teacher)}
                  ${days.map((d) =>
                    this.teacherDayCellRenderer
                      ? this.teacherDayCellRenderer(teacher, d)
                      : html`<td></td>`
                  )}
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

const renderTeacherInfoCell = (teacher) => html`
  <td>
    <span class="teacher-name">${teacher?.name ?? ""}</span>
    <span class="teacher-department">${teacher?.home_department ?? ""}</span>
  </td>
`;

customElements.define("detail-table", DetailTable);
