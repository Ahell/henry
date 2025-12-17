// ExamDatesManager - Manages exam dates for slots
export class ExamDatesManager {
  constructor(events) {
    this.events = events;
    this.examDates = []; // Array of { slot_id, date, locked }
  }

  load(examDates) {
    this.examDates = examDates || [];
  }

  setExamDate(slotId, date) {
    // Remove any existing exam date for this slot (radio button behavior)
    this.examDates = this.examDates.filter((ed) => ed.slot_id !== slotId);

    // Add the new exam date
    this.examDates.push({
      slot_id: slotId,
      date,
      locked: true, // Exam dates are locked by default
    });

    this.events.notify();
  }

  clearExamDate(slotId) {
    this.examDates = this.examDates.filter((ed) => ed.slot_id !== slotId);
    this.events.notify();
  }

  getExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    return examDate ? examDate.date : null;
  }

  isExamDate(slotId, date) {
    return this.examDates.some(
      (ed) => ed.slot_id === slotId && ed.date === date
    );
  }

  isExamDateLocked(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    return examDate ? examDate.locked : false;
  }

  unlockExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    if (examDate) {
      examDate.locked = false;
      this.events.notify();
    }
  }

  lockExamDate(slotId) {
    const examDate = this.examDates.find((ed) => ed.slot_id === slotId);
    if (examDate) {
      examDate.locked = true;
      this.events.notify();
    }
  }
}
