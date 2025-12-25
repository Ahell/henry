import { html } from "lit";
import { store } from "../../../platform/store/DataStore.js";

export class TeacherTableService {
  static getColumns() {
    return [
      { key: "name", label: "Namn", width: "200px" },
      { key: "compatible_courses", label: "Kompatibla kurser", width: "250px" },
      { key: "examinator_courses", label: "Examinator för", width: "250px" },
      { key: "actions", label: "", width: "120px" },
    ];
  }

  static renderCell(teacher, column, onEdit) {
    if (!teacher || !column) return html``;

    switch (column.key) {
      case "name":
        return html`${teacher.name}`;
      case "compatible_courses":
        const compatibleCourses = store
          .getCourses()
          .filter((c) => teacher.compatible_courses?.includes(c.course_id))
          .map((c) => c.code)
          .join(", ");
        return html`${compatibleCourses || "-"}`;
      case "examinator_courses":
        const examinatorCourses = store
          .getExaminatorCoursesForTeacher(teacher.teacher_id)
          .map((c) => c.code)
          .join(", ");
        return html`${examinatorCourses || "-"}`;
      case "actions":
        return html`
          <henry-button
            variant="secondary"
            size="small"
            @click="${() => onEdit?.(teacher.teacher_id)}"
          >
            ✏️ Redigera
          </henry-button>
        `;
      default:
        return html`${teacher[column.key] ?? ""}`;
    }
  }
}
