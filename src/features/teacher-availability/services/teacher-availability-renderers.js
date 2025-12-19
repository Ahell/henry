import { html } from "lit";
import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";
import { renderDayHeaderCell } from "./day-header-cell.js";
import {
  getDetailDayHeaderPresentation,
  getDetailDayCellPresentation,
  getOverviewCellPresentation,
} from "./teacher-availability-presenters.js";
import { renderDateHeader } from "./date-header.js";
import {
  enterDetailView,
  exitDetailView,
  toggleExamDateEditing,
  setExamDate,
  toggleTeachingDay,
} from "./teacher-availability-view-state.js";

export function renderDetailView(component) {
  const daysFromStore = store.getSlotDays(
    component._detailSlotId || component._detailSlotDate
  );
  const days =
    daysFromStore && daysFromStore.length
      ? daysFromStore
      : computeSlotDaysFromComponent(component);
  const dayStatuses = days.map((day) =>
    getDetailDayHeaderPresentation({
      slotId: component._detailSlotId,
      dateStr: day,
      isEditingExamDate: component._isEditingExamDate,
      courseId: component._detailCourseFilter,
      applyToAllCourses: component._applyToAllCourses,
      store,
    })?.className || ""
  );

  const slot = component.slots.find(
    (s) => s.slot_id === component._detailSlotId
  );
  const slotRuns = slot
    ? Array.from(
        new Map(
          store
            .getCourseRuns()
            .filter((run) => run.slot_id === slot.slot_id)
            .map((run) => [
              run.course_id,
              {
                course_id: run.course_id,
                code: store.getCourse(run.course_id)?.code,
                name: store.getCourse(run.course_id)?.name,
              },
            ])
        ).values()
      ).filter((c) => c.course_id && c.code)
    : [];

  return html`
    <detail-view-header
      slotTitle="${formatSlotDate(component._detailSlotDate)}"
      .daysLength=${days.length}
      .isEditingExamDate=${component._isEditingExamDate}
      .courseFilter=${component._detailCourseFilter}
      .applyToAllCourses=${component._applyToAllCourses}
      .courses=${slotRuns}
      @toggle-edit-exam=${() => toggleExamDateEditing(component)}
      @exit-detail=${() => exitDetailView(component)}
      @course-filter-change=${(e) => component._handleCourseFilterChange(e)}
      @apply-to-all-change=${(e) => component._handleApplyToAllChange(e)}
    ></detail-view-header>

    <detail-table
      .teachers=${component.teachers}
      .days=${days}
      .dayStatuses=${dayStatuses}
      .slotId=${component._detailSlotId}
      .slotDate=${component._detailSlotDate}
      .isPainting=${component.isPainting}
      .dayHeaderRenderer=${(dateStr) =>
        renderDayHeader(component, dateStr, component._detailCourseFilter)}
      .teacherDayCellRenderer=${(teacher, dateStr) =>
        renderDayCell(component, teacher, dateStr, component._detailCourseFilter)}
      @cell-mousedown=${(e) => component._handleCellMouseDown(e)}
      @cell-enter=${(e) => component._handleCellMouseEnter(e)}
      @mouseup=${(e) => component._handlePaintEnd(e)}
      @mouseleave=${(e) => component._handlePaintEnd(e)}
    ></detail-table>
  `;
}

