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
      await this.api.saveData(payload);

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
