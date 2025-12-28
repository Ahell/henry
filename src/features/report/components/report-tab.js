import { LitElement, html } from "lit";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  store,
  DEFAULT_SLOT_LENGTH_DAYS,
} from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import { reportTabStyles } from "../styles/report-tab.styles.js";

export class ReportTab extends LitElement {
  static styles = reportTabStyles;

  static properties = {
    year: { type: String },
    term: { type: String },
    department: { type: String },
    teacherId: { type: String },
    query: { type: String },
    codeQuery: { type: String },
    courseQuery: { type: String },
    examinatorQuery: { type: String },
    kursansvarigQuery: { type: String },
    kursassistenterQuery: { type: String },
    slotNumberQuery: { type: String },
    participantsQuery: { type: String },
    startFrom: { type: String },
    startTo: { type: String },
    endFrom: { type: String },
    endTo: { type: String },
    examFrom: { type: String },
    examTo: { type: String },
    _showAdvancedFilters: { type: Boolean },
    _rows: { type: Array },
  };

  constructor() {
    super();
    this.year = "";
    this.term = "";
    this.department = "";
    this.teacherId = "";
    this.query = "";
    this.codeQuery = "";
    this.courseQuery = "";
    this.examinatorQuery = "";
    this.kursansvarigQuery = "";
    this.kursassistenterQuery = "";
    this.slotNumberQuery = "";
    this.participantsQuery = "";
    this.startFrom = "";
    this.startTo = "";
    this.endFrom = "";
    this.endTo = "";
    this.examFrom = "";
    this.examTo = "";
    this._showAdvancedFilters = false;
    this._rows = [];
    this._refresh();
    store.subscribe(() => {
      this._refresh();
      this.requestUpdate();
    });
  }

  _refresh() {
    this._rows = this._buildRows();
  }

  _buildRows() {
    const teachers = store.getTeachers() || [];
    const slots = store.getSlots() || [];
    const runs = store.getCourseRuns() || [];

    const teachersById = new Map(
      teachers.map((t) => [String(t.teacher_id), t])
    );
    const slotsById = new Map(slots.map((s) => [String(s.slot_id), s]));
    const slotOrderById = new Map(
      slots
        .slice()
        .sort((a, b) =>
          String(a?.start_date || "").localeCompare(String(b?.start_date || ""))
        )
        .map((slot, idx) => [String(slot.slot_id), idx + 1])
    );

    const lastDayOfSlot = (slotId) => {
      const days = store.getSlotDays(slotId) || [];
      if (Array.isArray(days) && days.length > 0) {
        return days.filter(Boolean).sort().slice(-1)[0];
      }
      const slot = slotsById.get(String(slotId));
      if (slot?.start_date) {
        const d = new Date(slot.start_date);
        d.setDate(d.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
        return d.toISOString().split("T")[0];
      }
      return "";
    };

    const normalizeTeacherIds = (run) => {
      const list = Array.isArray(run?.teachers) ? run.teachers : [];
      const legacy = run?.teacher_id != null ? [run.teacher_id] : [];
      return [...list, ...legacy]
        .filter((id) => id != null)
        .map((id) => String(id));
    };

    const getCoveredSlotIds = (run) => {
      const ids =
        Array.isArray(run?.slot_ids) && run.slot_ids.length > 0
          ? run.slot_ids
          : [run?.slot_id];
      return ids.filter((id) => id != null).map((id) => String(id));
    };

    const getStartEnd = (run) => {
      const covered = getCoveredSlotIds(run);
      const starts = covered
        .map((id) => slotsById.get(id)?.start_date)
        .filter(Boolean)
        .sort();
      const ends = covered
        .map((id) => {
          const slot = slotsById.get(id);
          return slot?.end_date || lastDayOfSlot(id);
        })
        .filter(Boolean)
        .sort();
      return {
        start: starts[0] || "",
        end: ends.length ? ends[ends.length - 1] : "",
      };
    };

    const getExamDate = (run) => {
      const covered = getCoveredSlotIds(run);
      let latest = "";
      for (const slotId of covered) {
        const day = store.getExamDayForCourseInSlot(slotId, run.course_id);
        if (day && day > latest) {
          latest = day;
        }
      }
      return latest;
    };

    const termForDate = (dateStr) => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "";
      const month = d.getMonth(); // 0-11
      return month <= 5 ? "VT" : "HT";
    };

    const yearForDate = (dateStr) => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "";
      return String(d.getFullYear());
    };

