import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";

/**
 * Course Edit Modal Component
 * Handles the edit modal UI for courses
 */
export class CourseModal extends LitElement {
  static properties = {
    courseId: { type: Number },
    open: { type: Boolean },
  };

  constructor() {
    super();
    this.courseId = null;
    this.open = false;
  }

  render() {
    if (!this.open || !this.courseId) return html``;

    const course = store.getCourse(this.courseId);
    if (!course) return html``;

    return html`
      <henry-modal open title="Redigera Kurs" @close="${this._handleClose}">
        <form @submit="${this._handleSubmit}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-code"
              label="Kurskod"
              .value="${course.code}"
              required
            ></henry-input>

            <henry-input
              id="edit-name"
              label="Kursnamn"
              .value="${course.name}"
              required
            ></henry-input>

            <henry-select
              id="edit-prerequisites"
              label="Spärrkurser"
              multiple
              size="5"
              .options=${store
                .getCourses()
                .filter((c) => c.course_id !== course.course_id)
                .map((c) => ({
                  value: c.course_id.toString(),
                  label: c.code,
                  selected: course.prerequisites?.includes(c.course_id),
                }))}
            ></henry-select>

            <henry-select
              id="edit-credits"
              label="Högskolepoäng"
              required
              .options=${[
                {
                  value: "7.5",
                  label: "7,5 hp",
                  selected: (course.credits ?? 7.5) === 7.5,
                },
                {
                  value: "15",
                  label: "15 hp",
                  selected: course.credits === 15,
                },
              ]}
            ></henry-select>

            <henry-select
              id="edit-compatible-teachers"
              label="Kompatibla lärare"
              multiple
              size="5"
              .options=${store.getTeachers().map((t) => ({
                value: t.teacher_id.toString(),
                label: t.name,
                selected: t.compatible_courses?.includes(course.course_id),
              }))}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Avbryt
          </henry-button>
          <henry-button variant="success" @click="${this._handleSave}">
            💾 Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSubmit(e) {
    e.preventDefault();
    this._handleSave();
  }

  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSave() {
    const root = this.shadowRoot;

    const formData = FormService.extractFormData(root, {
      code: "edit-code",
      name: "edit-name",
      credits: { id: "edit-credits", transform: (value) => Number(value) },
      prerequisites: { id: "edit-prerequisites", type: "select-multiple" },
      selectedTeacherIds: {
        id: "edit-compatible-teachers",
        type: "select-multiple",
      },
    });

    this.dispatchEvent(
      new CustomEvent("modal-save", {
        detail: { courseId: this.courseId, formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  // Don't use shadow DOM to allow parent styles
  createRenderRoot() {
    return this;
  }
}

customElements.define("course-modal", CourseModal);
