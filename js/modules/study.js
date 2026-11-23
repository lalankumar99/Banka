/* =========================================================
   GP Banka Student Learning - Unified Study Hub Module
   Supports: Notes, VVI, PYQ, Syllabus + Videos + MCQ Quiz
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("materialList");
  const countEl = document.getElementById("materialCount");
  const headingEl = document.getElementById("studyHeading");
  const subheadingEl = document.getElementById("studySubheading");
  const searchInput = document.getElementById("materialSearch");
  const typeChips = document.getElementById("typeFilterChips");
  const formatChips = document.getElementById("formatFilterChips");
  const fileFormatSection = document.getElementById("fileFormatSection");

  const params = new URLSearchParams(window.location.search);
  const activeBranch = (params.get("branch") || "all").toLowerCase();
  const activeSem = params.get("sem") || "all";
  let activeType = (params.get("type") || "all").toLowerCase();
  let activeFormat = (params.get("format") || "all").toLowerCase();

  let allMaterials = [];
  let allVideos = [];
  let allQuizzes = [];

  const TYPE_LABELS = {
    notes: "Notes",
    vvi: "VVI",
    pyq: "PYQ",
    syllabus: "Syllabus",
    videos: "Video Lectures",
    quiz: "MCQ Quiz"
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
    headingEl.textContent =
      activeType !== "all" ? (TYPE_LABELS[activeType] || "Study Hub") : "Study Material";
    subheadingEl.textContent = `${branchText} • ${semText}`;
  }

  function syncChips() {
    typeChips.querySelectorAll(".filter-chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.type === activeType);
    });
    if (formatChips) {
      formatChips.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.format === activeFormat);
      });
    }
    if (fileFormatSection) {
      const hideFormats = activeType === "videos" || activeType === "quiz";
      fileFormatSection.classList.toggle("hidden", hideFormats);
    }
  }

  async function renderCurrentView() {
    const query = searchInput.value.trim().toLowerCase();

    // ---------- MODE A: VIDEO LECTURES ----------
    if (activeType === "videos") {
      if (allVideos.length === 0) {
        allVideos = await window.DataService.getVideos();
      }

      const filteredVideos = allVideos.filter((v) => {
        if (activeBranch !== "all" && v.branch.toLowerCase() !== activeBranch) return false;
        if (activeSem !== "all" && String(v.semester) !== String(activeSem)) return false;
        if (!query) return true;
        const hay = `${v.title} ${v.subject} ${v.branch}`.toLowerCase();
        return hay.includes(query);
      });

      countEl.textContent = `${filteredVideos.length} Videos`;
      if (window.VideoModule) {
        window.VideoModule.render(listEl, filteredVideos);
      }
      return;
    }

    // ---------- MODE B: MCQ QUIZ ----------
    if (activeType === "quiz") {
      if (allQuizzes.length === 0) {
        allQuizzes = await window.DataService.getQuizzes();
      }

      const filteredQuizzes = allQuizzes.filter((q) => {
        if (activeBranch !== "all" && q.branch.toLowerCase() !== activeBranch) return false;
        if (activeSem !== "all" && String(q.semester) !== String(activeSem)) return false;
        if (!query) return true;
        const hay = `${q.title} ${q.subject} ${q.branch}`.toLowerCase();
        return hay.includes(query);
      });

      countEl.textContent = `${filteredQuizzes.length} Quizzes`;
      if (window.QuizModule) {
        window.QuizModule.render(listEl, filteredQuizzes);
      }
      return;
    }

    // ---------- MODE C: NOTES / VVI / PYQ / SYLLABUS ----------
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
    renderCurrentView();
  });

  // Format Chips
  if (formatChips) {
    formatChips.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      activeFormat = btn.dataset.format;
      syncChips();
      renderCurrentView();
    });
  }

  searchInput.addEventListener("input", renderCurrentView);

  // Initialize
  updateHeader();
  syncChips();
  allMaterials = await window.DataService.getMaterials();
  renderCurrentView();
});
