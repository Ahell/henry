/**
 * Admin helpers - Shared utilities for admin tab components
 *
 * Provides consistent patterns for:
 * - Message handling
 * - Form value extraction
 * - Edit state management
 * - Teacher-course synchronization
 */

import { store } from "./store.js";

/**
 * Show a temporary success message in a component
 * @param {LitElement} component - The component to show message in
 * @param {string} message - The success message text
 * @param {number} duration - How long to show message (ms)
 */
export function showSuccessMessage(component, message, duration = 3000) {
  component.message = message;
  component.messageType = "success";
  setTimeout(() => {
    component.message = "";
  }, duration);
}

/**
 * Show a temporary error message in a component
 * @param {LitElement} component - The component to show message in
 * @param {string} message - The error message text
 * @param {number} duration - How long to show message (ms)
 */
export function showErrorMessage(component, message, duration = 5000) {
  component.message = message;
  component.messageType = "error";
  setTimeout(() => {
    component.message = "";
  }, duration);
}

/**
 * Get value from a henry-input component
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {string} The input value
 */
export function getInputValue(root, id) {
  const el = root.querySelector(`#${id}`);
  if (!el) return "";
  if (typeof el.getInput === "function") {
    const input = el.getInput();
    return input ? input.value : "";
  }
  if (typeof el.getSelect === "function") {
    const select = el.getSelect();
    return select ? select.value : "";
  }
  return el.value ?? "";
}

/**
 * Get selected values from a henry-select component
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {number[]} Array of selected values as integers
 */
export function getSelectValues(root, id) {
  const select = root.querySelector(`#${id}`).getSelect();
  return Array.from(select.selectedOptions).map((opt) => parseInt(opt.value));
}

/**
 * Get value from a henry-radio-group component
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} id - The element ID
 * @returns {string} The selected value
 */
export function getRadioValue(root, id) {
  return root.querySelector(`#${id}`).getValue();
}

/**
 * Reset a form in the shadow DOM
 * @param {ShadowRoot} root - The shadow root to query in
 * @param {string} selector - Form selector (default: "form")
 */
export function resetForm(root, selector = "form") {
  const form = root.querySelector(selector);
  if (form) {
    form.reset();
  }
}

/**
 * Synchronize teacher-course relationships when a course is added
 * Updates all selected teachers to include the new course
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
 * Synchronize teacher-course relationships when a course is updated
 * Adds/removes the course from teachers based on selection
 * @param {number} courseId - The course ID
 * @param {number[]} selectedTeacherIds - Array of teacher IDs that should have this course
 */
export function syncCourseToTeachers(courseId, selectedTeacherIds) {
  store.getTeachers().forEach((teacher) => {
    const currentCourses = teacher.compatible_courses || [];
    const shouldInclude = selectedTeacherIds.includes(teacher.teacher_id);
    const currentlyIncluded = currentCourses.includes(courseId);

    if (shouldInclude && !currentlyIncluded) {
      // Add this course to teacher's compatible courses
      store.updateTeacher(teacher.teacher_id, {
        compatible_courses: [...currentCourses, courseId],
      });
    } else if (!shouldInclude && currentlyIncluded) {
      // Remove this course from teacher's compatible courses
      store.updateTeacher(teacher.teacher_id, {
        compatible_courses: currentCourses.filter((id) => id !== courseId),
      });
    }
  });
}

/**
 * Initialize edit state properties for a component
 * Call this in the component's constructor
 * @param {LitElement} component - The component to initialize
 * @param {string} editingProperty - Name of the editing ID property (e.g., "editingCourseId")
 */
export function initializeEditState(component, editingProperty = "editingId") {
  component[editingProperty] = null;
  component.message = "";
  component.messageType = "";
}

/**
 * Subscribe component to store updates
 * Call this in the component's constructor after initializeEditState
 * @param {LitElement} component - The component to subscribe
 */
export function subscribeToStore(component) {
  console.log("🔵 Subscribing component:", component.constructor.name);
  store.subscribe(() => {
    console.log(
      "🔵 Store changed, updating component:",
      component.constructor.name
    );
    // Update cohorts array if it exists
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
