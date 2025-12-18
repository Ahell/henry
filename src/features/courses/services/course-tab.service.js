import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseFormService } from "./course-form.service.js";

const DEFAULT_CREDITS = "7.5";

export async function createCourseFromForm(root) {
  const formData = FormService.extractFormData(root, {
    code: "courseCode",
    name: "courseName",
    credits: {
      id: "courseCredits",
      transform: (value) => Number(value),
    },
    prerequisites: { id: "prerequisites", type: "select-multiple" },
    selectedTeacherIds: { id: "courseTeachers", type: "select-multiple" },
  });

  if (!Number.isFinite(formData.credits) || formData.credits <= 0) {
    throw new Error("Fyll i giltiga högskolepoäng för kursen.");
  }

  const { course: newCourse, mutationId } = CourseFormService.createCourse(
    {
      code: formData.code,
      name: formData.name,
      credits: formData.credits,
      prerequisites: formData.prerequisites,
    },
    formData.selectedTeacherIds
  );

  await store.saveData({ mutationId });
  return newCourse;
}

export function resetCourseForm(root) {
  FormService.clearCustomForm(root, [
    "prerequisites",
    "courseTeachers",
    "courseCode",
    "courseName",
    "courseCredits",
  ]);
  FormService.setCustomInput(root, "courseCredits", DEFAULT_CREDITS);
}

export async function deleteCourseById(courseId) {
  const { removed, mutationId } = CourseFormService.deleteCourse(courseId);
  if (!removed) return false;
  await store.saveData({ mutationId });
  return true;
}

