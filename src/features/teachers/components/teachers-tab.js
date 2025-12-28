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
import { TeacherTableService } from "../services/teacher-table.service.js";
import { TeacherService } from "../services/teacher.service.js";
import "./teacher-modal.component.js";
import "./teacher-info-modal.component.js";
import { teachersTabStyles } from "../styles/teachers-tab.styles.js";

export class TeachersTab extends LitElement {
  static styles = teachersTabStyles;

  static properties = {
    editingTeacherId: { type: Number },
    modalOpen: { type: Boolean },
    modalMode: { type: String }, // 'add' or 'edit'
    infoTeacherId: { type: Number },
    infoModalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingTeacherId = null;
    this.modalOpen = false;
    this.modalMode = "add";
    this.infoTeacherId = null;
    this.infoModalOpen = false;
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
  }

  _openAddModal() {
    this.modalMode = "add";
    this.editingTeacherId = null;
    this.infoModalOpen = false;
    this.infoTeacherId = null;
    this.modalOpen = true;
  }

  handleEditTeacher(teacherId) {
    if (!store.editMode) return;
    this.modalMode = "edit";
    this.editingTeacherId = teacherId;
    this.infoModalOpen = false;
    this.infoTeacherId = null;
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingTeacherId = null;
  }

  _openInfoModal(teacherId) {
    this.modalOpen = false;
    this.editingTeacherId = null;
    this.infoTeacherId = teacherId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoTeacherId = null;
  }

  render() {
    const canEdit = !!store.editMode;
    return html`
      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga lärare</henry-text>
          <henry-button
            variant="primary"
            ?disabled=${!canEdit}
            @click="${this._openAddModal}"
          >
            Lägg till lärare
          </henry-button>
        </div>
        <div class="tab-body">
          <div class="tab-scroll">
            <henry-table
              striped
              hoverable
              .columns="${TeacherTableService.getColumns()}"
              .data="${store.getTeachers()}"
              .renderCell="${(row, col) =>
                TeacherTableService.renderCell(
                  row,
                  col,
                  (teacherId) => this.handleEditTeacher(teacherId),
                  (teacherId) => this.handleDeleteTeacher(teacherId),
                  (teacherId) => this._openInfoModal(teacherId)
                )}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>

      <teacher-modal
        .open="${this.modalOpen}"
        .mode="${this.modalMode}"
        .teacherId="${this.editingTeacherId}"
        @teacher-saved="${this._closeModal}"
        @modal-close="${this._closeModal}"
      ></teacher-modal>
      <teacher-info-modal
        .open="${this.infoModalOpen}"
        .teacherId="${this.infoTeacherId}"
        @modal-close="${this._closeInfoModal}"
      ></teacher-info-modal>
    `;
  }

  async handleDeleteTeacher(teacherId) {
    if (!store.editMode) return;
    const teacher = store.getTeacher(teacherId);
    if (!teacher) return;

    if (
      !confirm(
        `Är du säker på att du vill ta bort läraren "${teacher.name}"?`
      )
    ) {
      return;
    }

    try {
      const removed = await TeacherService.deleteTeacherById(teacherId);
      if (removed) {
        showSuccessMessage(this, `Lärare "${teacher.name}" borttagen!`);
      }
    } catch (error) {
      showErrorMessage(this, `Fel: ${error.message}`);
    }
  }

  updated() {
    if (store.editMode) return;
    if (this.modalOpen) {
      this.modalOpen = false;
      this.editingTeacherId = null;
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
