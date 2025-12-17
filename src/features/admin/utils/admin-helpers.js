/**
 * Admin feature helpers - store-coupled utilities for admin tab components.
 */

import { store } from "../../../platform/store/DataStore.js";

/**
 * Synchronize teacher-course relationships when a course is added.
 * Updates all selected teachers to include the new course.
 * @param {number} courseId - The course ID
 * @param {number[]} selectedTeacherIds - Array of teacher IDs to link
 */
export function addCourseToTeachers(courseId, selectedTeacherIds) {
  selectedTeacherIds.forEach((teacherId) => {
    const teacher = store.getTeacher(teacherId);
    if (teacher) {
      const compatibleCourses = teacher.compatible_courses || [];
      if (!compatibleCourses.includes(courseId)) {
        store.updateTeacher(teacherId, {
          compatible_courses: [...compatibleCourses, courseId],
        });
      }
    }
  });
}

/**
 * Synchronize teacher-course relationships when a course is updated.
 * Adds/removes the course from teachers based on selection.
 * @param {number} courseId - The course ID
 * @param {number[]} selectedTeacherIds - Array of teacher IDs that should have this course
 */
export function syncCourseToTeachers(courseId, selectedTeacherIds) {
  store.getTeachers().forEach((teacher) => {
    const currentCourses = teacher.compatible_courses || [];
    const shouldInclude = selectedTeacherIds.includes(teacher.teacher_id);
    const currentlyIncluded = currentCourses.includes(courseId);

    if (shouldInclude && !currentlyIncluded) {
      store.updateTeacher(teacher.teacher_id, {
        compatible_courses: [...currentCourses, courseId],
      });
    } else if (!shouldInclude && currentlyIncluded) {
      store.updateTeacher(teacher.teacher_id, {
        compatible_courses: currentCourses.filter((id) => id !== courseId),
      });
    }
  });
}

/**
 * Initialize edit state properties for a component.
 * Call this in the component's constructor.
 * @param {LitElement} component - The component to initialize
 * @param {string} editingProperty - Name of the editing ID property
 */
export function initializeEditState(component, editingProperty = "editingId") {
  component[editingProperty] = null;
  component.message = "";
  component.messageType = "";
}

/**
 * Subscribe component to store updates.
 * Call this in the component's constructor after initializeEditState.
 * @param {LitElement} component - The component to subscribe
 */
export function subscribeToStore(component) {
  console.log("🔵 Subscribing component:", component.constructor.name);
  store.subscribe(() => {
    console.log(
      "🔵 Store changed, updating component:",
      component.constructor.name
    );
    if (component.cohorts !== undefined) {
      const newCohorts = store.getCohorts();
      console.log(
        "🔵 Updating cohorts from",
        component.cohorts.length,
        "to",
        newCohorts.length
      );
      component.cohorts = newCohorts;
    }
    console.log("🔵 Calling requestUpdate");
    component.requestUpdate();
  });
}
