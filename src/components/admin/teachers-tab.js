import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import {
  getInputValue,
  getSelectValues,
  getRadioValue,
  resetForm,
  showSuccessMessage,
  showErrorMessage,
  initializeEditState,
  subscribeToStore,
} from "../../utils/admin-helpers.js";
import "../ui/index.js";

export class TeachersTab extends LitElement {
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

    henry-table {
      margin-top: var(--space-4);
    }

    .edit-input {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-sm);
    }
  `;

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
      ${
        this.message
          ? html`<div class="${this.messageType}">${this.message}</div>`
          : ""
      }

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
        <div style="margin-bottom: 1rem; display:flex; gap: 1rem; align-items:center;">
          <henry-button
            variant="secondary"
            @click="${this.handleRandomizeCourses}"
          >
            Slumpa kurser till alla lärare
          </henry-button>
          <input id="teacherCsvInput" type="file" accept=".csv" style="display:none" @change="${
            this.handleTeacherCsvUpload
          }" />
          <henry-button variant="primary" @click="${() =>
            this.shadowRoot
              .querySelector("#teacherCsvInput")
              .click()}">Importera Lärare (CSV)</henry-button>
          <henry-button variant="secondary" @click="${
            this.exportTeachersCsv
          }">Exportera Lärare (CSV)</henry-button>
          <henry-button variant="danger" @click="${
            this.handleResetTeachersClick
          }">Återställ lärare (DB)</henry-button>
        </div>
        <henry-table
          striped
          hoverable
          .columns="${this._getTeacherTableColumns()}"
          .data="${store.getTeachers()}"
          .renderCell="${(row, col) => this._renderTeacherTableCell(row, col)}"
        </henry-table>
      </henry-panel>

      ${this._renderEditModal()}
    `;
  }

  _renderEditModal() {
    if (!this.editingTeacherId) return html``;

    const teacher = store.getTeacher(this.editingTeacherId);
    if (!teacher) return html``;

    const departments = ["AIJ", "AIE", "AF"];

    return html`
      <henry-modal
        open
        title="Redigera Lärare"
        @close="${this.handleCancelTeacherEdit}"
      >
        <form @submit="${(e) => this._handleSaveFromModal(e)}">
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <henry-input
              id="edit-name"
              label="Namn"
              .value="${teacher.name}"
              required
            ></henry-input>

            <henry-radio-group
              id="edit-department"
              label="Avdelning"
              name="edit-department"
              value="${teacher.home_department}"
              .options=${departments.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            ></henry-radio-group>

            <henry-select
              id="edit-courses"
              label="Kompatibla kurser"
              multiple
              size="8"
              .options=${store.getCourses().map((c) => ({
                value: c.course_id.toString(),
                label: `${c.code} - ${c.name}`,
                selected: teacher.compatible_courses?.includes(c.course_id),
              }))}
            ></henry-select>
          </div>
        </form>

        <div slot="footer">
          <henry-button
            variant="secondary"
            @click="${this.handleCancelTeacherEdit}"
          >
            Avbryt
          </henry-button>
          <henry-button
            variant="success"
            @click="${() => this.handleSaveTeacher(teacher.teacher_id)}"
          >
            Spara
          </henry-button>
        </div>
      </henry-modal>
    `;
  }

  _handleSaveFromModal(e) {
    e.preventDefault();
    if (this.editingTeacherId) {
      this.handleSaveTeacher(this.editingTeacherId);
    }
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

      const newTeacher = store.addTeacher(teacher);

      try {
        // Wait for persistence before clearing the form so the UI
        // doesn't lose state if save fails
        await store.saveData();

        // Reset the native form
        resetForm(root);

        // Clear custom henry-select (teacherCourses)
        const clearCustomSelect = (id) => {
          const el = root.querySelector(`#${id}`);
          if (!el || typeof el.getSelect !== "function") return;
          const sel = el.getSelect();
          if (!sel) return;
          Array.from(sel.options).forEach((o) => (o.selected = false));
          sel.value = "";
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        };

        clearCustomSelect("teacherCourses");

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
        // If save failed, remove the optimistic teacher we added earlier
        if (newTeacher && newTeacher.teacher_id) {
          store.deleteTeacher(newTeacher.teacher_id);
        }
      }
    })();
  }

  handleEditTeacher(teacherId) {
    this.editingTeacherId = teacherId;
  }

  handleCancelTeacherEdit() {
    this.editingTeacherId = null;
  }

  handleSaveTeacher(teacherId) {
    const root = this.shadowRoot;
    const name = getInputValue(root, "edit-name");
    const home_department = getRadioValue(root, "edit-department");
    const compatible_courses = getSelectValues(root, "edit-courses");

    store.updateTeacher(teacherId, {
      name,
      home_department,
      compatible_courses,
    });

    this.editingTeacherId = null;
    showSuccessMessage(this, "Lärare uppdaterad!");
  }

  handleRandomizeCourses() {
    if (
      confirm(
        "Detta kommer att ersätta alla lärares nuvarande kurser med slumpade kurser. Fortsätta?"
      )
    ) {
      store.randomizeTeacherCourses(2, 5);
      this.message = "Kurser slumpade till alla lärare!";
      this.messageType = "success";
      setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }

  handleDeleteTeacher(teacherId, teacherName) {
    (async () => {
      if (
        !confirm(`Är du säker på att du vill ta bort läraren "${teacherName}"?`)
      ) {
        return;
      }

      // Optimistically remove from client state
      const removed = store.deleteTeacher(teacherId);
      if (!removed) return;

      try {
        await store.saveData();
        showSuccessMessage(this, `Lärare "${teacherName}" borttagen!`);
      } catch (err) {
        // If save failed, reload from backend to restore state
        try {
          await store.loadFromBackend();
        } catch (e) {
          console.error("Failed to reload data after failed delete:", e);
        }
        showErrorMessage(this, `Kunde inte ta bort läraren: ${err.message}`);
      }
    })();
  }

  async handleTeacherCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = this.parseTeachersCsv(text);

      // Map course codes to ids
      const courses = store.getCourses();
      const codeToId = new Map(courses.map((c) => [c.code, c.course_id]));

      rows.forEach((r) => {
        // Try to find existing teacher by id or exact name
        let teacher = null;
        if (r.teacher_id) {
          teacher = store.getTeacher(Number(r.teacher_id));
        }
        if (!teacher && r.name) {
          teacher = store.getTeachers().find((t) => t.name === r.name);
        }

        const compatIds = (r.compatible_courses || [])
          .map((v) => {
            const maybeNum = Number(v);
            if (Number.isFinite(maybeNum) && store.getCourse(maybeNum))
              return maybeNum;
            return codeToId.get(v) ?? null;
          })
          .filter(Boolean);

        if (teacher) {
          store.updateTeacher(teacher.teacher_id, {
            name: r.name || teacher.name,
            home_department: r.home_department || teacher.home_department,
            compatible_courses: compatIds.length
              ? compatIds
              : teacher.compatible_courses,
          });
        } else {
          store.addTeacher({
            name: r.name,
            home_department: r.home_department || "",
            compatible_courses: compatIds,
          });
        }
      });

      showSuccessMessage(
        this,
        `Importerade ${rows.length} lärare från ${file.name}`
      );
    } catch (err) {
      showErrorMessage(this, `Fel vid import: ${err.message}`);
    }
  }

  parseTeachersCsv(content) {
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = values[idx] ?? ""));
      const compat = (obj.compatible_courses || "")
        .split(/[;|\\/]/)
        .map((s) => s.trim())
        .filter(Boolean);
      rows.push({
        teacher_id: obj.teacher_id ? Number(obj.teacher_id) : null,
        name: obj.name || "",
        home_department: obj.home_department || "",
        compatible_courses: compat,
      });
    }
    return rows;
  }

  exportTeachersCsv() {
    const teachers = store.getTeachers();
    const courses = store.getCourses();
    let csv = "teacher_id,name,home_department,compatible_courses\n";
    teachers.forEach((t) => {
      const compat = (t.compatible_courses || [])
        .map((cid) => store.getCourse(cid)?.code || cid)
        .join(";");
      csv += `${t.teacher_id},"${t.name}","${t.home_department}","${compat}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teachers.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async handleResetTeachersClick() {
    if (
      !confirm(
        "Är du säker? Detta kommer att radera alla lärare och ta bort deras kopplingar i DB."
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/reset-teachers", { method: "POST" });
      if (!res.ok) {
        const js = await res.json().catch(() => ({}));
        throw new Error(js.error || "Serverfel");
      }
      await store.loadFromBackend();
      showSuccessMessage(
        this,
        "Lärare återställda och referenser rensade i DB"
      );
    } catch (err) {
      showErrorMessage(this, `Kunde inte återställa lärare: ${err.message}`);
    }
  }
}

customElements.define("teachers-tab", TeachersTab);
