import { html } from "lit";
import { store } from "../../utils/store.js";
import { renderDayHeaderCell } from "./day-header-cell.js";
import {
  getDetailDayHeaderPresentation,
  getDetailDayCellPresentation,
  getOverviewCellPresentation,
} from "./teacher-availability-presenters.js";
import { renderTeacherRow } from "./teacher-row.js";
import { renderDateHeader } from "./date-header.js";
import {
  enterDetailView,
  exitDetailView,
  toggleExamDateEditing,
  setExamDate,
  toggleTeachingDay,
} from "./teacher-availability-view-state.js";

export function renderDetailView(component) {
  const days = store.getSlotDays(component._detailSlotId);

  return html`
    <detail-view-header
      slotTitle="${formatSlotDate(component._detailSlotDate)}"
      .daysLength=${days.length}
      .isEditingExamDate=${component._isEditingExamDate}
      @toggle-edit-exam=${() => toggleExamDateEditing(component)}
      @exit-detail=${() => exitDetailView(component)}
    ></detail-view-header>

    <teacher-availability-toolbar
      .isPainting=${component.isPainting}
      .paintMode=${component._paintMode}
      @paint-change-request=${(e) => component._handlePaintChangeRequest(e)}
    ></teacher-availability-toolbar>

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
    <teacher-availability-toolbar
      .isPainting=${component.isPainting}
      .paintMode=${component._paintMode}
      @paint-change-request=${(e) => component._handlePaintChangeRequest(e)}
    ></teacher-availability-toolbar>
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

const formatSlotDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
