import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseFormService } from "../services/course-form.service.js";
import { CourseService } from "../services/course.service.js";

/**
 * Course Modal Component
 * Unified modal for both adding and editing courses
 */
export class CourseModal extends LitElement {
  static properties = {
    mode: { type: String }, // "add" or "edit"
    courseId: { type: Number },
    open: { type: Boolean },
    formValid: { type: Boolean },
    selectedPrerequisiteIds: { type: Array, attribute: false },
    selectedCompatibleTeacherIds: { type: Array, attribute: false },
    selectedExaminatorTeacherId: { type: String, attribute: false },
  };

  constructor() {
    super();
    this.mode = "add"; // default to add mode
    this.courseId = null;
    this.open = false;
    this.formValid = false;
    this.selectedPrerequisiteIds = [];
    this.selectedCompatibleTeacherIds = [];
    this.selectedExaminatorTeacherId = "";
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      if (this.mode === "add") {
        this._resetForm();
      } else if (this.mode === "edit" && this.courseId) {
        this._loadCourseData();
      }
    }
  }

  willUpdate(changedProperties) {
    if (
      (changedProperties.has("open") || changedProperties.has("courseId")) &&
      this.open &&
      this.mode === "edit" &&
      this.courseId
    ) {
      this._loadCourseData();
    }
  }

  _resetForm() {
    CourseFormService.resetForm(this.renderRoot);
    Object.assign(this, CourseFormService.getInitialStateForAdd());
    this._updateFormValidity();
  }

  _loadCourseData() {
    Object.assign(
      this,
      CourseFormService.getInitialStateForEdit(this.courseId)
    );
    this._updateFormValidity();
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _handleSelectChange(e) {
    const targetId = e?.target?.id;
    const values = Array.isArray(e?.detail?.values) ? e.detail.values : null;
    if (!targetId) return;

    const prefix = this.mode === "edit" ? "edit-" : "course";

    if (
      targetId === `${prefix}prerequisites` ||
      targetId === `${prefix}-prerequisites`
    ) {
      if (!values) return;
      Object.assign(this, CourseFormService.handlePrerequisiteChange(values));
    }

    if (
      targetId === `${prefix}Teachers` ||
      targetId === `${prefix}-compatible-teachers`
    ) {
      if (!values) return;
      Object.assign(
        this,
        CourseFormService.handleCompatibleTeachersChange(
          values,
          this.selectedExaminatorTeacherId
        )
      );
    }

    if (
      targetId === `${prefix}Examinator` ||
      targetId === `${prefix}-examinator`
    ) {
      if (values) {
        Object.assign(
          this,
          CourseFormService.handleExaminatorChange(values[0])
        );
      } else {
        Object.assign(
          this,
          CourseFormService.handleExaminatorChange(e?.detail?.value)
        );
      }
    }

    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = CourseFormService.isFormValid(
      this.renderRoot,
      this.mode,
      this.courseId
    );
  }

  render() {
    if (!this.open) return html``;
    if (this.mode === "edit" && !this.courseId) return html``;

    const course = this.mode === "edit" ? store.getCourse(this.courseId) : null;
    const title = this.mode === "add" ? "Lägg till Kurs" : "Redigera Kurs";
    const buttonText = this.mode === "add" ? "Lägg till kurs" : "💾 Spara";
    const buttonVariant = this.mode === "add" ? "primary" : "success";

    const prefix = this.mode === "edit" ? "edit-" : "course";

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
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
              id="${prefix}code"
              label="Kurskod"
              .value="${course?.code || ""}"
              required
            ></henry-input>

            <henry-input
              id="${prefix}name"
              label="Kursnamn"
              .value="${course?.name || ""}"
              required
            ></henry-input>

            <henry-radio-group
              id="${prefix}credits"
              name="${prefix}credits"
              label="Högskolepoäng"
              required
              .value="${course
                ? String(Number(course.credits) === 15 ? 15 : 7.5)
                : ""}"
              .options=${[
                { value: "7.5", label: "7,5 hp" },
                { value: "15", label: "15 hp" },
              ]}
            ></henry-radio-group>

            <henry-select
              id="${prefix}prerequisites"
              label="Spärrkurser"
              multiple
              size="5"
              .options=${store
                .getCourses()
                .filter(
                  (c) => this.mode === "add" || c.course_id !== course.course_id
                )
                .map((c) => ({
                  value: c.course_id.toString(),
                  label: c.code,
                  selected: this.selectedPrerequisiteIds.includes(
                    c.course_id.toString()
                  ),
                }))}
            ></henry-select>

            <henry-select
              id="${prefix}Teachers"
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

            ${keyed(
              this.selectedCompatibleTeacherIds.join(","),
              html`<henry-select
                id="${prefix}Examinator"
                label="Examinator"
                size="1"
                placeholder="Ingen vald"
                .value="${this.selectedExaminatorTeacherId}"
                .options=${store
                  .getTeachers()
                  .filter((t) =>
                    this.selectedCompatibleTeacherIds.includes(
                      t.teacher_id.toString()
                    )
                  )
                  .map((t) => ({
                    value: t.teacher_id.toString(),
                    label: t.name,
                  }))}
              ></henry-select>`
            )}
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this._handleClose}">
            Avbryt
          </henry-button>
          <henry-button
            variant="${buttonVariant}"
            @click="${this.mode === "add"
              ? () => this.renderRoot.querySelector("form").requestSubmit()
              : this._handleSave}"
            ?disabled="${!this.formValid}"
          >
            ${buttonText}
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSubmit(e) {
    e.preventDefault();
    if (this.mode === "add") {
      this._handleAdd();
    } else {
      this._handleSave();
    }
  }

  _handleClose() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleAdd() {
    if (
      !CourseFormService.isFormValid(this.renderRoot, this.mode, this.courseId)
    ) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }

    const formData = CourseFormService.extractFormData(
      this.renderRoot,
      this.mode
    );
    formData.examinatorTeacherId = this.selectedExaminatorTeacherId
      ? Number(this.selectedExaminatorTeacherId)
      : null;

    this._resetForm();
    this.dispatchEvent(
      new CustomEvent("modal-save", {
        detail: { action: "add", formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSave() {
    if (
      !CourseFormService.isFormValid(this.renderRoot, this.mode, this.courseId)
    ) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }

    const formData = CourseFormService.extractFormData(
      this.renderRoot,
      this.mode
    );
    formData.examinatorTeacherId = this.selectedExaminatorTeacherId
      ? Number(this.selectedExaminatorTeacherId)
      : null;

    this.dispatchEvent(
      new CustomEvent("modal-save", {
        detail: { action: "update", courseId: this.courseId, formData },
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
