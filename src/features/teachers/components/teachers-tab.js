import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { TeacherTableService } from "../services/teacher-table.service.js";
import { TeacherFormService } from "../services/teacher-form.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import "./add-teacher-modal.component.js";
import "./edit-teacher-modal.component.js";
import { teachersTabStyles } from "../styles/teachers-tab.styles.js";

export class TeachersTab extends LitElement {
  static styles = teachersTabStyles;
  static properties = {
    editingTeacherId: { type: Number },
    addModalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingTeacherId = null;
    this.addModalOpen = false;
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
  }

  _openAddModal() {
    this.addModalOpen = true;
  }
  _closeAddModal() {
    this.addModalOpen = false;
  }

  async _handleModalSave(e) {
    const { teacherId, formData } = e.detail;
    try {
      const { examinator_courses, ...teacherUpdates } = formData || {};
      const { mutationId } = TeacherFormService.updateTeacher(
        teacherId,
        teacherUpdates,
        examinator_courses
      );
      await store.saveData({ mutationId });
      this.editingTeacherId = null;
      showSuccessMessage(this, "Lärare uppdaterad!");
    } catch (err) {
      showErrorMessage(this, `Kunde inte uppdatera lärare: ${err.message}`);
    }
  }

  render() {
    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga lärare</henry-text>
          <henry-button
            variant="primary"
            ?disabled="${!store.editMode}"
            @click="${this._openAddModal}"
            >Lägg till lärare</henry-button
          >
        </div>
        <henry-table
          .columns="${TeacherTableService.getColumns()}"
          .data="${store.getTeachers()}"
          .renderCell="${(row, col) =>
            TeacherTableService.renderCell(
              row,
              col,
              (teacherId) => (this.editingTeacherId = teacherId)
            )}"
        ></henry-table>
      </henry-panel>
      <add-teacher-modal
        .open="${this.addModalOpen}"
        @teacher-added="${this._closeAddModal}"
      ></add-teacher-modal>
      <edit-teacher-modal
        .teacherId="${this.editingTeacherId}"
        .open="${!!this.editingTeacherId}"
        @modal-save="${this._handleModalSave}"
      ></edit-teacher-modal>
    `;
  }
}

customElements.define("teachers-tab", TeachersTab);
