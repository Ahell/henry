import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { CourseTableService } from "../services/course-table.service.js";
import { CourseFormService } from "../services/course-form.service.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import "./add-course-modal.component.js";
import "./edit-course-modal.component.js";
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;
  static properties = {
    editingCourseId: { type: Number },
    modalOpen: { type: Boolean },
  };

  constructor() {
    super();
    this.editingCourseId = null;
    this.modalOpen = false;
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
  }

  _openModal() {
    this.modalOpen = true;
  }

  _closeModal() {
    this.modalOpen = false;
    this.editingCourseId = null;
  }

  async _handleModalSave(e) {
    const { action, entity, courseId, formData } = e.detail;

    if (action === "add") {
      try {
        const { course: newCourse, mutationId } =
          CourseFormService.createCourse(
            formData,
            formData.examinatorTeacherId,
            formData.selectedTeacherIds
          );
        await store.saveData({ mutationId });
        this.modalOpen = false;
        showSuccessMessage(this, "Kurs tillagd!");
      } catch (err) {
        showErrorMessage(this, `Kunde inte lägga till kurs: ${err.message}`);
      }
      return;
    }

    if (action === "update") {
      try {
        const { mutationId } = CourseFormService.updateCourse(
          courseId,
          {
            code: formData.code,
            name: formData.name,
            credits: formData.credits,
            prerequisites: formData.prerequisites,
          },
          formData.examinatorTeacherId,
          formData.selectedTeacherIds
        );
        await store.saveData({ mutationId });
        this.modalOpen = false;
        this.editingCourseId = null;
        showSuccessMessage(this, "Kurs uppdaterad!");
      } catch (err) {
        showErrorMessage(this, `Kunde inte uppdatera kurs: ${err.message}`);
      }
    }
  }

  render() {
    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga kurser</henry-text>
          <henry-button
            variant="primary"
            ?disabled="${!store.editMode}"
            @click="${this._openModal}"
            >Lägg till kurs</henry-button
          >
        </div>
        <henry-table
          .columns="${CourseTableService.getColumns()}"
          .data="${store.getCourses()}"
          .renderCell="${(row, col) =>
            CourseTableService.renderCell(
              row,
              col,
              (courseId) => (this.editingCourseId = courseId)
            )}"
        ></henry-table>
      </henry-panel>
      <add-course-modal
        .open="${this.modalOpen}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></add-course-modal>
      <edit-course-modal
        .courseId="${this.editingCourseId}"
        .open="${!!this.editingCourseId}"
        @modal-save="${this._handleModalSave}"
        @modal-close="${this._closeModal}"
      ></edit-course-modal>
    `;
  }
}

customElements.define("courses-tab", CoursesTab);
