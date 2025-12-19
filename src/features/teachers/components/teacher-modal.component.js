import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";

/**
 * Teacher Edit Modal Component
 * Handles the edit modal UI for teachers
 */
export class TeacherModal extends LitElement {
  static properties = {
    teacherId: { type: Number },
    open: { type: Boolean },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.teacherId = null;
    this.open = false;
    this.formValid = false;
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

  _updateFormValidity() {
    this.formValid = FormService.isFormValid(this.renderRoot);
  }

  render() {
    if (!this.open || !this.teacherId) return html``;

    const teacher = store.getTeacher(this.teacherId);
    if (!teacher) return html``;

    const departments = ["AIJ", "AIE", "AF"];

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
          @select-change="${this._handleInputChange}"
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
              value="${teacher.home_department}"
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
                selected: teacher.compatible_courses?.includes(c.course_id),
              }))}
            ></henry-select>
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
