/* =========================================================
   GP Banka Student Learning - Teacher Help Center Module
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("teacherList");
  const countEl = document.getElementById("teacherCount");
  const searchInput = document.getElementById("teacherSearch");
  const chipsContainer = document.getElementById("branchFilterChips");

  const BRANCH_LABELS = {
    electrical: "EE",
    civil: "CE",
    mechanical: "ME",
    electronics: "EC",
    cse: "CS",
    all: "ALL"
  };

  // URL से अगर कोई ब्रांच आई हो (जैसे teachers.html?branch=electrical)
  const params = new URLSearchParams(window.location.search);
  let activeBranch = (params.get("branch") || "all").toLowerCase();
  let allTeachers = [];

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateActiveChip() {
    chipsContainer.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.branch === activeBranch);
    });
  }

  function renderTeachers() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = allTeachers.filter((t) => {
      const branchMatch =
        activeBranch === "all" ||
        t.branch.toLowerCase() === activeBranch ||
        t.branch.toLowerCase() === "all";

      if (!branchMatch) return false;
      if (!query) return true;

      const haystack = [
        t.name,
        t.role,
        t.branch,
        t.helpFor,
        t.room,
        ...(t.subjects || [])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    countEl.textContent = `${filtered.length} Found`;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">इस ब्रांच या सर्च के लिए कोई टीचर नहीं मिला।</div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((t) => {
        const code = BRANCH_LABELS[t.branch.toLowerCase()] || "GPB";
        const subjectsHtml = (t.subjects || [])
          .map((sub) => `<span class="subject-tag">${escapeHTML(sub)}</span>`)
          .join("");

        return `
          <article class="app-card teacher-card">
            <div class="teacher-head">
              <div class="teacher-profile">
                <div class="teacher-avatar">${code}</div>
                <div>
                  <div class="teacher-name">${escapeHTML(t.name)}</div>
                  <div class="teacher-role">${escapeHTML(t.role)}</div>
                </div>
              </div>
              <span class="badge-clean">${code}</span>
            </div>

            ${subjectsHtml ? `<div class="tag-list">${subjectsHtml}</div>` : ""}

            <div class="teacher-help-box">
              <strong>Help For:</strong> ${escapeHTML(t.helpFor)}
            </div>

            <div class="teacher-meta-row">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${escapeHTML(t.timing)}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${escapeHTML(t.room)}
              </span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // चिप्स क्लिक इवेंट
  chipsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    activeBranch = btn.dataset.branch;
    updateActiveChip();
    renderTeachers();
  });

  // लाइव सर्च
  searchInput.addEventListener("input", renderTeachers);

  // डेटा लोड करो
  updateActiveChip();
  allTeachers = await window.DataService.getTeachers("all");
  renderTeachers();
});
