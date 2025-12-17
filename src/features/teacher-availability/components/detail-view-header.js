import { LitElement, html } from "lit";
import "../../../components/ui/button.js";
import { detailViewHeaderStyles } from "../styles/detail-view-header.styles.js";

export class DetailViewHeader extends LitElement {
  static properties = {
    slotTitle: { type: String },
    daysLength: { type: Number },
    isEditingExamDate: { type: Boolean },
    courses: { type: Array },
    courseFilter: { type: Number },
  };

  // Keep default shadow DOM here - the header is a div outside of the table
  static styles = detailViewHeaderStyles;

  constructor() {
    super();
    this.slotTitle = "";
    this.daysLength = 0;
    this.isEditingExamDate = false;
    this.courses = [];
    this.courseFilter = null;
  }

  render() {
    const hasCourses = Array.isArray(this.courses) && this.courses.length > 0;
    return html`
      <div class="detail-view-header">
        <div class="title-block">
          <div class="detail-view-title">${this.slotTitle}</div>
          ${this.daysLength
            ? html`<span class="pill">${this.daysLength} dagar</span>`
            : ""}
          ${hasCourses
            ? html`
                <label class="pill select-pill">
                  <span>Kurser</span>
                  <select
                    @change="${this._onCourseChange}"
                    .value=${this.courseFilter ?? "all"}
                  >
                    <option value="all">Alla kurser</option>
                    ${this.courses.map(
                      (c) =>
                        html`<option value=${c.course_id}>
                          ${c.code || c.name || c.course_id}
                        </option>`
                    )}
                  </select>
                </label>
              `
            : ""}
        </div>
        <div class="detail-view-actions">
          <henry-button
            variant="${this.isEditingExamDate ? "primary" : "outline"}"
            size="small"
            @click="${this._toggleExamDateEditing}"
          >
            ${this.isEditingExamDate
              ? "Avbryt ändring"
              : "Ändra tentamensdatum"}
          </henry-button>
          <henry-button
            variant="secondary"
            size="small"
            @click="${this._exitDetailView}"
          >
            Avsluta detaljläge
          </henry-button>
        </div>
      </div>
    `;
  }

  _toggleExamDateEditing() {
    this.dispatchEvent(
      new CustomEvent("toggle-edit-exam", {
        bubbles: true,
        composed: true,
        detail: { isEditing: !this.isEditingExamDate },
      })
    );
  }

  _exitDetailView() {
    this.dispatchEvent(
      new CustomEvent("exit-detail", { bubbles: true, composed: true })
    );
  }

  _onCourseChange(e) {
    const courseId = e?.target?.value ?? "all";
    this.dispatchEvent(
      new CustomEvent("course-filter-change", {
        detail: { courseId },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("detail-view-header", DetailViewHeader);
