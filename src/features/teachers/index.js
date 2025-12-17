// Public API for teachers feature
export { TeachersManager } from '../../platform/store/managers/teachers.manager.js';
export { TeachersTab } from './components/teachers-tab.js';

// Optional: Create hooks for easier consumption
export function useTeachersStore(store) {
  return {
    teachers: store.teachersManager.getTeachers(),
    addTeacher: (t) => store.teachersManager.addTeacher(t),
    updateTeacher: (id, u) => store.teachersManager.updateTeacher(id, u),
    deleteTeacher: (id) => store.teachersManager.deleteTeacher(id),
  };
}
