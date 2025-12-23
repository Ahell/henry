/**
 * @typedef {Object} Course
 * @property {number} course_id
 * @property {string} code
 * @property {string} name
 * @property {number} credits
 * @property {number[]} prerequisites
 * @property {number[]} compatible_courses - For teachers
 */

/**
 * @typedef {Object} CourseFormData
 * @property {string} code
 * @property {string} name
 * @property {number} credits
 * @property {number[]} prerequisites
 * @property {number[]} selectedTeacherIds
 * @property {number|null} examinatorTeacherId
 */
