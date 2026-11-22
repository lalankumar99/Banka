/* =========================================================
   GP Banka Student Learning - Home Page Engine
   Live Global Search + Dynamic Notices & Notification Sheet
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("globalSearch");
  const resultsBox = document.getElementById("searchResultsBox");
  const homeNoticeList = document.getElementById("homeNoticeList");
  const notifSheetList = document.getElementById("notifSheetList");
  const notifDot = document.getElementById("notifDot");

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- 1. Load Live Notices & Notification Sheet ----------
  try {
    const notices = await window.DataService.getNotices();
    if (notices.length > 0) {
      const hasNew = notices.some((n) => n.isNew);
      if (notifDot && !hasNew) notifDot.style.display = "none";

      const renderNoticeCards = (list) =>
        list
          .map(
            (n) => `
          <div class="app-card notice-row">
            <div class="notice-top">
              <span class="badge-clean">${escapeHTML(n.category || "Notice")}</span>
              <span class="notice-date">${escapeHTML(n.date || "")}</span>
            </div>
            <div class="notice-text">${escapeHTML(n.title)}</div>
          </div>
        `
          )
          .join("");

      // होम पेज पर टॉप 2 नोटिस
      if (homeNoticeList) {
        homeNoticeList.innerHTML = renderNoticeCards(notices.slice(0, 2));
      }
      // नोटिफिकेशन शीट में सभी नोटिस
      if (notifSheetList) {
        notifSheetList.innerHTML = renderNoticeCards(notices);
      }
    }
  } catch (err) {
    console.warn("[Home] Notice load failed:", err);
  }

  // ---------- 2. Live Global Search (Notes + VVI + PYQ + Teachers) ----------
  let searchTimer = null;

  if (searchInput && resultsBox) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();

      if (!q) {
        resultsBox.classList.add("hidden");
        resultsBox.innerHTML = "";
        return;
      }

      searchTimer = setTimeout(async () => {
        const { materials, teachers } = await window.DataService.searchAll(q);
        const total = materials.length + teachers.length;

        resultsBox.classList.remove("hidden");

        if (total === 0) {
          resultsBox.innerHTML = `<div class="empty-state">"${escapeHTML(q)}" से जुड़ा कोई नोट्स या टीचर नहीं मिला।</div>`;
          return;
        }

        let html = `<div class="section-header" style="margin-bottom:4px;">
          <span class="section-title">Search Results (${total})</span>
          <button type="button" class="section-link" id="clearSearchBtn">साफ़ करें</button>
        </div>`;

        // Materials Results
        materials.slice(0, 5).forEach((m) => {
          html += `
            <a href="pages/viewer.html?id=${encodeURIComponent(m.id)}" class="app-card branch-card">
              <div class="branch-left">
                <div class="branch-code">${escapeHTML((m.fileFormat || "PDF").toUpperCase())}</div>
                <div>
                  <div class="branch-name">${escapeHTML(m.title)}</div>
                  <div class="branch-meta">${escapeHTML(m.subject)} • Sem ${escapeHTML(m.semester)} • ${escapeHTML((m.type || "").toUpperCase())}</div>
                </div>
              </div>
              <svg class="chevron-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          `;
        });

        // Teachers Results
        teachers.slice(0, 3).forEach((t) => {
          html += `
            <a href="pages/teachers.html?branch=${encodeURIComponent(t.branch)}" class="app-card branch-card">
              <div class="branch-left">
                <div class="branch-code">TR</div>
                <div>
                  <div class="branch-name">${escapeHTML(t.name)}</div>
                  <div class="branch-meta">${escapeHTML(t.helpFor || t.role)}</div>
                </div>
              </div>
              <svg class="chevron-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          `;
        });

        resultsBox.innerHTML = html;

        const clearBtn = document.getElementById("clearSearchBtn");
        if (clearBtn) {
          clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            resultsBox.classList.add("hidden");
            resultsBox.innerHTML = "";
          });
        }
      }, 180);
    });
  }
});
