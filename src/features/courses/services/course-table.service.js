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
      { key: "actions", label: "", width: "120px" },
    ];
  }

  static renderCell(course, column, onEdit) {
    if (!course || !column) return html``;

    switch (column.key) {
      case "code":
        return html`${course.code}`;
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
          <henry-button
            variant="secondary"
            size="small"
            @click="${() => onEdit?.(course.course_id)}"
          >
            ✏️ Redigera
          </henry-button>
        `;
      default:
        return html`${course[column.key] ?? ""}`;
    }
  }
}
