import "./components/admin-panel.js";
import "./components/import-export.js";

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
