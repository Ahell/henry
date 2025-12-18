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
import { CourseFormService } from "../services/course-form.service.js";
import "./course-modal.component.js";
import "../../../components/ui/index.js";
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;

  static properties = {
    editingCourseId: { type: Number },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
    // Clear add-course form when a teacher has been added elsewhere
    this._onTeacherAdded = (e) => {
      try {
        const root = this.shadowRoot;
        // Only clear code/name inputs (user asked these specifically)
        const clearInput = (id) => {
          const el = root.querySelector(`#${id}`);
          if (!el) return;
          if (typeof el.getInput === "function") {
            const input = el.getInput();
            if (input) input.value = "";
          } else {
            el.value = "";
          }
        };

        clearInput("courseCode");
        clearInput("courseName");

        // Also clear any selections on custom selects to keep state consistent
        const selectEl = root.querySelector(`#courseTeachers`);
        if (selectEl && typeof selectEl.getSelect === "function") {
          const sel = selectEl.getSelect();
          if (sel) {
            Array.from(sel.options).forEach((o) => (o.selected = false));
            sel.value = "";
            sel.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      } catch (err) {
        // swallow errors; non-critical
        console.warn("Failed to clear course form after teacher added:", err);
      }
    };
    window.addEventListener("henry:teacher-added", this._onTeacherAdded);
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    if (this._onTeacherAdded) {
      window.removeEventListener("henry:teacher-added", this._onTeacherAdded);
    }
  }

  render() {
    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lägg till Ny Kurs</henry-text>
        </div>
        <form @submit="${this.handleAddCourse}">
          <div class="form-row two-cols">
            <henry-input
              id="courseCode"
              label="Kurskod"
              placeholder="T.ex. AI180U"
              required
            ></henry-input>
            <henry-input
              id="courseName"
              label="Kursnamn"
              placeholder="T.ex. Juridisk översiktskurs"
              required
            ></henry-input>
          </div>

          <div class="form-row two-cols">
            <henry-select
              id="courseCredits"
              label="Högskolepoäng"
              required
              .options=${[
                { value: "7.5", label: "7,5 hp" },
                { value: "15", label: "15 hp" },
              ]}
            ></henry-select>
            <henry-select
              id="prerequisites"
              label="Spärrkurser (kurser som måste läsas före)"
              multiple
              size="5"
              .options=${store
                .getCourses()
                .filter((c) => c && c.course_id != null)
                .map((c) => ({
                  value: String(c.course_id),
                  label: `${c.code ?? "OKÄND"} - ${c.name ?? ""}`,
                }))}
            ></henry-select>
          </div>

          <henry-select
            id="courseTeachers"
            label="Kompatibla lärare (Ctrl/Cmd+klick för flera)"
            multiple
            size="5"
            .options=${store.getTeachers().map((teacher) => ({
              value: teacher.teacher_id.toString(),
              label: teacher.name,
            }))}
          ></henry-select>

          <div class="form-actions">
            <henry-button type="submit" variant="primary">
              Lägg till kurs
            </henry-button>
          </div>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Befintliga Kurser</henry-text>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTableColumns()}"
          .data="${store.getCourses()}"
          .renderCell="${(row, col) => this._renderTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

      <course-modal
        .courseId="${this.editingCourseId}"
        .open="${!!this.editingCourseId}"
        @modal-close="${this.handleCancelEdit}"
        @modal-save="${this._handleModalSave}"
      ></course-modal>
    `;
  }

  _handleModalSave(e) {
    const { courseId, formData } = e.detail;
    CourseFormService.updateCourse(
      courseId,
      {
        code: formData.code,
        name: formData.name,
        credits: formData.credits,
        prerequisites: formData.prerequisites,
      },
      formData.selectedTeacherIds
    );
    this.editingCourseId = null;
    showSuccessMessage(this, "Kurs uppdaterad!");
  }

  _getTableColumns() {
    return [
      { key: "code", label: "Kod", width: "100px" },
      { key: "name", label: "Namn", width: "200px" },
      { key: "prerequisites", label: "Spärrkurser", width: "150px" },
      {
        key: "compatible_teachers",
        label: "Kompatibla lärare",
        width: "200px",
      },
      { key: "credits", label: "HP", width: "80px" },
      { key: "actions", label: "Åtgärder", width: "180px" },
    ];
  }

  _renderTableCell(course, column) {
    switch (column.key) {
      case "code":
        return html`${course.code}`;

      case "name":
        return html`${course.name}`;

      case "prerequisites":
        return this.renderPrerequisitesList(course);

      case "compatible_teachers":
        return this.renderCompatibleTeachersForCourse(course);

      case "credits":
        return html`${course.credits ?? ""}`;

      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              @click="${() => this.handleEditCourse(course.course_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteCourse(course.course_id)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${course[column.key] ?? ""}`;
    }
  }

  renderPrerequisitesList(course) {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return html`<span class="no-prerequisites">-</span>`;
    }

    const courses = store.getCourses();
    const prereqNames = course.prerequisites
      .map((prereqId) => {
        const prereqCourse = courses.find((c) => c.course_id === prereqId);
        return prereqCourse ? prereqCourse.code : null;
      })
      .filter(Boolean);

    return html`<span class="prerequisites-list"
      >${prereqNames.join(", ")}</span
    >`;
  }

  renderCompatibleTeachersForCourse(course) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) =>
        teacher.compatible_courses?.includes(course.course_id)
      );

    if (compatibleTeachers.length === 0) {
      return html`<span class="no-prerequisites">-</span>`;
    }

    const teacherNames = compatibleTeachers.map((t) => t.name).join(", ");
    return html`<span class="compatible-teachers">${teacherNames}</span>`;
  }

  handleAddCourse(e) {
    e.preventDefault();
    // Ensure we wait for persistence before clearing the form
    (async () => {
      const root = this.shadowRoot;
      const prerequisites = getSelectValues(root, "prerequisites");
      const selectedTeacherIds = getSelectValues(root, "courseTeachers");

      const course = {
        code: getInputValue(root, "courseCode"),
        name: getInputValue(root, "courseName"),
        credits: parseFloat(getInputValue(root, "courseCredits")) || 0,
        prerequisites: prerequisites,
      };

      const { course: newCourse, mutationId } = CourseFormService.createCourse(
        course,
        selectedTeacherIds
      );

      try {
        await store.saveData({ mutationId });

        // Reset native form
        resetForm(root);

        // Clear any custom select components (henry-select) since form.reset may not
        FormService.clearCustomInput(root, "prerequisites");
        FormService.clearCustomInput(root, "courseTeachers");

        // Explicitly clear inputs that may not be affected by form.reset()
        try {
          const clearInput = (id) => {
            const el = root.querySelector(`#${id}`);
            if (!el) return;
            if (typeof el.getInput === "function") {
              const input = el.getInput();
              if (input) input.value = "";
            } else if (typeof el.value !== "undefined") {
              el.value = "";
            }
          };

          clearInput("courseCode");
          clearInput("courseName");

          // Reset credits select to default (7.5)
          const creditsEl = root.querySelector(`#courseCredits`);
          if (creditsEl && typeof creditsEl.getSelect === "function") {
            const sel = creditsEl.getSelect();
            if (sel) {
              sel.value = "7.5";
              sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        } catch (e) {
          console.warn("Failed to fully clear course form fields:", e);
        }

        // Notify other components a course was added
        try {
          window.dispatchEvent(
            new CustomEvent("henry:course-added", { detail: newCourse })
          );
        } catch (e) {}

        showSuccessMessage(this, "Kurs tillagd!");
      } catch (err) {
        showErrorMessage(this, `Kunde inte lägga till kurs: ${err.message}`);
      }
    })();
  }

  handleEditCourse(courseId) {
    this.editingCourseId = courseId;
  }

  handleCancelEdit() {
    this.editingCourseId = null;
  }

  handleDeleteCourse(courseId) {
    (async () => {
      const course = store.getCourse(courseId);
      const courseName = course ? course.name : "Okänd kurs";
      if (
        !confirm(`Är du säker på att du vill ta bort kursen "${courseName}"?`)
      ) {
        return;
      }

      const { removed, mutationId } = CourseFormService.deleteCourse(courseId);
      if (!removed) return;

      try {
        await store.saveData({ mutationId });
        showSuccessMessage(this, `Kurs "${courseName}" borttagen!`);
      } catch (err) {
        showErrorMessage(this, `Kunde inte ta bort kursen: ${err.message}`);
      }
    })();
  }
}

customElements.define("courses-tab", CoursesTab);
