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

  _handleInputChange() {
    this._updateFormValidity();
  }

  _updateFormValidity() {
    const form = this.shadowRoot?.querySelector('form') || this.querySelector('form');
    this.formValid = form ? form.checkValidity() : false;
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
        <form @submit="${this._handleSubmit}" @input="${this._handleInputChange}">
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
    const form = this.shadowRoot.querySelector('form');

    // Check if form is valid before allowing close
    if (form && !form.checkValidity()) {
      // Trigger HTML5 validation messages to show which fields are invalid
      form.reportValidity();
      // Prevent close
      return;
    }

    // Safe to close - form is valid or doesn't exist
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSave() {
    const form = this.shadowRoot?.querySelector('form') || this.querySelector('form');

    // Check if form is valid before saving
    if (form && !form.checkValidity()) {
      form.reportValidity();
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
