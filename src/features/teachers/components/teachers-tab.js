import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import {
  createTeacherFromForm,
  resetTeacherForm,
  deleteTeacherById,
} from "../services/teacher-tab.service.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherFormService } from "../services/teacher-form.service.js";
import "./teacher-modal.component.js";
import "../../../components/ui/index.js";
import { teachersTabStyles } from "../styles/teachers-tab.styles.js";

export class TeachersTab extends LitElement {
  static styles = teachersTabStyles;

  static properties = {
    editingTeacherId: { type: Number },
    message: { type: String },
    messageType: { type: String },
    formValid: { type: Boolean },
  };

  constructor() {
    super();
    this.formValid = false;
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _updateFormValidity() {
    const root = this.shadowRoot;
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) {
      this.formValid = false;
      return;
    }

    const { name } = FormService.extractFormData(root, { name: "teacherName" });
    this.formValid = TeacherFormService.isTeacherNameUnique(name);
  }

  render() {
    const departments = ["AIJ", "AIE", "AF"];
    const courses = store.getCourses();

    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lägg till Ny Lärare</henry-text>
        </div>
        <form
          @submit="${this.handleAddTeacher}"
          @input="${this._handleInputChange}"
          @change="${this._handleInputChange}"
          @input-change="${this._handleInputChange}"
          @select-change="${this._handleInputChange}"
          @radio-change="${this._handleInputChange}"
          @textarea-change="${this._handleInputChange}"
        >
          <div class="form-row">
            <henry-input
              id="teacherName"
              label="Namn"
              placeholder="Förnamn Efternamn"
              required
            ></henry-input>
            <henry-radio-group
              id="teacherDepartment"
              name="teacherDepartment"
              label="Avdelning"
              value="AIJ"
              required
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-radio-group>
          </div>
          <henry-select
            id="teacherCourses"
            label="Kompatibla kurser (Ctrl/Cmd+klick för flera)"
            multiple
            size="6"
            .options=${courses.map((course) => ({
              value: course.course_id.toString(),
              label: `${course.code} - ${course.name}`,
            }))}
          ></henry-select>
          <henry-button type="submit" variant="primary" ?disabled="${!this.formValid}">
            Lägg till Lärare
          </henry-button>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Befintliga Lärare</henry-text>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTeacherTableColumns()}"
          .data="${store.getTeachers()}"
          .renderCell="${(row, col) => this._renderTeacherTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

      <teacher-modal
        .teacherId="${this.editingTeacherId}"
        .open="${!!this.editingTeacherId}"
        @modal-close="${this.handleCancelTeacherEdit}"
        @modal-save="${this._handleModalSave}"
      ></teacher-modal>
    `;
  }

  async _handleModalSave(e) {
    const { teacherId, formData } = e.detail;
    try {
      const { mutationId } = TeacherFormService.updateTeacher(teacherId, formData);
      await store.saveData({ mutationId });
      this.editingTeacherId = null;
      showSuccessMessage(this, "Lärare uppdaterad!");
    } catch (err) {
      showErrorMessage(this, `Kunde inte uppdatera lärare: ${err.message}`);
    }
  }

  _getTeacherTableColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "department", label: "Avdelning", width: "120px" },
      { key: "compatible_courses", label: "Kompatibla kurser", width: "300px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderTeacherTableCell(teacher, column) {
    const courses = store.getCourses();
    const compatibleCourses = teacher.compatible_courses || [];

    switch (column.key) {
      case "name":
        return html`${teacher.name}`;

      case "department":
        return html`${teacher.home_department}`;

      case "compatible_courses":
        if (compatibleCourses.length === 0) {
          return html`<span style="color: var(--color-text-disabled);"
            >-</span
          >`;
        }
        const courseNames = compatibleCourses
          .map((cid) => {
            const course = courses.find((c) => c.course_id === cid);
            return course ? course.code : null;
          })
          .filter(Boolean)
          .join(", ");
        return html`${courseNames}`;

      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              @click="${() => this.handleEditTeacher(teacher.teacher_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() =>
                this.handleDeleteTeacher(teacher.teacher_id, teacher.name)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${teacher[column.key] ?? ""}`;
    }
  }

  async handleAddTeacher(e) {
    e.preventDefault();
    const root = this.shadowRoot;

    try {
      if (!FormService.isFormValid(root)) {
        FormService.reportFormValidity(root);
        return;
      }

      const newTeacher = await createTeacherFromForm(root);
      resetTeacherForm(root);
      this._updateFormValidity();
      window.dispatchEvent(
        new CustomEvent("henry:teacher-added", { detail: newTeacher })
      );
      showSuccessMessage(this, "Lärare tillagd!");
    } catch (err) {
      showErrorMessage(this, `Kunde inte lägga till lärare: ${err.message}`);
    }
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  async handleDeleteTeacher(teacherId, teacherName) {
    if (
      !confirm(`Är du säker på att du vill ta bort läraren "${teacherName}"?`)
    ) {
      return;
    }

    try {
      const removed = await deleteTeacherById(teacherId);
      if (removed) {
        showSuccessMessage(this, `Lärare "${teacherName}" borttagen!`);
      }
    } catch (err) {
      showErrorMessage(this, `Kunde inte ta bort läraren: ${err.message}`);
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
