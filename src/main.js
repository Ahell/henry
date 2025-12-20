import "./features/admin/index.js";
import "./features/import-export/index.js";
import { store } from "./platform/store/DataStore.js";

// Handle navigation
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const sectionId = e.target.dataset.section;

    // Update active button
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");

    // Update active section
    document
      .querySelectorAll(".section")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
  });
});

const statusEl = document.getElementById("navStatus");
const setStatus = (message) => {
  if (!statusEl) return;
  statusEl.textContent = message || "";
  if (statusEl.textContent) {
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => {
      statusEl.textContent = "";
    }, 5000);
  }
};

const loadBtn = document.getElementById("navLoadTestData");
const resetBtn = document.getElementById("navResetDatabase");
let busy = false;

const setBusy = (isBusy) => {
  busy = Boolean(isBusy);
  if (loadBtn) loadBtn.disabled = busy;
  if (resetBtn) resetBtn.disabled = busy;
};

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    if (busy) return;
    if (
      !confirm(
        "Detta kommer att ERSÄTTA ALL data i databasen med testdata.\n\nVill du fortsätta?"
      )
    ) {
      return;
    }

    try {
      setBusy(true);
      setStatus("Laddar testdata…");
      await store.dataServiceManager.loadSeedDataToDatabase();
      setStatus("Testdata laddad!");
    } catch (error) {
      setStatus(`Fel: ${error?.message || String(error)}`);
      console.error("Failed to load seed data:", error);
    } finally {
      setBusy(false);
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    if (busy) return;
    if (
      !confirm(
        "Detta kommer att RADERA ALL DATA från databasen.\n\nDenna åtgärd kan inte ångras!\n\nVill du fortsätta?"
      )
    ) {
      return;
    }

    try {
      setBusy(true);
      setStatus("Återställer databas…");
      await store.dataServiceManager.resetDatabase();
      setStatus("Databas återställd.");
    } catch (error) {
      setStatus(`Fel: ${error?.message || String(error)}`);
      console.error("Failed to reset database:", error);
    } finally {
      setBusy(false);
    }
  });
}

// Admin tabs in header (controlled by <admin-panel>)
const adminTabsEl = document.getElementById("adminTabs");

const renderAdminTabs = (tabs = [], activeKey) => {
  if (!adminTabsEl) return;
  adminTabsEl.innerHTML = "";

  (tabs || []).forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `admin-tab-btn${t.key === activeKey ? " active" : ""}`;
    btn.textContent = t.label;
    btn.dataset.adminTab = t.key;
    btn.addEventListener("click", () => {
      const panel = document.querySelector("admin-panel");
      if (!panel) return;
      panel.activeTab = t.key;
      // Optimistically update UI; admin-panel will also emit event.
      highlightAdminTab(t.key);
    });
    adminTabsEl.appendChild(btn);
  });
};

const highlightAdminTab = (activeKey) => {
  if (!adminTabsEl) return;
  adminTabsEl.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.adminTab === activeKey);
  });
};

customElements.whenDefined("admin-panel").then(() => {
  const panel = document.querySelector("admin-panel");
  if (!panel || !adminTabsEl) return;

  const tabs = typeof panel.getTabsMeta === "function" ? panel.getTabsMeta() : [];
  renderAdminTabs(tabs, panel.activeTab);

  panel.addEventListener("admin-tab-changed", (e) => {
    highlightAdminTab(e.detail?.activeTab);
  });
});
