/**
 * Add Course Modal Component
 * Handles the add modal UI for courses
 */
import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseFormService } from "../services/course-form.service.js";
import {
  createCourseFromForm,
  resetCourseForm,
} from "../services/course-tab.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class AddCourseModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    formValid: { type: Boolean },
    selectedCompatibleTeacherIds: { type: Array, attribute: false },
    selectedExaminatorTeacherId: { type: String, attribute: false },
  };

  constructor() {
    super();
    this.open = false;
    this.formValid = false;
    this.selectedCompatibleTeacherIds = [];
    this.selectedExaminatorTeacherId = "";
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._resetForm();
    }
  }

  _resetForm() {
    resetCourseForm(this.renderRoot);
    this.selectedCompatibleTeacherIds = [];
    this.selectedExaminatorTeacherId = "";
    this._updateFormValidity();
  }

  _handleSelectChange(e) {
    const targetId = e?.target?.id;
    if (targetId === "courseTeachers") {
      this.selectedCompatibleTeacherIds = (e.detail.values || []).map(String);
      if (
        !this.selectedCompatibleTeacherIds.includes(
          this.selectedExaminatorTeacherId
        )
      ) {
        this.selectedExaminatorTeacherId = "";
      }
    } else if (targetId === "courseExaminator") {
      this.selectedExaminatorTeacherId = e.detail.values?.[0] || "";
    }
    this._updateFormValidity();
  }

  _updateFormValidity() {
    const baseValid = FormService.isFormValid(this.renderRoot);
    if (!baseValid) {
      this.formValid = false;
      return;
    }
    const { code, name } = FormService.extractFormData(this.renderRoot, {
      code: "courseCode",
      name: "courseName",
    });
    this.formValid =
      CourseFormService.isCourseCodeUnique(code) &&
      CourseFormService.isCourseNameUnique(name);
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!FormService.isFormValid(this.renderRoot)) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }
    try {
      const newCourse = await createCourseFromForm(this.renderRoot);
      this._resetForm();
      this.dispatchEvent(
        new CustomEvent("course-added", { detail: newCourse })
      );
      showSuccessMessage(this, "Kurs tillagd!");
      this.open = false;
    } catch (err) {
      showErrorMessage(this, `Kunde inte lägga till kurs: ${err.message}`);
    }
  }

  render() {
    if (!this.open) return html``;
    return html`
      <henry-modal
        open
        title="Lägg till Kurs"
        @close="${() => (this.open = false)}"
      >
        <form
          @submit="${this._handleSubmit}"
          @select-change="${this._handleSelectChange}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input id="courseCode" label="Kurskod" required></henry-input>
            <henry-input
              id="courseName"
              label="Kursnamn"
              required
            ></henry-input>
            <henry-radio-group
              id="courseCredits"
              name="courseCredits"
              label="Högskolepoäng"
              required
              .options=${[
                { value: "7.5", label: "7,5 hp" },
                { value: "15", label: "15 hp" },
              ]}
            ></henry-radio-group>
            <henry-select
              id="coursePrerequisites"
              label="Spärrkurser"
              multiple
              size="5"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: c.code,
              }))}
            ></henry-select>
            <henry-select
              id="courseTeachers"
              label="Kompatibla lärare"
              multiple
              size="5"
              .options=${store.getTeachers().map((t) => ({
                value: t.teacher_id.toString(),
                label: t.name,
              }))}
            ></henry-select>
            ${keyed(
              this.selectedCompatibleTeacherIds.join(","),
              html`<henry-select
                id="courseExaminator"
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
          <henry-button
            variant="secondary"
            @click="${() => (this.open = false)}"
            >Avbryt</henry-button
          >
          <henry-button
            variant="primary"
            ?disabled="${!this.formValid}"
            @click="${() =>
              this.renderRoot.querySelector("form").requestSubmit()}"
            >Lägg till kurs</henry-button
          >
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("add-course-modal", AddCourseModal);
