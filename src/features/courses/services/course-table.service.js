import { html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

export class CourseTableService {
  static getColumns() {
    return [
      { key: "code", label: "Kod", width: "100px" },
      { key: "name", label: "Namn", width: "200px" },
      { key: "credits", label: "HP", width: "80px" },
      { key: "prerequisites", label: "Spärrkurser", width: "150px" },
      {
        key: "compatible_teachers",
        label: "Kompatibla lärare",
        width: "200px",
      },
      { key: "examinator", label: "Examinator", width: "150px" },
      { key: "actions", label: "Åtgärder", width: "160px" },
    ];
  }

  static renderCell(course, column, onEdit, onInfo, onDelete) {
    if (!course || !column) return html``;

    switch (column.key) {
      case "code":
        return html`
          <button
            class="course-code-button"
            type="button"
            @click="${() => onInfo?.(course.course_id)}"
          >
            ${course.code}
          </button>
        `;
      case "name":
        return html`${course.name}`;
      case "credits":
        return html`${course.credits} hp`;
      case "prerequisites":
        const prereqs = (course.prerequisites || [])
          .map((id) => store.getCourse(id)?.code)
          .filter(Boolean)
          .join(", ");
        return html`${prereqs || "-"}`;
      case "compatible_teachers":
        const teachers = store
          .getTeachers()
          .filter((t) => t.compatible_courses?.includes(course.course_id))
          .map((t) => t.name)
          .join(", ");
        return html`${teachers || "-"}`;
      case "examinator":
        const tid = store.getCourseExaminatorTeacherId(course.course_id);
        const teacher = store.getTeacher(tid);
        return html`${teacher?.name || "-"}`;
      case "actions":
        return html`
          <div style="display: flex; gap: var(--space-2);">
            <henry-button
              variant="secondary"
              size="small"
              ?disabled=${!store.editMode}
              @click="${() => onEdit?.(course.course_id)}"
            >
              Redigera
            </henry-button>
            <henry-button
              variant="danger"
              size="small"
              ?disabled=${!store.editMode}
              @click="${() => onDelete?.(course.course_id)}"
            >
              Ta bort
            </henry-button>
          </div>
        `;
      default:
        return html`${course[column.key] ?? ""}`;
    }
  }
}
