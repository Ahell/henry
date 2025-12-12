import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  getSelectValues,
  getRadioValue,
  resetForm,
  showSuccessMessage,
  addCourseToTeachers,
  syncCourseToTeachers,
  initializeEditState,
  subscribeToStore,
} from "../../utils/admin-helpers.js";
import "../ui/index.js";

export class CoursesTab extends LitElement {
  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-row.two-cols {
      grid-template-columns: 1fr 1fr;
    }

    henry-table {
      margin-top: var(--space-4);
    }

    .edit-input {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-sm);
    }

    .no-prerequisites {
      color: var(--color-text-disabled);
    }

    .compatible-teachers {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
  `;

  static properties = {
    editingCourseId: { type: Number },
    message: { type: String },
    messageType: { type: String },
  };

  constructor() {
    super();
    initializeEditState(this, "editingCourseId");
    subscribeToStore(this);
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
            <henry-radio-group
              id="blockLength"
              name="blockLength"
              label="Blocklängd"
              value="1"
              .options=${[
                { value: "1", label: "1 block (7.5 hp)" },
                { value: "2", label: "2 block (15 hp)" },
              ]}
            ></henry-radio-group>
            <henry-select
              id="prerequisites"
              label="Spärrkurser (kurser som måste läsas före)"
              multiple
              size="5"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: `${c.code} - ${c.name}`,
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

      ${this._renderEditModal()}
    `;
  }

  _renderEditModal() {
    if (!this.editingCourseId) return html``;

    const course = store.getCourse(this.editingCourseId);
    if (!course) return html``;

    return html`
      <henry-modal open title="Redigera Kurs" @close="${this.handleCancelEdit}">
        <form @submit="${(e) => this._handleSaveFromModal(e)}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-code"
              label="Kurskod"
              .value="${course.code}"
              required
            ></henry-input>

            <henry-input
              id="edit-name"
              label="Kursnamn"
              .value="${course.name}"
              required
            ></henry-input>

            <henry-select
              id="edit-prerequisites"
              label="Spärrkurser"
              multiple
              size="5"
              .options=${store
                .getCourses()
                .filter((c) => c.course_id !== course.course_id)
                .map((c) => ({
                  value: c.course_id.toString(),
                  label: c.code,
                  selected: course.prerequisites?.includes(c.course_id),
                }))}
            ></henry-select>

            <henry-radio-group
              id="edit-blockLength"
              label="Blocklängd"
              name="edit-blockLength"
              value="${course.default_block_length}"
              .options=${[
                { value: "1", label: "1 block" },
                { value: "2", label: "2 block" },
              ]}
            ></henry-radio-group>

            <henry-select
              id="edit-compatible-teachers"
              label="Kompatibla lärare"
              multiple
              size="5"
              .options=${store.getTeachers().map((t) => ({
                value: t.teacher_id.toString(),
                label: t.name,
                selected: t.compatible_courses?.includes(course.course_id),
              }))}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button variant="secondary" @click="${this.handleCancelEdit}">
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${() => this.handleSaveCourse(course.course_id)}"
          >
            💾 Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSaveFromModal(e) {
    e.preventDefault();
    if (this.editingCourseId) {
      this.handleSaveCourse(this.editingCourseId);
    }
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
      { key: "default_block_length", label: "Blocklängd", width: "100px" },
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

      case "default_block_length":
        return html`${course.default_block_length}`;

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
    const root = this.shadowRoot;
    const blockLength = parseInt(getRadioValue(root, "blockLength"));
    const prerequisites = getSelectValues(root, "prerequisites");
    const selectedTeacherIds = getSelectValues(root, "courseTeachers");

    const course = {
      code: getInputValue(root, "courseCode"),
      name: getInputValue(root, "courseName"),
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites: prerequisites,
    };
    const newCourse = store.addCourse(course);

    addCourseToTeachers(newCourse.course_id, selectedTeacherIds);

    resetForm(root);
    showSuccessMessage(this, "Kurs tillagd!");
  }

  handleEditCourse(courseId) {
    this.editingCourseId = courseId;
  }

  handleCancelEdit() {
    this.editingCourseId = null;
  }

  handleSaveCourse(courseId) {
    const root = this.shadowRoot;
    const code = getInputValue(root, "edit-code");
    const name = getInputValue(root, "edit-name");
    const blockLength = parseInt(getRadioValue(root, "edit-blockLength"));
    const prerequisites = getSelectValues(root, "edit-prerequisites");
    const selectedTeacherIds = getSelectValues(
      root,
      "edit-compatible-teachers"
    );

    store.updateCourse(courseId, {
      code,
      name,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites,
    });

    syncCourseToTeachers(courseId, selectedTeacherIds);

    this.editingCourseId = null;
    showSuccessMessage(this, "Kurs uppdaterad!");
  }

  handleDeleteCourse(courseId, courseName) {
    if (confirm(`Är du säker på att du vill ta bort kursen "${courseName}"?`)) {
      store.deleteCourse(courseId);
      showSuccessMessage(this, `Kurs "${courseName}" borttagen!`);
    }
  }
}

customElements.define("courses-tab", CoursesTab);
