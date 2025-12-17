// API Service - Handles all backend communication
export class ApiService {
  constructor() {
    this.baseUrl = "http://localhost:3001";
  }

  async loadData() {
    const response = await fetch(`${this.baseUrl}/api/bulk-load`);

    if (!response.ok) {
      throw new Error(`Backend load failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async saveData(data) {
    const response = await fetch(`${this.baseUrl}/api/bulk-save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Backend save failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
