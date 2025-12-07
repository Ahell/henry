import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
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
    this.editingCourseId = null;
    this.message = "";
    this.messageType = "";
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      ${this.message
        ? html`<div class="${this.messageType}">${this.message}</div>`
        : ""}

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">➕ Lägg till Ny Kurs</henry-text>
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
              ➕ Lägg till kurs
            </henry-button>
          </div>
        </form>
      </henry-panel>

      <henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">📚 Befintliga Kurser</henry-text>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTableColumns()}"
          .data="${store.getCourses()}"
          .renderCell="${(row, col) => this._renderTableCell(row, col)}"
        ></henry-table>
      </henry-panel>
    `;
  }

  _getTableColumns() {
    return [
      { key: 'code', label: 'Kod', width: '100px' },
      { key: 'name', label: 'Namn', width: '200px' },
      { key: 'prerequisites', label: 'Spärrkurser', width: '150px' },
      { key: 'compatible_teachers', label: 'Kompatibla lärare', width: '200px' },
      { key: 'default_block_length', label: 'Blocklängd', width: '100px' },
      { key: 'actions', label: 'Åtgärder', width: '180px' },
    ];
  }

  _renderTableCell(course, column) {
    const isEditing = this.editingCourseId === course.course_id;

    switch (column.key) {
      case 'code':
        if (isEditing) {
          return html`
            <input
              type="text"
              class="edit-input"
              id="edit-code-${course.course_id}"
              .value="${course.code}"
            />
          `;
        }
        return html`${course.code}`;

      case 'name':
        if (isEditing) {
          return html`
            <input
              type="text"
              class="edit-input"
              id="edit-name-${course.course_id}"
              .value="${course.name}"
            />
          `;
        }
        return html`${course.name}`;

      case 'prerequisites':
        if (isEditing) {
          return html`
            <henry-select
              id="edit-prerequisites-${course.course_id}"
              multiple
              size="5"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: c.code,
                selected: course.prerequisites?.includes(c.course_id),
              }))}
            ></henry-select>
          `;
        }
        return this.renderPrerequisitesList(course);

      case 'compatible_teachers':
        return this.renderCompatibleTeachersForCourse(course);

      case 'default_block_length':
        if (isEditing) {
          return html`
            <henry-select
              id="edit-blockLength-${course.course_id}"
              .options=${[
                {
                  value: "1",
                  label: "1",
                  selected: course.default_block_length === 1,
                },
                {
                  value: "2",
                  label: "2",
                  selected: course.default_block_length === 2,
                },
              ]}
            ></henry-select>
          `;
        }
        return html`${course.default_block_length}`;

      case 'actions':
        if (isEditing) {
          return html`
            <div style="display: flex; gap: var(--space-2);">
              <henry-button
                variant="success"
                size="small"
                @click="${() => this.handleSaveCourse(course.course_id)}"
              >
                💾 Spara
              </henry-button>
              <henry-button
                variant="secondary"
                size="small"
                @click="${() => this.handleCancelEdit()}"
              >
                ❌ Avbryt
              </henry-button>
            </div>
          `;
        }
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              @click="${() => this.handleEditCourse(course.course_id)}"
            >
              ✏️ Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              @click="${() => this.handleDeleteCourse(course.course_id)}"
            >
              🗑️ Ta bort
            </henry-button>
          </div>
        `;

      default:
        return html`${course[column.key] ?? ''}`;
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
    const blockLength = parseInt(
      this.shadowRoot.querySelector("#blockLength").getValue()
    );
    const prerequisitesSelect = this.shadowRoot
      .querySelector("#prerequisites")
      .getSelect();
    const prerequisites = Array.from(prerequisitesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );
    const teachersSelect = this.shadowRoot
      .querySelector("#courseTeachers")
      .getSelect();
    const selectedTeacherIds = Array.from(teachersSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );

    const course = {
      code: this.shadowRoot.querySelector("#courseCode").getInput().value,
      name: this.shadowRoot.querySelector("#courseName").getInput().value,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites: prerequisites,
    };
    const newCourse = store.addCourse(course);

    selectedTeacherIds.forEach((teacherId) => {
      const teacher = store.getTeacher(teacherId);
      if (teacher) {
        const compatibleCourses = teacher.compatible_courses || [];
        if (!compatibleCourses.includes(newCourse.course_id)) {
          store.updateTeacher(teacherId, {
            compatible_courses: [...compatibleCourses, newCourse.course_id],
          });
        }
      }
    });

    this.message = "Kurs tillagd!";
    this.messageType = "success";
    this.shadowRoot.querySelector("form").reset();
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleEditCourse(courseId) {
    this.editingCourseId = courseId;
  }

  handleCancelEdit() {
    this.editingCourseId = null;
  }

  handleSaveCourse(courseId) {
    const code = this.shadowRoot.querySelector(`#edit-code-${courseId}`).value;
    const name = this.shadowRoot.querySelector(`#edit-name-${courseId}`).value;
    const blockLength = parseInt(
      this.shadowRoot.querySelector(`#edit-blockLength-${courseId}`).getSelect()
        .value
    );
    const prerequisitesSelect = this.shadowRoot
      .querySelector(`#edit-prerequisites-${courseId}`)
      .getSelect();
    const prerequisites = Array.from(prerequisitesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value)
    );

    store.updateCourse(courseId, {
      code,
      name,
      hp: blockLength * 7.5,
      default_block_length: blockLength,
      prerequisites,
    });

    this.editingCourseId = null;
    this.message = "Kurs uppdaterad!";
    this.messageType = "success";
    setTimeout(() => {
      this.message = "";
    }, 3000);
  }

  handleDeleteCourse(courseId, courseName) {
    if (confirm(`Är du säker på att du vill ta bort kursen "${courseName}"?`)) {
      store.deleteCourse(courseId);
      this.message = `Kurs "${courseName}" borttagen!`;
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }
}

customElements.define("courses-tab", CoursesTab);
