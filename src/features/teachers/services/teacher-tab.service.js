import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { TeacherFormService } from "./teacher-form.service.js";

const DEFAULT_DEPARTMENT = "AIJ";

export async function createTeacherFromForm(root) {
  const teacher = FormService.extractFormData(root, {
    name: "teacherName",
    home_department: { id: "teacherDepartment", type: "radio" },
    compatible_courses: { id: "teacherCourses", type: "select-multiple" },
  });
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
  FormService.setCustomInput(root, "teacherDepartment", DEFAULT_DEPARTMENT);
}

export async function deleteTeacherById(teacherId) {
  const { removed, mutationId } = TeacherFormService.deleteTeacher(teacherId);
  if (!removed) return false;
  await store.saveData({ mutationId });
  return true;
}
