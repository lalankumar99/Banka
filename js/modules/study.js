/* =========================================================
   GP Banka Student Learning - Study Material Hub Module
   Supports: PDF, Image, DOC, HTML | Branch & Semester Filters
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("materialList");
  const countEl = document.getElementById("materialCount");
  const headingEl = document.getElementById("studyHeading");
  const subheadingEl = document.getElementById("studySubheading");
  const searchInput = document.getElementById("materialSearch");
  const typeChips = document.getElementById("typeFilterChips");
  const formatChips = document.getElementById("formatFilterChips");

  const params = new URLSearchParams(window.location.search);
  const activeBranch = (params.get("branch") || "all").toLowerCase();
  const activeSem = params.get("sem") || "all";
  let activeType = (params.get("type") || "all").toLowerCase();
  let activeFormat = (params.get("format") || "all").toLowerCase();

  let allMaterials = [];

  const TYPE_LABELS = {
    notes: "Notes",
    vvi: "VVI",
    pyq: "PYQ",
    syllabus: "Syllabus"
  };

  const FORMAT_SHORT = {
    pdf: "PDF",
    image: "IMG",
    doc: "DOC",
    html: "HTML"
  };

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateHeader() {
    const branchText = activeBranch === "all" ? "All Branches" : activeBranch.toUpperCase();
    const semText = activeSem === "all" ? "All Semesters" : `Semester ${activeSem}`;
    headingEl.textContent = activeType !== "all" ? `${TYPE_LABELS[activeType] || "Study"} Hub` : "Study Material";
    subheadingEl.textContent = `${branchText} • ${semText}`;
  }

  function syncChips() {
    typeChips.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.type === activeType);
    });
    formatChips.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.format === activeFormat);
    });
  }

  function renderMaterials() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = allMaterials.filter((item) => {
      if (activeBranch !== "all" && item.branch.toLowerCase() !== activeBranch) return false;
      if (activeSem !== "all" && String(item.semester) !== String(activeSem)) return false;
      if (activeType !== "all" && item.type.toLowerCase() !== activeType) return false;
      if (activeFormat !== "all" && item.fileFormat.toLowerCase() !== activeFormat) return false;

      if (!query) return true;
      const hay = `${item.title} ${item.subject} ${item.type} ${item.fileFormat} ${item.branch}`.toLowerCase();
      return hay.includes(query);
    });

    countEl.textContent = `${filtered.length} Files`;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">इस फ़िल्टर के लिए अभी कोई फाइल उपलब्ध नहीं है।</div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((item) => {
        const fmt = FORMAT_SHORT[item.fileFormat.toLowerCase()] || "FILE";
        const typeLabel = TYPE_LABELS[item.type.toLowerCase()] || item.type;

        return `
          <a href="viewer.html?id=${encodeURIComponent(item.id)}" class="app-card material-card">
            <div class="material-left">
              <div class="format-box">${fmt}</div>
              <div class="material-body">
                <div class="material-title">${escapeHTML(item.title)}</div>
                <div class="material-meta">${escapeHTML(item.subject)} • Sem ${escapeHTML(item.semester)}</div>
                <div class="material-tags">
                  <span class="badge-clean">${escapeHTML(typeLabel)}</span>
                  <span class="subject-tag">${escapeHTML(item.size || "")}</span>
                </div>
              </div>
            </div>
            <svg class="chevron-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </a>
        `;
      })
      .join("");
  }

  // Category Chips
  typeChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    activeType = btn.dataset.type;
    syncChips();
    updateHeader();
    renderMaterials();
  });

  // Format Chips
  formatChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    activeFormat = btn.dataset.format;
    syncChips();
    renderMaterials();
  });

  searchInput.addEventListener("input", renderMaterials);

  // Initialize
  updateHeader();
  syncChips();
  allMaterials = await window.DataService.getMaterials();
  renderMaterials();
});
