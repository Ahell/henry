/**
 * Teacher Modal Component
 * Unified modal for adding and editing teachers
 */
import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import { TeacherFormService } from "../services/teacher-form.service.js";
import { TeacherService } from "../services/teacher.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";

export class TeacherModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    mode: { type: String }, // 'add' or 'edit'
    teacherId: { type: Number },
    formValid: { type: Boolean },
    selectedCompatibleCourseIds: { type: Array, attribute: false },
    selectedExaminatorCourseIds: { type: Array, attribute: false },
  };

  constructor() {
    super();
    this.open = false;
    this.mode = "add";
    this.teacherId = null;
    this.formValid = false;
    this.selectedCompatibleCourseIds = [];
    this.selectedExaminatorCourseIds = [];
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this._initializeForm();
    }
  }

  async _initializeForm() {
    await this.updateComplete;
    
    // Get initial state
    let initialState;
    if (this.mode === "add") {
      initialState = TeacherFormService.getInitialStateForAdd();
    } else {
      initialState = TeacherFormService.getInitialStateForEdit(this.teacherId);
    }

    this.selectedCompatibleCourseIds = initialState.selectedCompatibleCourseIds;
    this.selectedExaminatorCourseIds = initialState.selectedExaminatorCourseIds;
    this.formValid = initialState.formValid;

    // Populate form fields
    const teacher = this.mode === "edit" ? store.getTeacher(this.teacherId) : null;
    TeacherFormService.populateForm(this.renderRoot, teacher, this.mode);

    // Initial validation check
    this._updateFormValidity();
  }

  _handleSelectChange(e) {
    const targetId = e?.target?.id;
    const prefix = this.mode === "edit" ? "editTeacher" : "teacher";
    
    if (targetId === `${prefix}Courses`) {
      this.selectedCompatibleCourseIds = (e.detail.values || []).map(String);
      // Remove examinator courses that are not compatible
      this.selectedExaminatorCourseIds =
        this.selectedExaminatorCourseIds.filter((id) =>
          this.selectedCompatibleCourseIds.includes(id)
        );
    } else if (targetId === `${prefix}ExaminatorCourses`) {
      this.selectedExaminatorCourseIds = (e.detail.values || []).map(String);
    }
    this._updateFormValidity();
  }

  _updateFormValidity() {
    this.formValid = TeacherFormService.isFormValid(
      this.renderRoot, 
      this.mode, 
      this.teacherId
    );
  }

  async _handleSubmit(e) {
    e.preventDefault();
    if (!TeacherFormService.isFormValid(this.renderRoot, this.mode, this.teacherId)) {
      // Force validation feedback if needed
      return;
    }

    try {
      const formData = TeacherFormService.extractFormData(this.renderRoot, this.mode);
      let result;

      if (this.mode === "add") {
        result = await TeacherService.saveNewTeacher(formData);
        showSuccessMessage(this, "Lärare tillagd!");
      } else {
        result = await TeacherService.saveUpdatedTeacher(this.teacherId, formData);
        showSuccessMessage(this, "Lärare uppdaterad!");
      }

      this.dispatchEvent(
        new CustomEvent("teacher-saved", { detail: result })
      );
      this._handleClose();
    } catch (err) {
      showErrorMessage(this, `Kunde inte spara lärare: ${err.message}`);
    }
  }

  _handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.open) return html``;

    const title = this.mode === "add" ? "Lägg till Lärare" : "Redigera Lärare";
    const submitLabel = this.mode === "add" ? "Lägg till lärare" : "Spara ändringar";
    const prefix = this.mode === "edit" ? "editTeacher" : "teacher";

    return html`
      <henry-modal open title="${title}" @close="${this._handleClose}">
        <form
          @submit="${this._handleSubmit}"
          @select-change="${this._handleSelectChange}"
          @radio-change="${this._updateFormValidity}"
          @input="${this._updateFormValidity}"
        >
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input id="${prefix}Name" label="Namn" required></henry-input>

            <henry-radio-group
              id="${prefix}Department"
              name="${prefix}Department"
              label="Avdelning"
              required
              .options=${[
                { value: "AIJ", label: "AIJ" },
                { value: "AIE", label: "AIE" },
                { value: "AF", label: "AF" },
              ]}
            ></henry-radio-group>

            <henry-select
              id="${prefix}Courses"
              label="Kompatibla kurser"
              multiple
              size="5"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: c.code,
                selected: this.selectedCompatibleCourseIds.includes(
                  c.course_id.toString()
                ),
              }))}
            ></henry-select>

            ${keyed(
              this.selectedCompatibleCourseIds.join(","),
              html`<henry-select
                id="${prefix}ExaminatorCourses"
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
                    selected: this.selectedExaminatorCourseIds.includes(
                      c.course_id.toString()
                    ),
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
            >${submitLabel}</henry-button
          >
        </div>
      </henry-modal>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("teacher-modal", TeacherModal);
