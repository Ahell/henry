import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  getSelectValues,
  getRadioValue,
  resetForm,
  showSuccessMessage,
  showErrorMessage,
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
          <henry-text variant="heading-3">Import/Export Kurser (CSV)</henry-text>
        </div>
        <div style="display:flex; gap: 1rem; align-items:center;">
          <input id="courseCsvInput" type="file" accept=".csv" style="display:none" @change="${this.handleCourseCsvUpload}" />
          <henry-button variant="primary" @click="${() => this.shadowRoot.querySelector('#courseCsvInput').click()}">Importera CSV</henry-button>
          <henry-button variant="secondary" @click="${this.exportCoursesCsv}">Exportera CSV</henry-button>
        </div>
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

            <henry-select
              id="edit-credits"
              label="Högskolepoäng"
              required
              .options=${[
                {
                  value: "7.5",
                  label: "7,5 hp",
                  selected: (course.credits ?? 7.5) === 7.5,
                },
                {
                  value: "15",
                  label: "15 hp",
                  selected: course.credits === 15,
                },
              ]}
            ></henry-select>

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
    const root = this.shadowRoot;
    const prerequisites = getSelectValues(root, "prerequisites");
    const selectedTeacherIds = getSelectValues(root, "courseTeachers");

    const course = {
      code: getInputValue(root, "courseCode"),
      name: getInputValue(root, "courseName"),
      credits: parseFloat(getInputValue(root, "courseCredits")) || 0,
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
    const credits = parseFloat(getInputValue(root, "edit-credits")) || 0;
    const prerequisites = getSelectValues(root, "edit-prerequisites");
    const selectedTeacherIds = getSelectValues(
      root,
      "edit-compatible-teachers"
    );

    store.updateCourse(courseId, {
      code,
      name,
      credits,
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

  async handleCourseCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = this.parseCoursesCsv(text);

      // First pass: add or update courses, keep mapping from code -> id
      const codeToId = new Map();
      rows.forEach((r) => {
        const existing = store.getCourses().find((c) => c.code === r.code);
        if (existing) {
          store.updateCourse(existing.course_id, {
            name: r.name,
            credits: r.credits,
          });
          codeToId.set(r.code, existing.course_id);
        } else {
          const newCourse = store.addCourse({
            code: r.code,
            name: r.name,
            credits: r.credits,
          });
          codeToId.set(r.code, newCourse.course_id);
        }
      });

      // Second pass: apply prerequisites and compatible teachers
      rows.forEach((r) => {
        const courseId = codeToId.get(r.code);
        if (!courseId) return;

        // Prerequisites: map codes to ids
        const prereqIds = (r.prerequisites || [])
          .map((code) => codeToId.get(code) || store.getCourses().find((c) => c.code === code)?.course_id)
          .filter(Boolean);
        store.updateCourse(courseId, { prerequisites: prereqIds });

        // Compatible teachers: accept numeric ids or teacher names
        const teacherIds = (r.compatible_teachers || [])
          .map((t) => {
            if (!t) return null;
            const maybeId = Number(t);
            if (Number.isFinite(maybeId) && store.getTeacher(maybeId)) return maybeId;
            const found = store.getTeachers().find((th) => th.name === t);
            return found ? found.teacher_id : null;
          })
          .filter(Boolean);

        if (teacherIds.length > 0) addCourseToTeachers(courseId, teacherIds);
      });

      showSuccessMessage(this, `Importerade ${rows.length} kurser från ${file.name}`);
    } catch (err) {
      showErrorMessage(this, `Fel vid import: ${err.message}`);
    }
  }

  // CSV parser tailored for courses; supports headers: code,name,credits,prerequisites,compatible_teachers
  parseCoursesCsv(content) {
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = values[idx] ?? ""));

      const prerequisites = (obj.prerequisites || "").split(/[;|\\/]/).map((s) => s.trim()).filter(Boolean);
      const compatible_teachers = (obj.compatible_teachers || "").split(/[;|\\/]/).map((s) => s.trim()).filter(Boolean);

      rows.push({
        code: obj.code || obj.kod || "",
        name: obj.name || obj.namn || "",
        credits: obj.credits ? Number(obj.credits) : obj.hp ? Number(obj.hp) : 0,
        prerequisites,
        compatible_teachers,
      });
    }
    return rows;
  }

  exportCoursesCsv() {
    const courses = store.getCourses();
    const teachers = store.getTeachers();
    let csv = "code,name,credits,prerequisites,compatible_teachers\n";
    courses.forEach((c) => {
      const prereqCodes = (c.prerequisites || [])
        .map((pid) => store.getCourse(pid)?.code)
        .filter(Boolean)
        .join(";");
      const teacherNames = teachers
        .filter((t) => (t.compatible_courses || []).includes(c.course_id))
        .map((t) => t.name)
        .join(";");
      csv += `${c.code},"${c.name}",${c.credits ?? ""},"${prereqCodes}","${teacherNames}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courses.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

customElements.define("courses-tab", CoursesTab);
