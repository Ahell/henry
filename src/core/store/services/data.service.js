import { ApiService } from "./api.service.js";
import { seedData } from "../../../data/seedData.js";

export class DataService {
  constructor(store) {
    this.store = store;
    this.api = new ApiService();
  }

  async loadFromBackend() {
    try {
      const data = await this.api.loadData();

      // Check if any data exists
      if (
        (!data.courses || data.courses.length === 0) &&
        (!data.cohorts || data.cohorts.length === 0) &&
        (!data.teachers || data.teachers.length === 0) &&
        (!data.slots || data.slots.length === 0)
      ) {
        console.log("No data in backend, loading seed data");
        this.store.dataServiceManager.importData(seedData);
        this.store.events.notify();
        // Persist seed to backend so subsequent loads have data
        this.api
          .saveData(this.store.getDataSnapshot())
          .catch((e) => console.error("Failed to persist seed data:", e));
        return;
      }

      this.store.hydrate(data);
    } catch (error) {
      console.error("Failed to load from backend:", error);
      console.log("Loading seed data as fallback");
      this.store.dataServiceManager.importData(seedData);
    }
  }

  async saveData() {
    try {
      this.store._syncTeacherCoursesFromTeachers();
      this.store._syncCoursePrerequisitesFromCourses();
      this.store.slots = this.store.normalizer.normalizeSlotsInPlace(
        this.store.slots
      );
      this.store.validator.assertAllSlotsNonOverlapping();

      return await this.api.saveData(this.store.getDataSnapshot());
    } catch (error) {
      console.error("Failed to save to backend:", error);
      throw error;
    }
  }
}
