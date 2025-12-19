import { store } from "../store/DataStore.js";

/**
 * Base CRUD service providing standard create/update/delete operations
 *
 * This service eliminates duplication across feature-specific form services
 * by providing generic CRUD operations with optimistic updates and rollback.
 *
 * Features implement this by providing entity-specific store methods as callbacks.
 *
 * @example
 * // In CourseFormService:
 * const result = BaseFormService.create("add-course", courseData, {
 *   add: (data) => store.addCourse(data),
 *   delete: (id) => store.deleteCourse(id),
 *   getIdField: "course_id",
 * });
 */
export class BaseFormService {
  /**
   * Create entity with optimistic rollback
   *
   * @param {string} label - Mutation label (e.g., "add-course")
   * @param {Object} data - Entity data to create
   * @param {Object} storeMethods - Store method callbacks
   * @param {Function} storeMethods.add - Function to add entity to store
   * @param {Function} storeMethods.delete - Function to delete entity from store
   * @param {string} storeMethods.getIdField - Field name containing entity ID (e.g., "course_id")
   * @returns {Object} { entity, mutationId } - Created entity and mutation tracking ID
   */
  static create(label, data, storeMethods) {
    const { add, delete: deleteMethod, getIdField } = storeMethods;
    let newEntity = null;

    const mutationId = store.applyOptimistic({
      label,
      rollback: () => {
        if (newEntity && newEntity[getIdField]) {
          deleteMethod(newEntity[getIdField]);
        }
      },
    });

    newEntity = add(data);
    return { entity: newEntity, mutationId };
  }

  /**
   * Update entity with state snapshot rollback
   *
   * @param {string} label - Mutation label (e.g., "update-course")
   * @param {number} id - Entity ID
   * @param {Object} data - Updated entity data
   * @param {Object} storeMethods - Store method callbacks
   * @param {Function} storeMethods.get - Function to get entity by ID
   * @param {Function} storeMethods.update - Function to update entity
   * @returns {Object} { entity, mutationId } - Updated entity and mutation tracking ID
   * @throws {Error} If entity not found
   */
  static update(label, id, data, storeMethods) {
    const { get, update } = storeMethods;
    const existing = get(id);

    if (!existing) {
      throw new Error(`Entity ${id} not found`);
    }

    // Deep copy for arrays in prerequisites/compatible_courses
    // This handles common array fields that need deep copying
    const previous = {
      ...existing,
      ...(existing.prerequisites && {
        prerequisites: [...existing.prerequisites],
      }),
      ...(existing.compatible_courses && {
        compatible_courses: [...existing.compatible_courses],
      }),
    };

    const mutationId = store.applyOptimistic({
      label,
      rollback: () => update(id, previous),
    });

    const updated = update(id, data);
    return { entity: updated, mutationId };
  }

  /**
   * Delete entity
   *
   * @param {string} label - Mutation label (e.g., "delete-course")
   * @param {number} id - Entity ID to delete
   * @param {Object} storeMethods - Store method callbacks
   * @param {Function} storeMethods.delete - Function to delete entity from store
   * @returns {Object} { removed, mutationId } - Whether entity was removed and mutation tracking ID
   */
  static delete(label, id, storeMethods) {
    const { delete: deleteMethod } = storeMethods;

    const mutationId = store.applyOptimistic({
      label,
    });

    const removed = deleteMethod(id);
    return { removed, mutationId };
  }
}
