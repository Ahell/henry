import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { store } from "../../../platform/store/DataStore.js";
import {
  showSuccessMessage,
  showErrorMessage,
} from "../../../utils/message-helpers.js";
import {
  initializeEditState,
  subscribeToStore,
} from "../../admin/utils/admin-helpers.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseFormService } from "../services/course-form.service.js";
import {
  createCourseFromForm,
  resetCourseForm,
  deleteCourseById,
} from "../services/course-tab.service.js";
import "./course-modal.component.js";
import "../../../components/ui/index.js";
import { coursesTabStyles } from "../styles/courses-tab.styles.js";

export class CoursesTab extends LitElement {
  static styles = coursesTabStyles;

  static properties = {
    editingCourseId: { type: Number },
    addModalOpen: { type: Boolean },
    message: { type: String },
    messageType: { type: String },
    formValid: { type: Boolean },
    selectedAddCompatibleTeacherIds: { type: Array, attribute: false },
    selectedAddExaminatorTeacherId: { type: String, attribute: false },
  };

  constructor() {
    super();
    this.formValid = false;
    this.addModalOpen = false;
    this.selectedAddCompatibleTeacherIds = [];
    this.selectedAddExaminatorTeacherId = "";
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
    // Clear add-course form when a teacher has been added elsewhere
    this._onTeacherAdded = (e) => {
      try {
        const root = this.shadowRoot;
        // Only clear code/name inputs (user asked these specifically)
        FormService.clearCustomForm(root, [
          "courseCode",
          "courseName",
          "courseTeachers",
          "courseExaminator",
        ]);
        this.selectedAddCompatibleTeacherIds = [];
        this.selectedAddExaminatorTeacherId = "";
        this._updateFormValidity();
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

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this._updateFormValidity();
  }

  _handleInputChange() {
    this._updateFormValidity();
  }

  _handleAddSelectChange(e) {
    const targetId = e?.target?.id;
    const values = Array.isArray(e?.detail?.values) ? e.detail.values : null;
    const value =
      typeof e?.detail?.value === "string" || typeof e?.detail?.value === "number"
        ? String(e.detail.value)
        : null;
    if (!targetId) {
      this._handleInputChange();
      return;
    }

    if (targetId === "courseTeachers") {
      if (!values) {
        this._handleInputChange();
        return;
      }
      this.selectedAddCompatibleTeacherIds = values.map(String);
      if (
        this.selectedAddExaminatorTeacherId &&
        !this.selectedAddCompatibleTeacherIds.includes(
          this.selectedAddExaminatorTeacherId
        )
      ) {
        this.selectedAddExaminatorTeacherId = "";
      }
      this._handleInputChange();
      return;
    }

    if (targetId === "courseExaminator") {
      if (values) {
        this.selectedAddExaminatorTeacherId = values[0] || "";
      } else {
        this.selectedAddExaminatorTeacherId = value || "";
      }
      this._handleInputChange();
      return;
    }

    this._handleInputChange();
  }

  async _openAddModal() {
    this.addModalOpen = true;
    await this.updateComplete;
    resetCourseForm(this.shadowRoot);
    this.selectedAddCompatibleTeacherIds = [];
    this.selectedAddExaminatorTeacherId = "";
    this._updateFormValidity();
  }

  _closeAddModal() {
    this.addModalOpen = false;
    this.formValid = false;
    this.selectedAddCompatibleTeacherIds = [];
    this.selectedAddExaminatorTeacherId = "";
  }

  _updateFormValidity() {
    const root = this.shadowRoot;
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) {
      this.formValid = false;
      return;
    }

    const { code, name } = FormService.extractFormData(root, {
      code: "courseCode",
      name: "courseName",
    });
    this.formValid =
      CourseFormService.isCourseCodeUnique(code) &&
      CourseFormService.isCourseNameUnique(name);
  }

  render() {
    const canEdit = !!store.editMode;
    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Befintliga kurser</henry-text>
          <henry-button
            variant="primary"
            ?disabled=${!canEdit}
            @click="${this._openAddModal}"
          >
            Lägg till kurs
          </henry-button>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTableColumns()}"
          .data="${store.getCourses()}"
          .renderCell="${(row, col) => this._renderTableCell(row, col)}"
        ></henry-table>
      </henry-panel>

	      ${this.addModalOpen
	        ? html`
	            <henry-modal
	              open
	              title="Lägg till Kurs"
	              @close="${this._closeAddModal}"
	            >
	              <form
	                id="add-course-form"
	                @submit="${this.handleAddCourse}"
	                @input="${this._handleInputChange}"
	                @change="${this._handleInputChange}"
	                @input-change="${this._handleInputChange}"
	                @select-change="${this._handleAddSelectChange}"
	                @radio-change="${this._handleInputChange}"
	                @textarea-change="${this._handleInputChange}"
	              >
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

                <henry-radio-group
                  id="courseCredits"
                  name="courseCredits"
                  label="Högskolepoäng"
                  required
	                  .options=${[
	                    { value: "7.5", label: "7,5 hp" },
	                    { value: "15", label: "15 hp" },
	                  ]}
	                ></henry-radio-group>
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

	                ${keyed(
	                  this.selectedAddCompatibleTeacherIds.join(","),
	                  html`<henry-select
	                    id="courseExaminator"
	                    label="Examinator"
	                    size="1"
	                    placeholder="Ingen vald"
	                    ?disabled=${this.selectedAddCompatibleTeacherIds.length === 0}
	                    .value="${this.selectedAddExaminatorTeacherId}"
	                    .options=${store
	                      .getTeachers()
	                      .filter((t) =>
	                        this.selectedAddCompatibleTeacherIds.includes(
	                          t.teacher_id.toString()
	                        )
	                      )
	                      .map((teacher) => ({
	                        value: teacher.teacher_id.toString(),
	                        label: teacher.name,
	                      }))}
	                  ></henry-select>`
	                )}
	              </form>

	              <div slot="footer">
	                <henry-button
	                  variant="secondary"
                  @click="${this._closeAddModal}"
                >
                  Avbryt
                </henry-button>
                <henry-button
                  variant="primary"
                  ?disabled="${!this.formValid || !canEdit}"
                  @click="${() => {
                    const form =
                      this.renderRoot?.querySelector("#add-course-form");
                    if (form?.requestSubmit) form.requestSubmit();
                    else
                      form?.dispatchEvent(
                        new Event("submit", { bubbles: true, cancelable: true })
                      );
                  }}"
                >
                  Lägg till kurs
                </henry-button>
              </div>
            </henry-modal>
          `
        : ""}

      <course-modal
        .courseId="${this.editingCourseId}"
        .open="${!!this.editingCourseId}"
        @modal-close="${this.handleCancelEdit}"
        @modal-save="${this._handleModalSave}"
      ></course-modal>
    `;
  }

  _handleModalSave(e) {
    if (!store.editMode) return;
    const { courseId, formData } = e.detail;
    (async () => {
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
        this.editingCourseId = null;
        showSuccessMessage(this, "Kurs uppdaterad!");
      } catch (err) {
        showErrorMessage(this, `Kunde inte uppdatera kurs: ${err.message}`);
      }
    })();
  }

  _getTableColumns() {
    return [
      { key: "code", label: "Kod", width: "100px" },
      { key: "name", label: "Namn", width: "200px" },
      { key: "examinator", label: "Examinator", width: "180px" },
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

      case "examinator": {
        const tid = store.getCourseExaminatorTeacherId(course.course_id);
        if (tid == null) {
          return html`<span class="no-prerequisites">-</span>`;
        }
        const teacher = store.getTeacher(tid);
        return html`${teacher?.name || "-"}`;
      }

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
              ?disabled=${!store.editMode}
              @click="${() => this.handleEditCourse(course.course_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              ?disabled=${!store.editMode}
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

  async handleAddCourse(e) {
    e.preventDefault();
    if (!store.editMode) return;
    const root = this.shadowRoot;

    try {
      if (!FormService.isFormValid(root)) {
        FormService.reportFormValidity(root);
        return;
      }

      const newCourse = await createCourseFromForm(root);
      resetCourseForm(root);
      this._updateFormValidity();
      window.dispatchEvent(
        new CustomEvent("henry:course-added", { detail: newCourse })
      );
      this._closeAddModal();
      showSuccessMessage(this, "Kurs tillagd!");
    } catch (err) {
      showErrorMessage(this, `Kunde inte lägga till kurs: ${err.message}`);
    }
  }

  handleEditCourse(courseId) {
    if (!store.editMode) return;
    this.editingCourseId = courseId;
  }

  handleCancelEdit() {
    this.editingCourseId = null;
  }

  async handleDeleteCourse(courseId) {
    if (!store.editMode) return;
    const course = store.getCourse(courseId);
    const courseName = course ? course.name : "Okänd kurs";
    if (
      !confirm(`Är du säker på att du vill ta bort kursen "${courseName}"?`)
    ) {
      return;
    }

    try {
      const removed = await deleteCourseById(courseId);
      if (removed) {
        showSuccessMessage(this, `Kurs "${courseName}" borttagen!`);
      }
    } catch (err) {
      showErrorMessage(this, `Kunde inte ta bort kursen: ${err.message}`);
    }
  }

  updated() {
    if (store.editMode) return;
    if (this.addModalOpen) this.addModalOpen = false;
    if (this.editingCourseId != null) this.editingCourseId = null;
  }
}

customElements.define("courses-tab", CoursesTab);
