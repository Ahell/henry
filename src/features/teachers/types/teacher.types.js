/**
 * Teacher Types
 * Type definitions for teacher-related data structures
 */

/**
 * @typedef {Object} Teacher
 * @property {number} teacher_id - Unique identifier
 * @property {string} name - Teacher's full name
 * @property {number[]} compatible_courses - Array of course IDs the teacher can teach
 * @property {number[]} examinator_courses - Array of course IDs where teacher is examinator
 */

/**
 * @typedef {Object} TeacherFormData
 * @property {string} name - Teacher name
 * @property {number[]} compatibleCourses - Compatible course IDs
 * @property {number[]} examinatorCourses - Examinator course IDs
 */

/**
 * @typedef {Object} TeacherTableColumn
 * @property {string} key - Column identifier
 * @property {string} label - Display label
 * @property {string} width - CSS width
 */