export function renderDayHeader(component, dateStr, courseId = null) {
  const presentation = getDetailDayHeaderPresentation({
    slotId: component._detailSlotId,
    dateStr,
    isEditingExamDate: component._isEditingExamDate,
    courseId,
    applyToAllCourses: component._applyToAllCourses,
    store,
  });

  const anyActiveForDate = store.teachingDays.some(
    (td) =>
      td.slot_id === component._detailSlotId &&
      td.date === dateStr &&
      td.active !== false
  );
  const genericState = store.getTeachingDayState(
    component._detailSlotId,
    dateStr,
    null
  );
  const hideForAllCourses =
    courseId == null && genericState && genericState.active === false;
  const hasCourseSlotDay =
    courseId == null &&
    (store.courseSlotDays || []).some((csd) => {
      const matchingSlot = (store.courseSlots || []).find(
        (cs) =>
          String(cs.course_slot_id) === String(csd.course_slot_id) &&
          String(cs.slot_id) === String(component._detailSlotId)
      );
      return (
        matchingSlot &&
        csd.date === dateStr &&
        csd.active !== false
      );
    });
  const headerPresentation =
    courseId == null &&
    !hideForAllCourses &&
    (anyActiveForDate || hasCourseSlotDay) &&
    !presentation.className
      ? {
          ...presentation,
          className: "teaching-day-default-header",
          title: presentation.title || "Aktiv dag",
        }
      : presentation;

  let clickHandler = null;
  if (headerPresentation.clickMode === "toggleTeachingDay") {
    clickHandler = () => toggleTeachingDay(component, dateStr, courseId);
  } else if (headerPresentation.clickMode === "setExamDate") {
    clickHandler = () => setExamDate(component, dateStr);
  }

  return renderDayHeaderCell({
    dateStr,
    presentation: headerPresentation,
    onClick: clickHandler,
  });
}

