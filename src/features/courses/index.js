// Public API for courses feature
export { CoursesManager } from './store/courses.manager.js';
export { CourseRunsManager } from './store/courseRuns.manager.js';
export { CoursesTab } from './components/courses-tab.js';

// Optional: Create hooks for easier consumption
export function useCoursesStore(store) {
  return {
    courses: store.coursesManager.getCourses(),
    addCourse: (c) => store.coursesManager.addCourse(c),
    updateCourse: (id, u) => store.coursesManager.updateCourse(id, u),
    deleteCourse: (id) => store.coursesManager.deleteCourse(id),
  };
}
