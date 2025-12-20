import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherFormService } from "./teacher-form.service.js";

export async function createTeacherFromForm(root) {
  const teacher = FormService.extractFormData(root, {
    name: "teacherName",
    home_department: { id: "teacherDepartment", type: "radio" },
    compatible_courses: { id: "teacherCourses", type: "select-multiple" },
  });

  // Validate teacher name
  if (!teacher.name || teacher.name.trim().length === 0) {
    throw new Error("Lärarens namn måste anges.");
  }

  // Validate department
  const validDepartments = ["AIJ", "AIE", "AF"];
  if (
    !teacher.home_department ||
    !validDepartments.includes(teacher.home_department)
  ) {
    throw new Error("Avdelning måste väljas.");
  }

  const { teacher: newTeacher, mutationId } =
    TeacherFormService.createTeacher(teacher);
  await store.saveData({ mutationId });
  return newTeacher;
}

export function resetTeacherForm(root) {
  FormService.clearCustomForm(root, [
    "teacherCourses",
    "teacherName",
    "teacherDepartment",
  ]);
}

export async function deleteTeacherById(teacherId) {
  const { removed, mutationId } = TeacherFormService.deleteTeacher(teacherId);
  if (!removed) return false;
  await store.saveData({ mutationId });
  return true;
}