export function renderDayCell(component, teacher, dateStr, courseId = null) {
  const presentation = getDetailDayCellPresentation({
    slotId: component._detailSlotId,
    slotDate: component._detailSlotDate,
    dateStr,
    teacherId: teacher.teacher_id,
    isEditingExamDate: component._isEditingExamDate,
    courseId,
    store,
  });

  const slot =
    component._detailSlotId != null
      ? component.slots.find((s) => s.slot_id === component._detailSlotId)
      : component.slots.find((s) => s.start_date === component._detailSlotDate);

  const overviewPresentation = slot
    ? getOverviewCellPresentation({
        teacher,
        slot,
        slotDate: component._detailSlotDate,
        store,
      })
    : null;

  const overviewClassTokens = (overviewPresentation?.className || "")
    .split(" ")
    .filter(Boolean);
  const hasAvailability = presentation.className.includes("unavailable");
  const selectedCourseId = component._detailCourseFilter;
  const courseIds = overviewPresentation?.courseIds || [];
  const genericTeachingState = store.getTeachingDayState(
    component._detailSlotId,
    dateStr,
    null
  );
  const hideForAllCourses =
    selectedCourseId == null &&
    genericTeachingState &&
    genericTeachingState.active === false;
  const courseHasDay = (id) => {
    const normalizeDate = (v) => (v || "").split("T")[0];
    const courseSlot = store.getCourseSlot(id, component._detailSlotId);
    const record =
      courseSlot &&
      (store.courseSlotDays || []).find(
        (csd) =>
          String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
          normalizeDate(csd.date) === normalizeDate(dateStr)
      );
    if (record) {
      return record.active === true;
    }

    const specificState = store.getTeachingDayState(
      component._detailSlotId,
      dateStr,
      id
    );
    if (specificState) {
      return specificState.active === true;
    }
    return false;
  };

  const activeCourseIds = courseIds.filter((id) => courseHasDay(id));
  const baseCourseIds =
    selectedCourseId == null && genericTeachingState?.active
      ? activeCourseIds
      : activeCourseIds;
  const filteredCourseIds =
    selectedCourseId == null
      ? baseCourseIds
      : baseCourseIds.filter((id) => id === selectedCourseId);
  const filteredContent = filteredCourseIds
    .map((id) => store.getCourse(id)?.code)
    .filter(Boolean)
    .join(", ");

  const hasActiveCourses = filteredCourseIds.length > 0;
  const shouldShowCourse =
    !hideForAllCourses &&
    !hasAvailability &&
    hasActiveCourses &&
    filteredContent.length > 0;
  const shouldShowUnavailableCourse =
    !hideForAllCourses &&
    hasAvailability &&
    hasActiveCourses &&
    filteredContent.length > 0;
  const shouldShowContent =
    !hideForAllCourses &&
    (presentation.className.includes("teaching-day") ||
      presentation.className.includes("exam-date") ||
      presentation.className.includes("teaching-day-default") ||
      shouldShowCourse ||
      shouldShowUnavailableCourse);

  const segments = [];
  let badgeText = "";
  if (
    shouldShowContent &&
    filteredCourseIds.length > 0 &&
    (shouldShowCourse || shouldShowUnavailableCourse)
  ) {
    const getCode = (id) => store.getCourse(id)?.code || String(id);
    const normalizeDate = (v) => (v || "").split("T")[0];
    if (filteredCourseIds.length > 1) {
      filteredCourseIds.forEach((id) => {
        const isExam =
          normalizeDate(
            store.getExamDayForCourseInSlot(component._detailSlotId, id)
          ) === normalizeDate(dateStr);
        segments.push({ text: getCode(id), badgeText: isExam ? "Exam" : "" });
      });
    } else if (filteredCourseIds.length === 1) {
      const id = filteredCourseIds[0];
      const isExam =
        normalizeDate(
          store.getExamDayForCourseInSlot(component._detailSlotId, id)
        ) === normalizeDate(dateStr);
      badgeText = isExam ? "Exam" : "";
    }
  }
  const courseTokens = overviewClassTokens.filter((token) =>
    ["assigned-course", "has-course"].includes(token)
  );
  let effectiveClassName = presentation.className;
  if (hideForAllCourses) {
    effectiveClassName = effectiveClassName
      .split(" ")
      .filter((cls) => !cls.startsWith("teaching-day"))
      .join(" ");
  } else if (!hasActiveCourses) {
    effectiveClassName = effectiveClassName
      .split(" ")
      .filter(
        (cls) =>
          !cls.startsWith("teaching-day") && !cls.startsWith("exam-date")
      )
      .join(" ");
  }
  const combinedClassName = [
    effectiveClassName,
    shouldShowCourse ? courseTokens.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ");

  return html`
    <td>
      <teacher-cell
        .teacherId=${teacher.teacher_id}
        .date=${dateStr}
        .slotId=${component._detailSlotId}
        .slotDate=${component._detailSlotDate}
        .isDetail=${true}
        .classNameSuffix=${combinedClassName}
        .titleText=${presentation.title}
        .content=${shouldShowContent && (shouldShowCourse || shouldShowUnavailableCourse)
          ? filteredContent
          : shouldShowUnavailableCourse
          ? filteredContent
          : ""}
        .badgeText=${badgeText}
        .segments=${segments}
        .isLocked=${overviewPresentation?.isLocked ?? false}
      ></teacher-cell>
    </td>
  `;
}

export function renderTeacherCell(component, teacher, slotDate) {
  const slot = component.slots.find((s) => s.start_date === slotDate);
  if (!slot) {
    return html`<td><div class="teacher-cell"></div></td>`;
  }

  const presentation = getOverviewCellPresentation({
    teacher,
    slot,
    slotDate,
    store,
  });
  const normalizeDate = (v) => (v || "").split("T")[0];
  const teacherId = teacher.teacher_id;
  const courseIds = Array.isArray(presentation?.courseIds)
    ? presentation.courseIds
    : [];
  const slotDays = (store.getSlotDays(slot.slot_id) || [])
    .map(normalizeDate)
    .filter(Boolean);
  const hasSlotBusyEntry = (store.teacherAvailability || []).some(
    (a) =>
      String(a.teacher_id) === String(teacherId) &&
      String(a.slot_id) === String(slot.slot_id) &&
      a.type === "busy"
  );
  const isUnavailableOnDay = (day) =>
    hasSlotBusyEntry || store.isTeacherUnavailableOnDay(teacherId, day);
  const unavailableDaysInSlot = hasSlotBusyEntry
    ? slotDays
    : slotDays.filter((d) => store.isTeacherUnavailableOnDay(teacherId, d));
  const courseAvailabilityClass = (courseId) => {
    if (hasSlotBusyEntry) return "";
    if (!unavailableDaysInSlot.length) return "";

    const activeDays = (
      store.getActiveCourseDaysInSlot(slot.slot_id, courseId) || []
    )
      .map(normalizeDate)
      .filter(Boolean)
      .filter((d) => slotDays.includes(d));

    if (!activeDays.length) return "";

    const unavailableActiveDays = activeDays.filter((d) => isUnavailableOnDay(d));
    if (unavailableActiveDays.length === 0) {
      // Teacher has unavailability in the slot period, but not on this course's active days.
      return "partial-availability";
    }

    if (unavailableActiveDays.length === activeDays.length) {
      // All active days for this course are unavailable -> solid red (not striped).
      return "course-unavailable";
    }

    // Some (but not all) active days are unavailable -> red striped.
    return "partial-conflict";
  };

  const segments =
    courseIds.length > 1
      ? courseIds
          .map((id) => {
            const text = store.getCourse(id)?.code || String(id);
            if (!text) return null;
            return {
              text,
              badgeText: "",
              classNameSuffix: courseAvailabilityClass(id),
            };
          })
          .filter(Boolean)
      : [];

  const singleCourseId = courseIds.length === 1 ? courseIds[0] : null;
  const cellStripeClass =
    singleCourseId != null ? courseAvailabilityClass(singleCourseId) : "";
  const classNameSuffix = [
    presentation.className,
    cellStripeClass,
  ]
    .filter(Boolean)
    .join(" ");

  return html`
    <td>
      <teacher-cell
        .teacherId=${teacher.teacher_id}
        .slotDate=${slotDate}
        .slotId=${slot.slot_id}
        .isDetail=${false}
        .classNameSuffix=${classNameSuffix}
        .titleText=${presentation.title}
        .content=${presentation.content}
        .segments=${segments}
        .isLocked=${presentation.isLocked}
      ></teacher-cell>
    </td>
  `;
}

export function renderOverviewView(component, slotDates) {
  return html`
    <overview-table
      .teachers=${component.teachers}
      .slotDates=${slotDates}
      .isPainting=${component.isPainting}
      .dateHeaderRenderer=${(date) => renderSlotDateHeader(component, date)}
      .teacherCellRenderer=${(teacher, slotDate) =>
        renderTeacherCell(component, teacher, slotDate)}
      @cell-mousedown=${(e) => component._handleCellMouseDown(e)}
      @cell-enter=${(e) => component._handleCellMouseEnter(e)}
      @mouseup=${(e) => component._handlePaintEnd(e)}
      @mouseleave=${(e) => component._handlePaintEnd(e)}
    ></overview-table>
  `;
}

const renderSlotDateHeader = (component, date) => {
  const slot = component.slots.find((s) => s.start_date === date);
  const slotId = slot?.slot_id;
  return renderDateHeader(date, slotId, (slotDate, id) =>
    enterDetailView(component, slotDate, id)
  );
};

function computeSlotDaysFromComponent(component) {
  const slots = Array.isArray(component.slots) ? [...component.slots] : [];
  if (!slots.length) return [];

  const normalizeDate = (value) => (value || "").split("T")[0];
  const slotId = component._detailSlotId;
  const slotDate = component._detailSlotDate;

  const targetSlot =
    slots.find((s) => String(s.slot_id) === String(slotId)) ||
    slots.find((s) => normalizeDate(s.start_date) === normalizeDate(slotDate));

  if (!targetSlot) return [];

  const sorted = slots
    .slice()
    .sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

  const idx = sorted.findIndex(
    (s) =>
      String(s.slot_id) === String(targetSlot.slot_id) ||
      normalizeDate(s.start_date) === normalizeDate(targetSlot.start_date)
  );
  // Find the first slot after targetSlot that has a strictly greater start_date
  let endDate = null;
  for (let i = idx + 1; i < sorted.length; i++) {
    const candidateStart = new Date(sorted[i].start_date).getTime();
    const currentStart = new Date(targetSlot.start_date).getTime();
    if (candidateStart > currentStart) {
      endDate = new Date(sorted[i].start_date);
      endDate.setDate(endDate.getDate() - 1);
      break;
    }
  }
  if (!endDate) {
    endDate = new Date(targetSlot.start_date);
    endDate.setDate(
      endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1
    );
  }

  const days = [];
  const currentDate = new Date(targetSlot.start_date);
  while (currentDate <= endDate) {
    days.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

const formatSlotDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
