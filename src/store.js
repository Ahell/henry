import { LitElement, html, css } from 'lit';

export class DataStore {
  constructor() {
    this.courses = [];
    this.cohorts = [];
    this.teachers = [];
    this.slots = [];
    this.courseRuns = [];
    this.teacherAvailability = [];
    this.listeners = [];

    // Load seed data on first load if no data exists
    this.loadInitialData();
  }

  // Load initial data from localStorage or use seed data
  loadInitialData() {
    const hasData = localStorage.getItem('kurser');
    if (hasData) {
      this.courses = JSON.parse(localStorage.getItem('kurser'));
      this.cohorts = JSON.parse(localStorage.getItem('grupper'));
      this.teachers = JSON.parse(localStorage.getItem('personal'));
      this.slots = JSON.parse(localStorage.getItem('slots'));
      this.courseRuns = JSON.parse(localStorage.getItem('kurstillfallen'));
      this.teacherAvailability = JSON.parse(localStorage.getItem('teacherAvailability')) || [];
    } else {
      // Load seed data dynamically
      import('./seedData.js').then(module => {
        this.importData(module.seedData);
      });
    }
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(l => l());
    this.saveData();
  }

  // Courses
  addCourse(course) {
    const id = Math.max(...this.courses.map(c => c.course_id), 0) + 1;
    const newCourse = {
      course_id: id,
      code: course.code || '',
      name: course.name || '',
      hp: course.hp || 7.5,
      is_law_course: course.is_law_course || false,
      law_type: course.law_type || null,
      default_block_length: course.default_block_length || 1,
      preferred_order_index: course.preferred_order_index || 999
    };
    this.courses.push(newCourse);
    this.notify();
    return newCourse;
  }

  getCourses() {
    return this.courses;
  }

  getCourse(courseId) {
    return this.courses.find(c => c.course_id === courseId);
  }

  // Cohorts
  addCohort(cohort) {
    const id = Math.max(...this.cohorts.map(c => c.cohort_id), 0) + 1;
    const newCohort = {
      cohort_id: id,
      name: cohort.name || '',
      start_date: cohort.start_date || '',
      planned_size: cohort.planned_size || 0
    };
    this.cohorts.push(newCohort);
    this.notify();
    return newCohort;
  }

  getCohorts() {
    return this.cohorts;
  }

  getCohort(cohortId) {
    return this.cohorts.find(c => c.cohort_id === cohortId);
  }

  // Teachers
  addTeacher(teacher) {
    const id = Math.max(...this.teachers.map(t => t.teacher_id), 0) + 1;
    const newTeacher = {
      teacher_id: id,
      name: teacher.name || '',
      home_department: teacher.home_department || ''
    };
    this.teachers.push(newTeacher);
    this.notify();
    return newTeacher;
  }

  getTeachers() {
    return this.teachers;
  }

  getTeacher(teacherId) {
    return this.teachers.find(t => t.teacher_id === teacherId);
  }

  // Slots
  addSlot(slot) {
    const id = Math.max(...this.slots.map(s => s.slot_id), 0) + 1;
    const newSlot = {
      slot_id: id,
      start_date: slot.start_date || '',
      end_date: slot.end_date || '',
      evening_pattern: slot.evening_pattern || '',
      is_placeholder: slot.is_placeholder !== false,
      location: slot.location || '',
      is_law_period: slot.is_law_period || false
    };
    this.slots.push(newSlot);
    this.notify();
    return newSlot;
  }

  getSlots() {
    return this.slots;
  }

  getSlot(slotId) {
    return this.slots.find(s => s.slot_id === slotId);
  }

  // Course Runs
  addCourseRun(run) {
    const id = Math.max(...this.courseRuns.map(r => r.run_id), 0) + 1;
    const newRun = {
      run_id: id,
      course_id: run.course_id,
      slot_id: run.slot_id,
      teacher_id: run.teacher_id,
      cohorts: run.cohorts || [],
      planned_students: run.planned_students || 0,
      status: run.status || 'planerad'
    };
    this.courseRuns.push(newRun);
    this.notify();
    return newRun;
  }

  getCourseRuns() {
    return this.courseRuns;
  }

  getCourseRunsBySlot(slotId) {
    return this.courseRuns.filter(r => r.slot_id === slotId);
  }

  // Teacher Availability
  addTeacherAvailability(availability) {
    const id = Math.max(...this.teacherAvailability.map(a => a.id), 0) + 1;
    const newAvailability = {
      id,
      teacher_id: availability.teacher_id,
      from_date: availability.from_date || '',
      to_date: availability.to_date || '',
      type: availability.type || 'busy' // 'busy' eller 'free'
    };
    this.teacherAvailability.push(newAvailability);
    this.notify();
    return newAvailability;
  }

  getTeacherAvailability(teacherId) {
    return this.teacherAvailability.filter(a => a.teacher_id === teacherId);
  }

  // Import from Excel/JSON
  importData(data) {
    if (data.courses) {
      data.courses.forEach(c => this.addCourse(c));
    }
    if (data.cohorts) {
      data.cohorts.forEach(c => this.addCohort(c));
    }
    if (data.teachers) {
      data.teachers.forEach(t => this.addTeacher(t));
    }
    if (data.slots) {
      data.slots.forEach(s => this.addSlot(s));
    }
    if (data.courseRuns) {
      data.courseRuns.forEach(r => this.addCourseRun(r));
    }
    if (data.teacherAvailability) {
      data.teacherAvailability.forEach(a => this.addTeacherAvailability(a));
    }
    this.notify();
  }

  // Export for Excel
  exportData() {
    return {
      courses: this.courses,
      cohorts: this.cohorts,
      teachers: this.teachers,
      slots: this.slots,
      courseRuns: this.courseRuns,
      teacherAvailability: this.teacherAvailability
    };
  }
}

export const store = new DataStore();
