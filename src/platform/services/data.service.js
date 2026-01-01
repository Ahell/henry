import { ApiService } from "./api.service.js";

export class DataService {
  constructor(api = new ApiService()) {
    this.api = api;
  }

  async loadData() {
    try {
      const data = await this.api.loadData();
      if (!data) {
        throw new Error("Backend returned no data");
      }
      return data;
    } catch (error) {
      console.error("Failed to load from backend:", error);
      throw error;
    }
  }

  async saveData(payload) {
    try {
      const response = await this.api.saveData(payload);
      const canonicalData = this._extractBulkSnapshot(response);
      if (canonicalData) {
        return canonicalData;
      }

      // After saving, reload the canonical dataset so the client can reconcile with server state
      return await this.api.loadData();
    } catch (error) {
      console.error("Failed to save to backend:", error);
      throw error;
    }
  }

  _extractBulkSnapshot(response) {
    const candidate = response && response.data ? response.data : response;
    if (!candidate || typeof candidate !== "object") return null;
    if (candidate._delta === true) {
      return candidate;
    }
    if (Array.isArray(candidate.changed)) {
      return { _delta: true, ...candidate };
    }
    if (candidate.success === true) {
      return { _delta: true, changed: [] };
    }
    const keys = [
      "courses",
      "cohorts",
      "teachers",
      "teacherCourses",
      "courseExaminators",
      "courseKursansvarig",
      "slots",
      "courseRuns",
      "teacherAvailability",
      "courseSlots",
      "cohortSlotCourses",
      "courseRunSlots",
      "slotDays",
      "teacherDayUnavailability",
      "courseSlotDays",
      "coursePrerequisites",
      "businessLogic",
    ];
    const hasSnapshotKey = keys.some((key) => key in candidate);
    return hasSnapshotKey ? candidate : null;
  }

  async loadTestData() {
    return this.api.loadTestData();
  }
}
