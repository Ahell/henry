import { ApiService } from "./api.service.js";

export class DataService {
  constructor(store) {
    this.store = store;
    this.api = new ApiService();
  }

  async loadFromBackend() {
    try {
      const data = await this.api.loadData();
      if (!data) {
        throw new Error("Backend returned no data");
      }
      this.store.hydrate(data);
    } catch (error) {
      console.error("Failed to load from backend:", error);
      throw error;
    }
  }

  async saveData() {
    try {
      this.store._syncTeacherCoursesFromTeachers();
      this.store._syncCoursePrerequisitesFromCourses();
      this.store.slots = this.store.normalizer.normalizeSlotsInPlace(
        this.store.slots
      );

      await this.api.saveData(this.store.getDataSnapshot());

      // After saving, reload the canonical dataset so the client can reconcile with server state
      const canonicalData = await this.api.loadData();
      return canonicalData;
    } catch (error) {
      console.error("Failed to save to backend:", error);
      throw error;
    }
  }

  async loadTestData() {
    return this.api.loadTestData();
  }
}
