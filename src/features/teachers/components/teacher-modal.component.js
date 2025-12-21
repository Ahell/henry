import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherFormService } from "../services/teacher-form.service.js";

/**
 * Teacher Edit Modal Component
 * Handles the edit modal UI for teachers
 */
export class TeacherModal extends LitElement {
  static properties = {
    teacherId: { type: Number },
    open: { type: Boolean },
    formValid: { type: Boolean },
    selectedCompatibleCourseIds: { type: Array, attribute: false },
    selectedExaminatorCourseIds: { type: Array, attribute: false },
  };

  constructor() {
    super();
    this.teacherId = null;
    this.open = false;
    this.formValid = false;
    this.selectedCompatibleCourseIds = [];
    this.selectedExaminatorCourseIds = [];
  }

  willUpdate(changedProperties) {
    if (
      (changedProperties.has("open") || changedProperties.has("teacherId")) &&
      this.open &&
      this.teacherId
    ) {
      const teacher = store.getTeacher(this.teacherId);
      if (!teacher) return;
      this.selectedCompatibleCourseIds = Array.isArray(teacher.compatible_courses)
        ? teacher.compatible_courses.map(String)
        : [];
      this.selectedExaminatorCourseIds = (store.getExaminatorCoursesForTeacher(this.teacherId) || [])
        .map((c) => String(c.course_id));
    }
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  updated(changedProperties) {
    if (changedProperties.has("open") || changedProperties.has("teacherId")) {
      if (this.open && this.teacherId) {
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
    if (targetId === "edit-courses") {
      const nextCompat = values.map(String);
      this.selectedCompatibleCourseIds = nextCompat;
      // Keep examinator selection consistent with compatibility selection
      this.selectedExaminatorCourseIds = (this.selectedExaminatorCourseIds || []).filter(
        (id) => nextCompat.includes(String(id))
      );
      return;
    }
    if (targetId === "edit-examinator-courses") {
      this.selectedExaminatorCourseIds = values.map(String);
    }
  }

  _updateFormValidity() {
    const baseValid = FormService.isFormValid(this.renderRoot);
    if (!baseValid) {
      this.formValid = false;
      return;
    }

    const { name } = FormService.extractFormData(this.renderRoot, {
      name: "edit-name",
    });
    this.formValid = TeacherFormService.isTeacherNameUnique(name, this.teacherId);
  }

  render() {
    if (!this.open || !this.teacherId) return html``;

    const teacher = store.getTeacher(this.teacherId);
    if (!teacher) return html``;

    const departments = ["AIJ", "AIE", "AF"];
    const compatibleSet = new Set(
      (this.selectedCompatibleCourseIds || []).map(String)
    );
    const examinatorCourseOptions = (store.getCourses() || [])
      .filter((c) => compatibleSet.has(String(c.course_id)))
      .filter((c) => {
        const tid = store.getCourseExaminatorTeacherId(c.course_id);
        return tid == null || String(tid) === String(this.teacherId);
      })
      .map((c) => ({
        value: c.course_id.toString(),
        label: `${c.code} - ${c.name}`,
        selected: this.selectedExaminatorCourseIds.includes(
          c.course_id.toString()
        ),
      }));

    return html`
      <henry-modal
        open
        title="Redigera Lärare"
        @close="${this._handleClose}"
      >
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
              id="edit-name"
              label="Namn"
              .value="${teacher.name}"
              required
            ></henry-input>

            <henry-radio-group
              id="edit-department"
              label="Avdelning"
              name="edit-department"
              required
              .value="${teacher.home_department}"
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-radio-group>

            <henry-select
              id="edit-courses"
              label="Kompatibla kurser"
              multiple
              size="8"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: `${c.code} - ${c.name}`,
                selected: this.selectedCompatibleCourseIds.includes(
                  c.course_id.toString()
                ),
              }))}
            ></henry-select>

            ${keyed(
              `${this.teacherId}:${this.selectedCompatibleCourseIds.join(",")}`,
              html`<henry-select
                id="edit-examinator-courses"
                label="Examinator för kurser"
                multiple
                size="8"
                .options=${examinatorCourseOptions}
              ></henry-select>`
            )}
          </div>
        </form>

        <div slot="footer">
          <henry-button
            variant="secondary"
            @click="${this._handleClose}"
          >
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${this._handleSave}"
            ?disabled="${!this.formValid}"
          >
            Spara
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
      name: "edit-name",
      home_department: { id: "edit-department", type: "radio" },
      compatible_courses: { id: "edit-courses", type: "select-multiple" },
      examinator_courses: {
        id: "edit-examinator-courses",
        type: "select-multiple",
      },
    });

    this.dispatchEvent(
      new CustomEvent("modal-save", {
        detail: { teacherId: this.teacherId, formData },
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

customElements.define("teacher-modal", TeacherModal);
