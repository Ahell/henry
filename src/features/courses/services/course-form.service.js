import { store } from "../../../platform/store/DataStore.js";
import { FormService } from "../../../platform/services/form.service.js";
import { CourseService } from "./course.service.js";

/**
 * Course Form Service
 * Handles form-specific operations for course forms
 */
export class CourseFormService {
  static resetForm(root) {
    CourseService.resetCourseForm(root);
  }

  static getInitialStateForAdd() {
    return {
      selectedPrerequisiteIds: [],
      selectedCompatibleTeacherIds: [],
      selectedExaminatorTeacherId: "",
      formValid: false,
    };
  }

  static getInitialStateForEdit(courseId) {
    const course = store.getCourse(courseId);
    if (!course) return this.getInitialStateForAdd();

    const selectedPrerequisiteIds = Array.isArray(course.prerequisites)
      ? course.prerequisites.map(String)
      : [];
    const selectedCompatibleTeacherIds = (store.getTeachers() || [])
      .filter((t) => t.compatible_courses?.includes(course.course_id))
      .map((t) => String(t.teacher_id));
    let selectedExaminatorTeacherId = String(
      store.getCourseExaminatorTeacherId(course.course_id) ??
        course.examinator_teacher_id ??
        ""
    );

    if (
      selectedExaminatorTeacherId &&
      !selectedCompatibleTeacherIds.includes(selectedExaminatorTeacherId)
    ) {
      selectedCompatibleTeacherIds = [
        ...selectedCompatibleTeacherIds,
        selectedExaminatorTeacherId,
      ];
    }

    return {
      selectedPrerequisiteIds,
      selectedCompatibleTeacherIds,
      selectedExaminatorTeacherId,
      formValid: false,
    };
  }

  static handlePrerequisiteChange(values) {
    return {
      selectedPrerequisiteIds: values.map(String),
    };
  }

  static handleCompatibleTeachersChange(values, currentExaminator) {
    const selectedCompatibleTeacherIds = values.map(String);
    const selectedExaminatorTeacherId = selectedCompatibleTeacherIds.includes(currentExaminator)
      ? currentExaminator
      : "";
    return {
      selectedCompatibleTeacherIds,
      selectedExaminatorTeacherId,
    };
  }

  static handleExaminatorChange(value) {
    return {
      selectedExaminatorTeacherId: String(value ?? ""),
    };
  }

  static isFormValid(root, mode, courseId) {
    const baseValid = FormService.isFormValid(root);
    if (!baseValid) return false;

    const prefix = mode === "edit" ? "edit-" : "course";
    const { code, name } = FormService.extractFormData(root, {
      code: `${prefix}code`,
      name: `${prefix}name`,
    });

    const excludeId = mode === "edit" ? courseId : null;
    return (
      CourseService.isCourseCodeUnique(code, excludeId) &&
      CourseService.isCourseNameUnique(name, excludeId)
    );
  }

  static extractFormData(root, mode) {
    const prefix = mode === "edit" ? "edit-" : "course";
    const fieldIds = {
      code: `${prefix}code`,
      name: `${prefix}name`,
      credits: { id: `${prefix}credits`, transform: (value) => Number(value) },
      prerequisites: { id: `${prefix}prerequisites`, type: "select-multiple" },
      selectedTeacherIds: { id: `${prefix}Teachers`, type: "select-multiple" },
    };
    return FormService.extractFormData(root, fieldIds);
  }
}
