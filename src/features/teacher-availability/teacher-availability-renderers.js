import { html } from "lit";
import { store } from "../../utils/store.js";
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

  // Debug logs removed

  return html`
    <detail-view-header
      slotTitle="${formatSlotDate(component._detailSlotDate)}"
      .daysLength=${days.length}
      .isEditingExamDate=${component._isEditingExamDate}
      @toggle-edit-exam=${() => toggleExamDateEditing(component)}
      @exit-detail=${() => exitDetailView(component)}
    ></detail-view-header>

    <detail-table
      .teachers=${component.teachers}
      .days=${days}
      .slotId=${component._detailSlotId}
      .slotDate=${component._detailSlotDate}
      .isPainting=${component.isPainting}
      .dayHeaderRenderer=${(dateStr) => renderDayHeader(component, dateStr)}
      .teacherDayCellRenderer=${(teacher, dateStr) =>
        renderDayCell(component, teacher, dateStr)}
      @cell-mousedown=${(e) => component._handleCellMouseDown(e)}
      @cell-enter=${(e) => component._handleCellMouseEnter(e)}
      @mouseup=${(e) => component._handlePaintEnd(e)}
      @mouseleave=${(e) => component._handlePaintEnd(e)}
    ></detail-table>
  `;
}

export function renderDayHeader(component, dateStr) {
  const presentation = getDetailDayHeaderPresentation({
    slotId: component._detailSlotId,
    dateStr,
    isEditingExamDate: component._isEditingExamDate,
    store,
  });

  let clickHandler = null;
  if (presentation.clickMode === "toggleTeachingDay") {
    clickHandler = () => toggleTeachingDay(component, dateStr);
  } else if (presentation.clickMode === "setExamDate") {
    clickHandler = () => setExamDate(component, dateStr);
  }

  return renderDayHeaderCell({
    dateStr,
    presentation,
    onClick: clickHandler,
  });
}

export function renderDayCell(component, teacher, dateStr) {
  const presentation = getDetailDayCellPresentation({
    slotId: component._detailSlotId,
    slotDate: component._detailSlotDate,
    dateStr,
    teacherId: teacher.teacher_id,
    isEditingExamDate: component._isEditingExamDate,
    store,
  });

  return html`
    <td>
      <teacher-cell
        .teacherId=${teacher.teacher_id}
        .date=${dateStr}
        .slotId=${component._detailSlotId}
        .slotDate=${component._detailSlotDate}
        .isDetail=${true}
        .classNameSuffix=${presentation.className}
        .titleText=${presentation.title}
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

  return html`
    <td>
      <teacher-cell
        .teacherId=${teacher.teacher_id}
        .slotDate=${slotDate}
        .slotId=${slot.slot_id}
        .isDetail=${false}
        .classNameSuffix=${presentation.className}
        .titleText=${presentation.title}
        .content=${presentation.content}
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

  const slotId = component._detailSlotId;
  const slotDate = component._detailSlotDate;

  const targetSlot =
    slotId != null
      ? slots.find((s) => s.slot_id === slotId)
      : slots.find((s) => s.start_date === slotDate);

  if (!targetSlot) return [];

  const sorted = slots.slice().sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

  const idx = sorted.findIndex((s) => s.slot_id === targetSlot.slot_id);
  // Find the first slot after targetSlot that has a strictly greater start_date
  let endDate = null;
  for (let i = idx + 1; i < sorted.length; i++) {
    const candidateStart = new Date(sorted[i].start_date).getTime();
    const currentStart = new Date(targetSlot.start_date).getTime();
    if (candidateStart > currentStart) {
      endDate = new Date(sorted[i].start_date);
      break;
    }
  }
  if (!endDate) {
    endDate = new Date(targetSlot.start_date);
    endDate.setDate(endDate.getDate() + 28);
  }

  const days = [];
  const currentDate = new Date(targetSlot.start_date);
  while (currentDate < endDate) {
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
