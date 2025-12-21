import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseFormService } from "../services/course-form.service.js";

/**
 * Course Edit Modal Component
 * Handles the edit modal UI for courses
 */
export class CourseModal extends LitElement {
  static properties = {
    courseId: { type: Number },
    open: { type: Boolean },
    formValid: { type: Boolean },
    selectedPrerequisiteIds: { type: Array, attribute: false },
    selectedCompatibleTeacherIds: { type: Array, attribute: false },
  };

  constructor() {
    super();
    this.courseId = null;
    this.open = false;
    this.formValid = false;
    this.selectedPrerequisiteIds = [];
    this.selectedCompatibleTeacherIds = [];
  }

  willUpdate(changedProperties) {
    if (
      (changedProperties.has("open") || changedProperties.has("courseId")) &&
      this.open &&
      this.courseId
    ) {
      const course = store.getCourse(this.courseId);
      if (!course) return;

      this.selectedPrerequisiteIds = Array.isArray(course.prerequisites)
        ? course.prerequisites.map(String)
        : [];
      this.selectedCompatibleTeacherIds = (store.getTeachers() || [])
        .filter((t) => t.compatible_courses?.includes(course.course_id))
        .map((t) => String(t.teacher_id));
    }
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  updated(changedProperties) {
    if (changedProperties.has("open") || changedProperties.has("courseId")) {
      if (this.open && this.courseId) {
        this._updateFormValidity();
      } else {
        this.formValid = false;
      }
    }
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _handleSelectChange(e) {
    const targetId = e?.target?.id;
    const values = Array.isArray(e?.detail?.values) ? e.detail.values : null;
    if (!targetId || !values) return;

    if (targetId === "edit-prerequisites") {
      this.selectedPrerequisiteIds = values.map(String);
      return;
    }

    if (targetId === "edit-compatible-teachers") {
      this.selectedCompatibleTeacherIds = values.map(String);
    }
  }

  _updateFormValidity() {
    const baseValid = FormService.isFormValid(this.renderRoot);
    if (!baseValid) {
      this.formValid = false;
      return;
    }

    const { code, name } = FormService.extractFormData(this.renderRoot, {
      code: "edit-code",
      name: "edit-name",
    });
    this.formValid =
      CourseFormService.isCourseCodeUnique(code, this.courseId) &&
      CourseFormService.isCourseNameUnique(name, this.courseId);
  }

  render() {
    if (!this.open || !this.courseId) return html``;

    const course = store.getCourse(this.courseId);
    if (!course) return html``;
    const normalizedCredits = Number(course.credits) === 15 ? 15 : 7.5;
    const examinatorTeacherId =
      store.getCourseExaminatorTeacherId(course.course_id) ??
      course.examinator_teacher_id ??
      "";

    return html`
      <henry-modal open title="Redigera Kurs" @close="${this._handleClose}">
        <form
          @submit="${this._handleSubmit}"
          @input="${this._handleInputChange}"
          @change="${this._handleInputChange}"
          @input-change="${this._handleInputChange}"
          @select-change="${(e) => {
            this._handleSelectChange(e);
            this._handleInputChange();
          }}"
          @radio-change="${this._handleInputChange}"
          @textarea-change="${this._handleInputChange}"
        >
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
              id="edit-examinator"
              label="Examinator"
              size="1"
              placeholder="Ingen vald"
              .value="${String(examinatorTeacherId ?? "")}"
              .options=${store.getTeachers().map((t) => ({
                value: t.teacher_id.toString(),
                label: t.name,
              }))}
            ></henry-select>

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
                  selected: this.selectedPrerequisiteIds.includes(
                    c.course_id.toString()
                  ),
                }))}
            ></henry-select>

            <henry-radio-group
              id="edit-credits"
              name="edit-credits"
              label="Högskolepoäng"
              required
              .value="${String(normalizedCredits)}"
              .options=${[
                { value: "7.5", label: "7,5 hp" },
                { value: "15", label: "15 hp" },
              ]}
            ></henry-radio-group>

            <henry-select
              id="edit-compatible-teachers"
              label="Kompatibla lärare"
              multiple
              size="5"
              .options=${store.getTeachers().map((t) => ({
                value: t.teacher_id.toString(),
                label: t.name,
                selected: this.selectedCompatibleTeacherIds.includes(
                  t.teacher_id.toString()
                ),
              }))}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Avbryt
          </henry-button>
          <henry-button variant="success" @click="${this._handleSave}" ?disabled="${!this.formValid}">
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
    if (!FormService.isFormValid(this.renderRoot)) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }

    const root = this.renderRoot;

    const formData = FormService.extractFormData(root, {
      code: "edit-code",
      name: "edit-name",
      examinatorTeacherId: {
        id: "edit-examinator",
        transform: (value) => (value ? Number(value) : null),
      },
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
