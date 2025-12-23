/**
 * Add Teacher Modal Component
 * Handles the add modal UI for teachers
 */
import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherFormService } from "../services/teacher-form.service.js";
import {
  createTeacherFromForm,
  resetTeacherForm,
} from "../services/teacher-tab.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class AddTeacherModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    formValid: { type: Boolean },
    selectedCompatibleCourseIds: { type: Array, attribute: false },
    selectedExaminatorCourseIds: { type: Array, attribute: false },
  };

  constructor() {
    super();
    this.open = false;
    this.formValid = false;
    this.selectedCompatibleCourseIds = [];
    this.selectedExaminatorCourseIds = [];
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._resetForm();
    }
  }

  _resetForm() {
    resetTeacherForm(this.renderRoot);
    this.selectedCompatibleCourseIds = [];
    this.selectedExaminatorCourseIds = [];
    this._updateFormValidity();
  }

  _handleSelectChange(e) {
    const targetId = e?.target?.id;
    if (targetId === "teacherCourses") {
      this.selectedCompatibleCourseIds = (e.detail.values || []).map(String);
      // Remove examinator courses that are not compatible
      this.selectedExaminatorCourseIds =
        this.selectedExaminatorCourseIds.filter((id) =>
          this.selectedCompatibleCourseIds.includes(id)
        );
    } else if (targetId === "teacherExaminatorCourses") {
      this.selectedExaminatorCourseIds = (e.detail.values || []).map(String);
    }
    this._updateFormValidity();
  }

  _updateFormValidity() {
    const baseValid = FormService.isFormValid(this.renderRoot);
    if (!baseValid) {
      this.formValid = false;
      return;
    }
    const { name } = FormService.extractFormData(this.renderRoot, {
      name: "teacherName",
    });
    this.formValid = TeacherFormService.isTeacherNameUnique(name);
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!FormService.isFormValid(this.renderRoot)) {
      FormService.reportFormValidity(this.renderRoot);
      return;
    }
    try {
      const newTeacher = await createTeacherFromForm(this.renderRoot);
      this._resetForm();
      this.dispatchEvent(
        new CustomEvent("teacher-added", { detail: newTeacher })
      );
      showSuccessMessage(this, "Lärare tillagd!");
      this.open = false;
    } catch (err) {
      showErrorMessage(this, `Kunde inte lägga till lärare: ${err.message}`);
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

  render() {
    if (!this.open) return html``;
    return html`
      <henry-modal open title="Lägg till Lärare" @close="${this._handleClose}">
        <form
          @submit="${this._handleSubmit}"
          @select-change="${this._handleSelectChange}"
          @radio-change="${this._updateFormValidity}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input id="teacherName" label="Namn" required></henry-input>

            <henry-radio-group
              id="teacherDepartment"
              name="teacherDepartment"
              label="Avdelning"
              required
              .options=${[
                { value: "AIJ", label: "AIJ" },
                { value: "AIE", label: "AIE" },
                { value: "AF", label: "AF" },
              ]}
            ></henry-radio-group>

            <henry-select
              id="teacherCourses"
              label="Kompatibla kurser"
              multiple
              size="5"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: c.code,
              }))}
            ></henry-select>

            ${keyed(
              this.selectedCompatibleCourseIds.join(","),
              html`<henry-select
                id="teacherExaminatorCourses"
                label="Examinator för kurser"
                multiple
                size="5"
                .options=${store
                  .getCourses()
                  .filter((c) =>
                    this.selectedCompatibleCourseIds.includes(
                      c.course_id.toString()
                    )
                  )
                  .map((c) => ({
                    value: c.course_id.toString(),
                    label: c.code,
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
            variant="primary"
            ?disabled="${!this.formValid}"
            @click="${() =>
              this.renderRoot.querySelector("form").requestSubmit()}"
            >Lägg till lärare</henry-button
          >
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("add-teacher-modal", AddTeacherModal);
