// API Service - Handles all backend communication
export class ApiService {
  constructor() {
    this.baseUrl = "http://localhost:3001";
  }

  async loadData() {
    return this._getJson("/api/bulk-load", "Backend load failed");
  }

  async loadTestData() {
    return this._postJson(
      "/api/admin/load-test-data",
      {},
      "Seed data load failed"
    );
  }

  async saveData(data) {
    return this._postJson("/api/bulk-save", data, "Backend save failed");
  }

  async resetAllData() {
    return this._postJson("/api/admin/reset-all", {}, "Reset failed");
  }

  async resetTeachers() {
    return this._postJson("/api/admin/reset-teachers", {}, "Reset failed");
  }

  async updateTeacherAvailability(payload) {
    return this._postJson(
      "/api/teacher-availability",
      payload,
      "Failed to persist teacher availability"
    );
  }

  async _getJson(path, errorPrefix) {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`${errorPrefix}: ${response.statusText}`);
    }
    return response.json();
  }

  async _postJson(path, body, errorPrefix) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`${errorPrefix}: ${response.statusText}`);
    }
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (err) {
      console.warn(`Failed to parse JSON from ${path}:`, err);
      return {};
    }
  }
}
