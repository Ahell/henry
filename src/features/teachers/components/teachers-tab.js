import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import {
  getInputValue,
  getSelectValues,
  getRadioValue,
  resetForm,
} from "../../../utils/form-helpers.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
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
  };

  constructor() {
    super();
    initializeEditState(this, "editingTeacherId");
    subscribeToStore(this);
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
        <form @submit="${this.handleAddTeacher}">
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
          <henry-button type="submit" variant="primary">
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

  _handleModalSave(e) {
    const { teacherId, formData } = e.detail;
    TeacherFormService.updateTeacher(teacherId, formData);
    this.editingTeacherId = null;
    showSuccessMessage(this, "Lärare uppdaterad!");
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
              @click="${() => this.handleDeleteTeacher(teacher.teacher_id)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${teacher[column.key] ?? ""}`;
    }
  }

  handleAddTeacher(e) {
    e.preventDefault();

    (async () => {
      const root = this.shadowRoot;
      const selectedCourses = getSelectValues(root, "teacherCourses");

      const teacher = {
        name: getInputValue(root, "teacherName"),
        home_department: getRadioValue(root, "teacherDepartment"),
        compatible_courses: selectedCourses,
      };

      const { teacher: newTeacher, mutationId } =
        TeacherFormService.createTeacher(teacher);

      try {
        await store.saveData({ mutationId });

        // Reset the native form
        resetForm(root);

        // Clear custom henry-select (teacherCourses)
        FormService.clearCustomInput(root, "teacherCourses");

        // Ensure custom inputs are cleared as well (some components don't
        // respond to form.reset()). Clear name input and reset department.
        try {
          const nameEl = root.querySelector("#teacherName");
          if (nameEl && typeof nameEl.getInput === "function") {
            const input = nameEl.getInput();
            if (input) input.value = "";
          }

          const deptEl = root.querySelector("#teacherDepartment");
          if (deptEl) {
            // Prefer an API method if available
            if (typeof deptEl.setValue === "function") {
              deptEl.setValue("AIJ");
            } else if (typeof deptEl.value !== "undefined") {
              deptEl.value = "AIJ";
              deptEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        } catch (e) {
          // Non-critical, swallow
          console.warn("Failed to fully clear teacher form fields:", e);
        }

        // Notify other components that a teacher was added so they can
        // react (e.g., CoursesTab may want to clear or refresh its form)
        try {
          window.dispatchEvent(
            new CustomEvent("henry:teacher-added", { detail: newTeacher })
          );
        } catch (e) {
          // ignore if window is not available
        }

        showSuccessMessage(this, "Lärare tillagd!");
      } catch (err) {
        showErrorMessage(this, `Kunde inte lägga till lärare: ${err.message}`);
      }
    })();
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  handleDeleteTeacher(teacherId, teacherName) {
    (async () => {
      if (
        !confirm(`Är du säker på att du vill ta bort läraren "${teacherName}"?`)
      ) {
        return;
      }

      const { removed, mutationId } =
        TeacherFormService.deleteTeacher(teacherId);
      if (!removed) return;

      try {
        await store.saveData({ mutationId });
        showSuccessMessage(this, `Lärare "${teacherName}" borttagen!`);
      } catch (err) {
        showErrorMessage(this, `Kunde inte ta bort läraren: ${err.message}`);
      }
    })();
  }
}

customElements.define("teachers-tab", TeachersTab);
