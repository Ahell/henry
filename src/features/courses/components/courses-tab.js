import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { CourseTableService } from "../services/course-table.service.js";
import { CourseService } from "../services/course.service.js";
import { showErrorMessage } from "../../../utils/message-helpers.js";
import "./course-modal.component.js";
import "./course-info-modal.component.js";
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;
  static properties = {
    editingCourseId: { type: Number },
    modalOpen: { type: Boolean },
    infoCourseId: { type: Number },
    infoModalOpen: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    isSaving: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCourseId = null;
    this.modalOpen = false;
    this.infoCourseId = null;
    this.infoModalOpen = false;
    this.isSaving = false;
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
  }

  _openModal() {
    this.infoModalOpen = false;
    this.infoCourseId = null;
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingCourseId = null;
  }

  _openInfoModal(courseId) {
    this.editingCourseId = null;
    this.modalOpen = false;
    this.infoCourseId = courseId;
    this.infoModalOpen = true;
  }

  _closeInfoModal() {
    this.infoModalOpen = false;
    this.infoCourseId = null;
  }

  async _runSave(task) {
    this.isSaving = true;
    store.beginAutoSaveSuspension();
    store.beginEditLock();

    try {
      return await task();
    } finally {
      store.endEditLock();
      store.endAutoSaveSuspension();
      this.isSaving = false;
    }
  }

  async _handleModalSave(e) {
    if (this.isSaving) return;
    const { action, courseId, formData } = e.detail;
    const isUpdate = action === "update";

    this.modalOpen = false;
    if (isUpdate) {
      this.editingCourseId = null;
    }

    try {
      await this._runSave(async () => {
        if (action === "add") {
          await CourseService.saveNewCourse(formData);
        } else if (action === "update") {
          await CourseService.saveUpdatedCourse(courseId, formData);
        }
      });
    } catch (err) {
      const actionText = action === "add" ? "lägga till" : "uppdatera";
      showErrorMessage(this, `Kunde inte ${actionText} kurs: ${err.message}`);
    }
  }

  async _handleDeleteCourse(courseId) {
    if (!store.editMode || this.isSaving) return;
    const course = store.getCourse(courseId);
    if (!course) return;
    if (
      !confirm(
        `Är du säker på att du vill ta bort kursen "${course.code || course.name}"?`
      )
    ) {
      return;
    }
    try {
      await this._runSave(async () => {
        await CourseService.deleteCourseById(courseId);
      });
    } catch (err) {
      showErrorMessage(this, err.message || "Kunde inte ta bort kurs.");
    }
  }

  render() {
    return html`
      ${this.message
        ? html`<div class="message ${this.messageType}">${this.message}</div>`
        : ""}
      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Kurser</henry-text>
          <div class="header-actions">
            <span
              class="save-spinner"
              title="Sparar"
              ?hidden="${!this.isSaving}"
              aria-hidden="true"
            ></span>
            <henry-button
              variant="primary"
              ?disabled="${!store.editMode || this.isSaving}"
              @click="${this._openModal}"
              >Lägg till kurs</henry-button
            >
          </div>
        </div>
        <div class="tab-body">
          <div class="tab-scroll">
            <henry-table
              striped
              hoverable
              .columns="${CourseTableService.getColumns()}"
              .data="${CourseService.getCourses()}"
              .renderCell="${(row, col) =>
                CourseTableService.renderCell(
                  row,
                  col,
                  (courseId) => {
                    this.infoModalOpen = false;
                    this.infoCourseId = null;
                    this.editingCourseId = courseId;
                    this.modalOpen = true;
                  },
                  (courseId) => this._openInfoModal(courseId),
                  (courseId) => this._handleDeleteCourse(courseId)
                )}"
            ></henry-table>
          </div>
        </div>
      </henry-panel>
      <course-modal
        mode="add"
        .open="${this.modalOpen}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></course-modal>
      <course-modal
        mode="edit"
        .courseId="${this.editingCourseId}"
        .open="${this.modalOpen}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></course-modal>
      <course-info-modal
        .courseId="${this.infoCourseId}"
        .open="${this.infoModalOpen}"
        @modal-close="${this._closeInfoModal}"
      ></course-info-modal>
    `;
  }
}

customElements.define("courses-tab", CoursesTab);