    const teacherNameForId = (teacherId) => {
      const t = teachersById.get(String(teacherId));
      return String(t?.name || "");
    };

    const finalizeTeacherFields = (
      teacherIds,
      courseExaminatorTeacherId,
      courseKursansvarigId
    ) => {
      const sorted = (teacherIds || [])
        .map((id) => String(id))
        .filter(Boolean)
        .sort((a, b) => {
          const an = teacherNameForId(a);
          const bn = teacherNameForId(b);
          const byName = an.localeCompare(bn, "sv-SE");
          return byName !== 0 ? byName : String(a).localeCompare(String(b));
        });

      const firstTeacherId = sorted[0] || "";

      // Use actual database values
      const examinatorTeacherId = courseExaminatorTeacherId
        ? String(courseExaminatorTeacherId)
        : firstTeacherId;

      const kursansvarigTeacherId = courseKursansvarigId
        ? String(courseKursansvarigId)
        : "";

      // Calculate assistants: all teachers except examinator and kursansvarig
      const assistantIds = sorted.filter(
        (id) => id !== examinatorTeacherId && id !== kursansvarigTeacherId
      );

      const assistantNames = assistantIds
        .map((id) => teachersById.get(id)?.name)
        .filter(Boolean)
        .join(", ");

      return {
        teacherIds: sorted,
        examinator: teachersById.get(examinatorTeacherId)?.name || "",
        kursansvarig: teachersById.get(kursansvarigTeacherId)?.name || "",
        kursassistenter: assistantNames,
        avd:
          teachersById.get(examinatorTeacherId)?.home_department ||
          teachersById.get(kursansvarigTeacherId)?.home_department ||
          teachersById.get(firstTeacherId)?.home_department ||
          "",
      };
    };

    const uniqueStrings = (items) =>
      Array.from(new Set((items || []).map((x) => String(x)).filter(Boolean)));

    const groups = new Map();

    const getParticipantsForRun = (run) => {
      const cohortIds = Array.isArray(run?.cohorts) ? run.cohorts : [];
      if (cohortIds.length > 0) {
        return cohortIds.reduce((sum, id) => {
          const cohort = store.getCohort(Number(id));
          return sum + (Number(cohort?.planned_size) || 0);
        }, 0);
      }
      return Number(run?.planned_students) || 0;
    };

