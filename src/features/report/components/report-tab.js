import { LitElement, html } from "lit";
import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";
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
    _rows: { type: Array },
  };

  constructor() {
    super();
    this.year = "";
    this.term = "";
    this.department = "";
    this.teacherId = "";
    this.query = "";
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
      const ids = Array.isArray(run?.slot_ids) && run.slot_ids.length > 0
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

    const finalizeTeacherFields = (teacherIds) => {
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
      const lastTeacherId = sorted.length ? sorted[sorted.length - 1] : "";
      return {
        teacherIds: sorted,
        examinator: teachersById.get(firstTeacherId)?.name || "",
        kursansvarig: teachersById.get(lastTeacherId)?.name || "",
        avd:
          teachersById.get(lastTeacherId)?.home_department ||
          teachersById.get(firstTeacherId)?.home_department ||
          "",
      };
    };

    const uniqueStrings = (items) =>
      Array.from(new Set((items || []).map((x) => String(x)).filter(Boolean)));

    const groups = new Map();

    for (const run of runs || []) {
      if (!run || run.course_id == null) continue;
      const course = store.getCourse(run.course_id) || {};
      const coveredSlotIds = getCoveredSlotIds(run).sort();
      const key = `${String(run.course_id)}|${coveredSlotIds.join(",")}`;

      const teacherIds = uniqueStrings(normalizeTeacherIds(run));
      const cohorts = uniqueStrings(Array.isArray(run?.cohorts) ? run.cohorts : []);
      const plannedStudents = Number.isFinite(Number(run?.planned_students))
        ? Number(run.planned_students)
        : 0;

      const { start, end } = getStartEnd(run);
      const term = start ? termForDate(start) : "";
      const year = start ? yearForDate(start) : "";

      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, {
          runId: run.run_id ?? "",
          courseId: run.course_id,
          teacherIds,
          cohorts,
          plannedStudents,
          code: course.code || "",
          courseName: course.name || "",
          start,
          end,
          term,
          year,
        });
        continue;
      }

      existing.teacherIds = uniqueStrings([...existing.teacherIds, ...teacherIds]);
      existing.cohorts = uniqueStrings([...existing.cohorts, ...cohorts]);
      existing.plannedStudents =
        Number(existing.plannedStudents || 0) + Number(plannedStudents || 0);
    }

    return Array.from(groups.values())
      .map((row) => {
        const teacherFields = finalizeTeacherFields(row.teacherIds);
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
    const q = String(this.query || "").trim().toLowerCase();
    return (this._rows || []).filter((r) => {
      if (this.year && String(r.year) !== String(this.year)) return false;
      if (this.term && String(r.term) !== String(this.term)) return false;
      if (this.department && String(r.avd) !== String(this.department)) return false;
      if (this.teacherId && !(r.teacherIds || []).includes(String(this.teacherId))) return false;
      if (!q) return true;
      const hay = `${r.avd} ${r.code} ${r.courseName} ${r.examinator} ${r.kursansvarig} ${r.start} ${r.end} ${r.term} ${r.year}`.toLowerCase();
      return hay.includes(q);
    });
  }

  _yearOptions() {
    const years = Array.from(new Set((this._rows || []).map((r) => r.year).filter(Boolean))).sort();
    return [{ value: "", label: "Alla år" }, ...years.map((y) => ({ value: String(y), label: String(y) }))];
  }

  _termOptions() {
    return [
      { value: "", label: "Alla terminer" },
      { value: "VT", label: "VT" },
      { value: "HT", label: "HT" },
    ];
  }

  _departmentOptions() {
    const depts = Array.from(new Set((store.getTeachers() || []).map((t) => t.home_department).filter(Boolean))).sort(
      (a, b) => String(a).localeCompare(String(b), "sv-SE")
    );
    return [{ value: "", label: "Alla avdelningar" }, ...depts.map((d) => ({ value: String(d), label: String(d) }))];
  }

  _teacherOptions() {
    const teachers = (store.getTeachers() || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "sv-SE"));
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
      { key: "avd", label: "AVD", width: "80px" },
      { key: "code", label: "Kod", width: "90px" },
      { key: "courseName", label: "Kurs", width: "260px" },
      { key: "examinator", label: "Examinator", width: "180px" },
      { key: "kursansvarig", label: "Kursansvarig", width: "180px" },
      { key: "start", label: "Kursstart", width: "110px" },
      { key: "end", label: "Kursslut", width: "110px" },
      {
        key: "term",
        label: "Termin",
        width: "70px",
        sortValue: (row) => (row?.term === "VT" ? 1 : row?.term === "HT" ? 2 : 99),
      },
      { key: "year", label: "År", width: "70px" },
    ];
  }

  _renderCell(row, col) {
    const key = col.key;
    return html`${row?.[key] ?? ""}`;
  }

  render() {
    const rows = this._filteredRows();
    return html`
      <henry-panel>
        <div slot="header" class="panel-header">
          <henry-text variant="heading-3">Rapport</henry-text>
        </div>

        <div class="filters">
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
            id="reportQuery"
            class="search"
            label="Sök"
            placeholder="Sök på kod, kurs, lärare..."
            @input-change=${(e) => {
              this.query = e?.detail?.value ?? "";
            }}
          ></henry-input>
        </div>

        <henry-table
          striped
          hoverable
          sortable
          .columns=${this._getTableColumns()}
          .data=${rows}
          .renderCell=${(row, col) => this._renderCell(row, col)}
        ></henry-table>
      </henry-panel>
    `;
  }
}

customElements.define("report-tab", ReportTab);
