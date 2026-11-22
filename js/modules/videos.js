/* =========================================================
   GP Banka Student Learning - Smart Video Lectures Module
   Auto-detects: Full URL, youtu.be, Shorts, Embed, or raw ID
   ========================================================= */

window.VideoModule = (function () {
  // कोई भी YouTube लिंक या ID डालो -> यह अपने आप 11-अक्षर की Video ID निकाल लेगा
  function extractYouTubeId(input) {
    if (!input) return "";
    const str = String(input).trim();

    // अगर सीधे 11-अक्षर की Video ID डाली हो
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }

    // किसी भी YouTube URL से ID निकालने के लिए
    const regex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = str.match(regex);
    return match ? match[1] : "";
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // वीडियो प्लेयर और लिस्ट रेंडर करना
  function render(containerEl, videos, activeVideoId = null) {
    if (!videos || videos.length === 0) {
      containerEl.innerHTML = `<div class="empty-state">इस ब्रांच या सेमेस्टर के लिए अभी कोई वीडियो लेक्चर नहीं है।</div>`;
      return;
    }

    // पहला वैध वीडियो चुनें (या जो यूज़र ने क्लिक किया हो)
    const currentVideo =
      videos.find((v) => v.id === activeVideoId) || videos[0];
    const ytId = extractYouTubeId(currentVideo.videoUrl);

    const playerHtml = ytId
      ? `
        <div class="video-player-card">
          <div class="video-frame-wrap">
            <iframe
              src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1"
              title="${escapeHTML(currentVideo.title)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
          <div class="video-now-playing">
            <div class="material-title">${escapeHTML(currentVideo.title)}</div>
            <div class="material-meta">${escapeHTML(currentVideo.subject)} • Sem ${escapeHTML(currentVideo.semester)}</div>
          </div>
        </div>
      `
      : `<div class="empty-state">इस वीडियो का YouTube लिंक सही नहीं है।</div>`;

    const listHtml = videos
      .map((v) => {
        const isPlaying = v.id === currentVideo.id;
        return `
          <button
            type="button"
            class="app-card material-card video-item-btn ${isPlaying ? "video-active" : ""}"
            data-vid="${escapeHTML(v.id)}"
            style="width:100%; text-align:left;"
          >
            <div class="material-left">
              <div class="format-box">${isPlaying ? "PLAY" : "VID"}</div>
              <div class="material-body">
                <div class="material-title">${escapeHTML(v.title)}</div>
                <div class="material-meta">${escapeHTML(v.subject)} • Sem ${escapeHTML(v.semester)} ${v.duration ? "• " + escapeHTML(v.duration) : ""}</div>
              </div>
            </div>
          </button>
        `;
      })
      .join("");

    containerEl.innerHTML = `
      ${playerHtml}
      <div class="list-stack" style="margin-top:14px;">${listHtml}</div>
    `;

    // किसी भी वीडियो पर क्लिक करने पर ऊपर प्लेयर में तुरंत चलेगा
    containerEl.querySelectorAll(".video-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        render(containerEl, videos, btn.dataset.vid);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  return {
    extractYouTubeId,
    render
  };
})();