    for (const run of runs || []) {
      if (!run || run.course_id == null) continue;
      const course = store.getCourse(run.course_id) || {};
      const coveredSlotIds = getCoveredSlotIds(run).sort();
      const slotNumbers = coveredSlotIds
        .map((id) => slotOrderById.get(String(id)))
        .filter((num) => Number.isFinite(Number(num)))
        .map((num) => `#${num}`);
      const key = `${String(run.course_id)}|${coveredSlotIds.join(",")}`;

      const courseExaminatorTeacherId = store.getCourseExaminatorTeacherId(
        run.course_id
      );
      const courseKursansvarigId =
        run?.kursansvarig_id ??
        store.coursesManager.getKursansvarigForCourse(run.course_id);
      const teacherIds = uniqueStrings([
        ...normalizeTeacherIds(run),
        courseExaminatorTeacherId != null ? courseExaminatorTeacherId : null,
      ]);
      const cohorts = uniqueStrings(
        Array.isArray(run?.cohorts) ? run.cohorts : []
      );
      const plannedStudents = getParticipantsForRun(run);

      const { start, end } = getStartEnd(run);
      const examDate = getExamDate(run);
      const term = start ? termForDate(start) : "";
      const year = start ? yearForDate(start) : "";

      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          runId: run.run_id ?? "",
          courseId: run.course_id,
          courseExaminatorTeacherId: courseExaminatorTeacherId ?? null,
          courseKursansvarigId: courseKursansvarigId ?? null,
          teacherIds,
          cohorts,
          plannedStudents,
          slotNumbers,
          code: course.code || "",
          courseName: course.name || "",
          start,
          end,
          examDate,
          term,
          year,
        });
        continue;
      }

      existing.teacherIds = uniqueStrings([
        ...existing.teacherIds,
        ...teacherIds,
      ]);
      existing.cohorts = uniqueStrings([...existing.cohorts, ...cohorts]);
      existing.plannedStudents =
        Number(existing.plannedStudents || 0) + Number(plannedStudents || 0);
      existing.slotNumbers = uniqueStrings([
        ...(existing.slotNumbers || []),
        ...(slotNumbers || []),
      ]);
      if (
        existing.courseExaminatorTeacherId == null &&
        courseExaminatorTeacherId != null
      ) {
        existing.courseExaminatorTeacherId = courseExaminatorTeacherId;
      }
      if (
        existing.courseKursansvarigId == null &&
        courseKursansvarigId != null
      ) {
        existing.courseKursansvarigId = courseKursansvarigId;
      }
      if (examDate > (existing.examDate || "")) {
        existing.examDate = examDate;
      }
    }

    return Array.from(groups.values())
      .map((row) => {
        const teacherFields = finalizeTeacherFields(
          row.teacherIds,
          row.courseExaminatorTeacherId,
          row.courseKursansvarigId
        );
        return { ...row, ...teacherFields };
      })
      .sort((a, b) => {
        if (a.year !== b.year)
          return String(a.year).localeCompare(String(b.year));
        if (a.term !== b.term)
          return String(a.term).localeCompare(String(b.term));
        return String(a.code).localeCompare(String(b.code));
      });
  }

  _filteredRows() {
    const q = String(this.query || "")
      .trim()
      .toLowerCase();
    const codeQ = String(this.codeQuery || "")
      .trim()
      .toLowerCase();
    const courseQ = String(this.courseQuery || "")
      .trim()
      .toLowerCase();
    const examinatorQ = String(this.examinatorQuery || "")
      .trim()
      .toLowerCase();
    const kursansvarigQ = String(this.kursansvarigQuery || "")
      .trim()
      .toLowerCase();
    const kursassistenterQ = String(this.kursassistenterQuery || "")
      .trim()
      .toLowerCase();
    const slotNumberQ = String(this.slotNumberQuery || "")
      .trim()
      .toLowerCase();
    const participantsQ = String(this.participantsQuery || "")
      .trim()
      .toLowerCase();
    const startFrom = String(this.startFrom || "").trim();
    const startTo = String(this.startTo || "").trim();
    const endFrom = String(this.endFrom || "").trim();
    const endTo = String(this.endTo || "").trim();
    const examFrom = String(this.examFrom || "").trim();
    const examTo = String(this.examTo || "").trim();

    return (this._rows || []).filter((r) => {
      if (this.year && String(r.year) !== String(this.year)) return false;
      if (this.term && String(r.term) !== String(this.term)) return false;
      if (this.department && String(r.avd) !== String(this.department))
        return false;
      if (
        this.teacherId &&
        !(r.teacherIds || []).includes(String(this.teacherId))
      )
        return false;
      if (startFrom && String(r.start || "") < startFrom) return false;
      if (startTo && String(r.start || "") > startTo) return false;
      if (endFrom && String(r.end || "") < endFrom) return false;
      if (endTo && String(r.end || "") > endTo) return false;
      if (examFrom && String(r.examDate || "") < examFrom) return false;
      if (examTo && String(r.examDate || "") > examTo) return false;
      if (
        codeQ &&
        !String(r.code || "")
          .toLowerCase()
          .includes(codeQ)
      )
        return false;
      if (
        courseQ &&
        !String(r.courseName || "")
          .toLowerCase()
          .includes(courseQ)
      )
        return false;
      if (
        examinatorQ &&
        !String(r.examinator || "")
          .toLowerCase()
          .includes(examinatorQ)
      ) {
        return false;
      }
      if (
        kursansvarigQ &&
        !String(r.kursansvarig || "")
          .toLowerCase()
          .includes(kursansvarigQ)
      ) {
        return false;
      }
      if (
        kursassistenterQ &&
        !String(r.kursassistenter || "")
          .toLowerCase()
          .includes(kursassistenterQ)
      ) {
        return false;
      }
      if (
        slotNumberQ &&
        !String((r.slotNumbers || []).join(", "))
          .toLowerCase()
          .includes(slotNumberQ)
      ) {
        return false;
      }
      if (
        participantsQ &&
        !String(r.plannedStudents ?? "")
          .toLowerCase()
          .includes(participantsQ)
      ) {
        return false;
      }
      if (!q) return true;
      const startCompact = this._formatDateYYMMDD(r.start);
      const endCompact = this._formatDateYYMMDD(r.end);
      const examCompact = this._formatDateYYMMDD(r.examDate);
      const hay = `${r.avd} ${r.code} ${r.courseName} ${(
        r.slotNumbers || []
      ).join(", ")} ${r.examinator} ${r.kursansvarig} ${
        r.kursassistenter || ""
      } ${r.plannedStudents ?? ""} ${r.start} ${r.end} ${r.term} ${r.year} ${
        r.examDate || ""
      } ${startCompact} ${endCompact} ${examCompact}`.toLowerCase();
      return hay.includes(q);
    });
  }

  _toggleAdvancedFilters() {
    this._showAdvancedFilters = !this._showAdvancedFilters;
  }

  _clearFilters() {
    this.year = "";
    this.term = "";
    this.department = "";
    this.teacherId = "";
    this.query = "";
    this.codeQuery = "";
    this.courseQuery = "";
    this.examinatorQuery = "";
    this.kursansvarigQuery = "";
    this.kursassistenterQuery = "";
    this.slotNumberQuery = "";
    this.participantsQuery = "";
    this.startFrom = "";
    this.startTo = "";
    this.endFrom = "";
    this.endTo = "";
    this.examFrom = "";
    this.examTo = "";
    this._showAdvancedFilters = false;
  }

  _yearOptions() {
    const years = Array.from(
      new Set((this._rows || []).map((r) => r.year).filter(Boolean))
    ).sort();
    return [
      { value: "", label: "Alla år" },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ];
  }

  _termOptions() {
    return [
      { value: "", label: "Alla terminer" },
      { value: "VT", label: "VT" },
      { value: "HT", label: "HT" },
    ];
  }

  _departmentOptions() {
    const depts = Array.from(
      new Set(
        (store.getTeachers() || [])
          .map((t) => t.home_department)
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b), "sv-SE"));
    return [
      { value: "", label: "Alla avdelningar" },
      ...depts.map((d) => ({ value: String(d), label: String(d) })),
    ];
  }

  _teacherOptions() {
    const teachers = (store.getTeachers() || [])
      .slice()
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "sv-SE")
      );
    return [
      { value: "", label: "Alla lärare" },
      ...teachers.map((t) => ({
        value: String(t.teacher_id),
        label: t.home_department ? `${t.name} (${t.home_department})` : t.name,
      })),
    ];
  }

  _getTableColumns() {
    return [
      { key: "avd", label: "Avdelning", width: "80px" },
      { key: "code", label: "Kurskod", width: "90px" },
      { key: "courseName", label: "Kursnamn", width: "260px" },
      { key: "slotNumbers", label: "Kursperiod", width: "130px" },
      { key: "examinator", label: "Examinator", width: "180px" },
      { key: "kursansvarig", label: "Kursansvarig", width: "180px" },
      {
        key: "kursassistenter",
        label: "Övrig undervisande personal",
        width: "200px",
      },
      { key: "plannedStudents", label: "Deltagare", width: "110px" },
      { key: "start", label: "Kursstart", width: "110px" },
      { key: "end", label: "Kursslut", width: "110px" },
      { key: "examDate", label: "Tentamen", width: "130px" },
      {
        key: "term",
        label: "Termin",
        width: "70px",
        sortValue: (row) =>
          row?.term === "VT" ? 1 : row?.term === "HT" ? 2 : 99,
      },
      { key: "year", label: "År", width: "70px" },
    ];
  }

  _renderCell(row, col) {
    const key = col.key;
    if (key === "start" || key === "end" || key === "examDate") {
      return html`${this._formatDateYYMMDD(row?.[key] ?? "")}`;
    }
    if (key === "slotNumbers") {
      return html`${(row?.slotNumbers || []).join(", ")}`;
    }
    if (key === "plannedStudents") {
      return html`${Number(row?.plannedStudents || 0)}`;
    }
    return html`${row?.[key] ?? ""}`;
  }

  _formatDateYYMMDD(value) {
    if (!value) return "";
    const [datePart] = String(value).split("T");
    const parts = datePart.split("-");
    if (parts.length !== 3) return datePart;
    const [yyyy, mm, dd] = parts;
    if (!yyyy || !mm || !dd) return datePart;
    return `${yyyy.slice(-2)}${mm}${dd}`;
  }

  _exportRows(useFiltered) {
    const rows = useFiltered ? this._filteredRows() : (this._rows || []);
    const columns = this._getTableColumns();
    const header = columns.map((col) => this._escapeCsv(col.label || col.key));
    const lines = [header.join(";")];

    rows.forEach((row) => {
      const values = columns.map((col) =>
        this._escapeCsv(this._getExportValue(row, col.key))
      );
      lines.push(values.join(";"));
    });

    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const fileDate = this._formatDateYYMMDD(stamp);
    const suffix = useFiltered ? "filtrerad" : "alla";
    const filename = `rapport-${suffix}-${fileDate || "export"}.csv`;

    const csv = `\ufeff${lines.join("\n")}`;
    this._downloadFile(csv, filename, "text/csv;charset=utf-8;");
  }

  _getExportValue(row, key) {
    if (key === "slotNumbers") {
      return (row?.slotNumbers || []).join(", ");
    }
    if (key === "plannedStudents") {
      return String(Number(row?.plannedStudents || 0));
    }
    if (key === "start" || key === "end" || key === "examDate") {
      return this._formatDateYYMMDD(row?.[key] ?? "");
    }
    const value = row?.[key];
    return value == null ? "" : String(value);
  }

  _escapeCsv(value) {
    const str = String(value ?? "");
    if (/[\";\n\r]/.test(str)) {
      return `"${str.replace(/\"/g, "\"\"")}"`;
    }
    return str;
  }

  _downloadFile(contents, filename, mimeType) {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  _exportPdf(useFiltered) {
    const rows = useFiltered ? this._filteredRows() : (this._rows || []);
    const columns = this._getTableColumns();

    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const fileDate = this._formatDateYYMMDD(stamp);
    const suffix = useFiltered ? "filtrerad" : "alla";
    const title = `Rapport (${suffix})`;
    const filename = `rapport-${suffix}-${fileDate || "export"}.pdf`;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const head = [columns.map((col) => col.label || col.key)];
    const body = rows.map((row) =>
      columns.map((col) => this._getPdfValue(row, col.key))
    );

    autoTable(doc, {
      head,
      body,
      margin: { top: 48, left: 32, right: 32, bottom: 32 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [17, 24, 39],
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39],
        fontStyle: "bold",
      },
      columnStyles: this._getPdfColumnStyles(columns),
      didDrawPage: (data) => {
        doc.setFontSize(12);
        doc.text(title, data.settings.margin.left, 24);
        doc.setFontSize(9);
        doc.text(
          `Export: ${fileDate || stamp}`,
          data.settings.margin.left,
          36
        );
      },
    });

    doc.save(filename);
  }

  _getPdfColumnStyles(columns) {
    const noWrapKeys = new Set(["courseName"]);
    const wrapTeacherKeys = new Set([
      "examinator",
      "kursansvarig",
      "kursassistenter",
    ]);
    const styles = {};
    columns.forEach((col, idx) => {
      const key = String(col.key);
      if (noWrapKeys.has(key)) {
        styles[idx] = {
          overflow: "ellipsize",
          cellWidth: "auto",
        };
      }
      if (wrapTeacherKeys.has(key)) {
        styles[idx] = {
          overflow: "linebreak",
          cellWidth: "wrap",
        };
      }
    });
    return styles;
  }

  _getPdfValue(row, key) {
    if (key === "examinator" || key === "kursansvarig" || key === "kursassistenter") {
      return this._formatTeacherListForPdf(row?.[key] ?? "");
    }
    return this._getExportValue(row, key);
  }

  _formatTeacherListForPdf(value) {
    const list = String(value || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (!list.length) return "";
    return list.map(this._formatTeacherNameForPdf).join("\n");
  }

  _formatTeacherNameForPdf(name) {
    return String(name || "").replace(/ /g, "\u00A0");
  }

  render() {
    const rows = this._filteredRows();
    return html`
      <henry-panel full-height>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Rapport</henry-text>
        </div>

        <div class="tab-body">
          <div class="filters">
            <div class="filters-bar">
              <henry-input
                id="reportQuery"
                class="search"
                label="Sök"
                placeholder="Sök på kod, kurs, lärare..."
                @input-change=${(e) => {
                  this.query = e?.detail?.value ?? "";
                }}
              ></henry-input>

              <henry-select
                id="reportYear"
                label="År"
                size="1"
                placeholder=""
                ?hidePlaceholder=${true}
                .options=${this._yearOptions()}
                @select-change=${(e) => {
                  this.year = e?.detail?.value ?? "";
                }}
              ></henry-select>

              <henry-select
                id="reportTerm"
                label="Termin"
                size="1"
                placeholder=""
                ?hidePlaceholder=${true}
                .options=${this._termOptions()}
                @select-change=${(e) => {
                  this.term = e?.detail?.value ?? "";
                }}
              ></henry-select>

              <div class="filters-actions">
                <henry-button
                  variant="secondary"
                  @click=${this._toggleAdvancedFilters}
                  >${this._showAdvancedFilters
                    ? "Dölj filter"
                    : "Avancerat"}</henry-button
                >
                <henry-button variant="secondary" @click=${this._clearFilters}
                  >Rensa</henry-button
                >
                <henry-button
                  variant="secondary"
                  @click=${() => this._exportRows(true)}
                  >Exportera CSV (filtrerad)</henry-button
                >
                <henry-button
                  variant="secondary"
                  @click=${() => this._exportRows(false)}
                  >Exportera CSV (alla)</henry-button
                >
                <henry-button
                  variant="secondary"
                  @click=${() => this._exportPdf(true)}
                  >Exportera PDF (filtrerad)</henry-button
                >
                <henry-button
                  variant="secondary"
                  @click=${() => this._exportPdf(false)}
                  >Exportera PDF (alla)</henry-button
                >
              </div>
            </div>

            ${this._showAdvancedFilters
              ? html`
                  <div class="filters-advanced" role="group" aria-label="Filter">
                    <henry-select
                      id="reportDept"
                      label="Avdelning"
                      size="1"
                      placeholder=""
                      ?hidePlaceholder=${true}
                      .options=${this._departmentOptions()}
                      @select-change=${(e) => {
                        this.department = e?.detail?.value ?? "";
                      }}
                    ></henry-select>

                    <henry-select
                      id="reportTeacher"
                      label="Lärare"
                      size="1"
                      placeholder=""
                      ?hidePlaceholder=${true}
                      .options=${this._teacherOptions()}
                      @select-change=${(e) => {
                        this.teacherId = e?.detail?.value ?? "";
                      }}
                    ></henry-select>

                    <henry-input
                      id="reportCode"
                      label="Kurskod"
                      placeholder="AI123U"
                      @input-change=${(e) => {
                        this.codeQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportCourse"
                      label="Kursnamn"
                      placeholder="Allmän fastighetsrätt"
                      @input-change=${(e) => {
                        this.courseQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportExaminator"
                      label="Examinator"
                      placeholder="Namn"
                      @input-change=${(e) => {
                        this.examinatorQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportResponsible"
                      label="Kursansvarig"
                      placeholder="Namn"
                      @input-change=${(e) => {
                        this.kursansvarigQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportAssistants"
                      label="Övrig undervisande personal"
                      placeholder="Namn"
                      @input-change=${(e) => {
                        this.kursassistenterQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportSlotNumber"
                      label="Kursperiod"
                      placeholder="#3"
                      @input-change=${(e) => {
                        this.slotNumberQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportParticipants"
                      label="Deltagare"
                      placeholder="30"
                      @input-change=${(e) => {
                        this.participantsQuery = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportStartFrom"
                      label="Kursstart från"
                      type="date"
                      @input-change=${(e) => {
                        this.startFrom = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportStartTo"
                      label="Kursstart till"
                      type="date"
                      @input-change=${(e) => {
                        this.startTo = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportEndFrom"
                      label="Kursslut från"
                      type="date"
                      @input-change=${(e) => {
                        this.endFrom = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportEndTo"
                      label="Kursslut till"
                      type="date"
                      @input-change=${(e) => {
                        this.endTo = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportExamFrom"
                      label="Tentamensdatum från"
                      type="date"
                      @input-change=${(e) => {
                        this.examFrom = e?.detail?.value ?? "";
                      }}
                    ></henry-input>

                    <henry-input
                      id="reportExamTo"
                      label="Tentamensdatum till"
                      type="date"
                      @input-change=${(e) => {
                        this.examTo = e?.detail?.value ?? "";
                      }}
                    ></henry-input>
                  </div>
                `
              : null}
          </div>

          <div class="tab-scroll">
            <henry-table
              striped
              hoverable
              sortable
              .columns=${this._getTableColumns()}
              .data=${rows}
              .renderCell=${(row, col) => this._renderCell(row, col)}
            ></henry-table>
          </div>
        </div>
      </henry-panel>
    `;
  }
}

customElements.define("report-tab", ReportTab);
