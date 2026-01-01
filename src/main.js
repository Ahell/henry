import "./features/admin/index.js";
import { store } from "./platform/store/DataStore.js";

const statusEl = document.getElementById("navStatus");
const setViewportHeightVar = () => {
  const height =
    window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  if (!height) return;
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
};

setViewportHeightVar();
window.addEventListener("resize", setViewportHeightVar, { passive: true });
window.addEventListener("orientationchange", setViewportHeightVar, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setViewportHeightVar, {
    passive: true,
  });
  window.visualViewport.addEventListener("scroll", setViewportHeightVar, {
    passive: true,
  });
}
const setStatus = (message) => {
  if (!statusEl) return;
  const next = String(message || "").trim() || "OK";
  statusEl.textContent = next;
  clearTimeout(setStatus._t);
  if (next !== "OK") {
    setStatus._t = setTimeout(() => {
      statusEl.textContent = "OK";
    }, 5000);
  }
};
setStatus("OK");

const loadBtn = document.getElementById("navLoadTestData");
const resetBtn = document.getElementById("navResetDatabase");
const editSwitch = document.getElementById("navEditMode");
const commitBtn = document.getElementById("navCommitChanges");
const revertBtn = document.getElementById("navRevertChanges");
let busy = false;
let changeBusy = false;

const setBusy = (isBusy) => {
  busy = Boolean(isBusy);
  if (loadBtn) loadBtn.disabled = busy;
  if (resetBtn) resetBtn.disabled = busy;
};

const updateChangeButtons = () => {
  const hasChanges = !!store.hasUncommittedChanges;
  const canCommit = hasChanges && !changeBusy;
  const canRevert = !!store.hasCommitSnapshot && hasChanges && !changeBusy;
  if (commitBtn) commitBtn.disabled = !canCommit;
  if (revertBtn) revertBtn.disabled = !canRevert;
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
      setStatus("Laddar testdata");
      await store.dataServiceManager.loadSeedDataToDatabase();
      setStatus("Testdata laddad");
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
      setStatus("Återställer databas");
      await store.dataServiceManager.resetDatabase();
      setStatus("Databas återställd");
    } catch (error) {
      setStatus(`Fel: ${error?.message || String(error)}`);
      console.error("Failed to reset database:", error);
    } finally {
      setBusy(false);
    }
  });
}

if (commitBtn) {
  commitBtn.addEventListener("click", () => {
    if (changeBusy) return;
    store.commitChanges();
    setStatus("Ändringar committade");
    updateChangeButtons();
  });
}

if (revertBtn) {
  revertBtn.addEventListener("click", async () => {
    if (changeBusy) return;
    if (!store.hasCommitSnapshot || !store.hasUncommittedChanges) return;
    if (!confirm("Revertera alla ändringar sedan senaste commit?")) {
      return;
    }
    changeBusy = true;
    updateChangeButtons();
    setStatus("Reverterar ändringar");
    try {
      await store.revertToCommit();
      setStatus("Ändringar återställda");
    } catch (error) {
      setStatus(`Fel: ${error?.message || String(error)}`);
      console.error("Failed to revert changes:", error);
    } finally {
      changeBusy = false;
      updateChangeButtons();
    }
  });
}

if (editSwitch) {
  editSwitch.checked = !!store.editMode;
  editSwitch.addEventListener("switch-change", (e) => {
    const enabled = !!e?.detail?.checked;
    store.setEditMode(enabled);
    editSwitch.checked = !!store.editMode;
  });
}

store.subscribe(() => {
  updateChangeButtons();
  if (editSwitch) {
    editSwitch.checked = !!store.editMode;
  }
});

updateChangeButtons();

store.init();

// Admin tabs in header (controlled by <admin-panel>)
const adminTabsEl = document.getElementById("adminTabs");
const appShellEl = document.querySelector(".app-shell");
const sidebarToggleEl = document.getElementById("sidebarToggle");
const sidebarBackdropEl = document.getElementById("sidebarBackdrop");
const sidebarQuery = window.matchMedia("(max-width: 960px)");

const setSidebarOpen = (isOpen) => {
  if (!appShellEl) return;
  appShellEl.classList.toggle("sidebar-open", isOpen);
  if (sidebarToggleEl) {
    sidebarToggleEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
};

const isSmallScreen = () => sidebarQuery.matches;

const syncSidebarForViewport = () => {
  if (isSmallScreen()) {
    setSidebarOpen(false);
  } else {
    setSidebarOpen(true);
  }
};

syncSidebarForViewport();
if (typeof sidebarQuery.addEventListener === "function") {
  sidebarQuery.addEventListener("change", syncSidebarForViewport);
} else if (typeof sidebarQuery.addListener === "function") {
  sidebarQuery.addListener(syncSidebarForViewport);
}

if (sidebarToggleEl) {
  sidebarToggleEl.addEventListener("click", () => {
    const isOpen = appShellEl?.classList.contains("sidebar-open");
    setSidebarOpen(!isOpen);
  });
}

if (sidebarBackdropEl) {
  sidebarBackdropEl.addEventListener("click", () => setSidebarOpen(false));
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (isSmallScreen()) setSidebarOpen(false);
});

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

if (adminTabsEl) {
  adminTabsEl.addEventListener("click", (event) => {
    if (!isSmallScreen()) return;
    const target = event.target?.closest?.(".admin-tab-btn");
    if (target) setSidebarOpen(false);
  });
}

customElements.whenDefined("admin-panel").then(() => {
  const panel = document.querySelector("admin-panel");
  if (!panel || !adminTabsEl) return;

  const tabs = typeof panel.getTabsMeta === "function" ? panel.getTabsMeta() : [];
  renderAdminTabs(tabs, panel.activeTab);

  panel.addEventListener("admin-tab-changed", (e) => {
    highlightAdminTab(e.detail?.activeTab);
  });
});
