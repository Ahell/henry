import { store } from "../store/DataStore.js";

/**
 * Generic CSV Service
 * Provides reusable CSV parsing and export functionality
 */
export class CsvService {
  /**
   * Parse CSV content with a schema
   * @param {string} content - CSV text content
   * @param {Object} schema - Schema definition with header mappings
   * @returns {Array} Parsed rows
   */
  static parseCsv(content, schema) {
    const lines = content.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj = {};

      headers.forEach((h, idx) => {
        obj[h] = values[idx] ?? "";
      });

      rows.push(obj);
    }

    return rows;
  }

  /**
   * Export data to CSV and trigger download
   * @param {Array} data - Array of objects to export
   * @param {Array} columns - Column definitions [{key, label}]
   * @param {string} filename - Output filename
   */
  static exportCsv(data, columns, filename) {
    const headers = columns.map((col) => col.key).join(",");
    let csv = headers + "\n";

    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.key];
        // Quote strings containing commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      });
      csv += values.join(",") + "\n";
    });

    this._downloadCsv(csv, filename);
  }

  /**
   * Trigger CSV file download in browser
   * @private
   */
  static _downloadCsv(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate CSV headers against required columns
   * @param {Array} headers - CSV headers
   * @param {Array} required - Required column names
   * @returns {Object} {valid: boolean, missing: Array}
   */
  static validateHeaders(headers, required) {
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    const missing = required.filter(
      (req) => !lowerHeaders.includes(req.toLowerCase())
    );
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Course-specific CSV operations
 */

/**
 * Parse courses CSV content
 * Expects headers: code, name, credits, prerequisites, compatible_teachers
 * @param {string} content - CSV content
 * @returns {Array} Parsed course rows
 */
export function parseCoursesCsv(content) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = values[idx] ?? ""));

    // Parse prerequisites (semicolon, pipe, or backslash separated)
    const prerequisites = (obj.prerequisites || "")
      .split(/[;|\\/]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse compatible teachers
    const compatible_teachers = (obj.compatible_teachers || "")
      .split(/[;|\\/]/)
      .map((s) => s.trim())
      .filter(Boolean);

    rows.push({
      code: obj.code || obj.kod || "",
      name: obj.name || obj.namn || "",
      credits: obj.credits
        ? Number(obj.credits)
        : obj.hp
        ? Number(obj.hp)
        : 0,
      prerequisites,
      compatible_teachers,
    });
  }

  return rows;
}

/**
 * Export courses to CSV
 * @param {Array} courses - Course objects from store
 * @param {Array} teachers - Teacher objects from store
 * @returns {string} CSV content
 */
export function exportCoursesCsv(courses, teachers) {
  let csv = "code,name,credits,prerequisites,compatible_teachers\n";

  courses.forEach((c) => {
    // Get prerequisite course codes
    const prereqCodes = (c.prerequisites || [])
      .map((pid) => store.getCourse(pid)?.code)
      .filter(Boolean)
      .join(";");

    // Get compatible teacher names
    const teacherNames = teachers
      .filter((t) => (t.compatible_courses || []).includes(c.course_id))
      .map((t) => t.name)
      .join(";");

    csv += `${c.code},"${c.name}",${
      c.credits ?? ""
    },"${prereqCodes}","${teacherNames}"\n`;
  });

  return csv;
}

/**
 * Export courses and trigger download
 */
export function exportCoursesToFile() {
  const courses = store.getCourses();
  const teachers = store.getTeachers();
  const csv = exportCoursesCsv(courses, teachers);

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "courses.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Teacher-specific CSV operations
 */

/**
 * Parse teachers CSV content
 * Expects headers: teacher_id (optional), name, home_department, compatible_courses
 * @param {string} content - CSV content
 * @returns {Array} Parsed teacher rows
 */
export function parseTeachersCsv(content) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = values[idx] ?? ""));

    // Parse compatible courses (semicolon, pipe, or backslash separated)
    const compat = (obj.compatible_courses || "")
      .split(/[;|\\/]/)
      .map((s) => s.trim())
      .filter(Boolean);

    rows.push({
      teacher_id: obj.teacher_id ? Number(obj.teacher_id) : null,
      name: obj.name || "",
      home_department: obj.home_department || "",
      compatible_courses: compat,
    });
  }

  return rows;
}

/**
 * Export teachers to CSV
 * @param {Array} teachers - Teacher objects from store
 * @param {Array} courses - Course objects from store
 * @returns {string} CSV content
 */
export function exportTeachersCsv(teachers, courses) {
  let csv = "teacher_id,name,home_department,compatible_courses\n";

  teachers.forEach((t) => {
    // Get compatible course codes
    const compat = (t.compatible_courses || [])
      .map((cid) => store.getCourse(cid)?.code || cid)
      .join(";");

    csv += `${t.teacher_id},"${t.name}","${t.home_department}","${compat}"\n`;
  });

  return csv;
}

/**
 * Export teachers and trigger download
 */
export function exportTeachersToFile() {
  const teachers = store.getTeachers();
  const courses = store.getCourses();
  const csv = exportTeachersCsv(teachers, courses);

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "teachers.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
