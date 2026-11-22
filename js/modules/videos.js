/* =========================================================
   GP Banka Student Learning - Locked Video Lectures Module
   No YouTube Redirect | Tap to Play/Pause | Custom Landscape
   ========================================================= */

window.VideoModule = (function () {
  function extractYouTubeId(input) {
    if (!input) return "";
    const str = String(input).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
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

  function sendPlayerCommand(iframe, func) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: func, args: [] }),
      "*"
    );
  }

  function render(containerEl, videos, activeVideoId = null) {
    if (!videos || videos.length === 0) {
      containerEl.innerHTML = `<div class="empty-state">इस ब्रांच या सेमेस्टर के लिए अभी कोई वीडियो लेक्चर नहीं है।</div>`;
      return;
    }

    const currentVideo =
      videos.find((v) => v.id === activeVideoId) || videos[0];
    const ytId = extractYouTubeId(currentVideo.videoUrl);

    const playerHtml = ytId
      ? `
        <div class="video-player-card">
          <div class="video-frame-wrap" id="gpbVideoWrap">
            <iframe
              id="gpbYtFrame"
              src="https://www.youtube.com/embed/${ytId}?enablejsapi=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1"
              title="${escapeHTML(currentVideo.title)}"
              allow="autoplay; encrypted-media; fullscreen"
            ></iframe>

            <!-- पारदर्शी शील्ड (YouTube क्लिक ब्लॉक + Tap to Play/Pause) -->
            <div class="video-shield" id="gpbVideoShield">
              <div class="video-play-badge">
                <svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </div>
            </div>

            <!-- तुम्हारा कस्टम Landscape / Fullscreen बटन -->
            <button type="button" class="video-fs-btn" id="gpbLandscapeBtn" aria-label="Landscape Fullscreen">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
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

    // 1. Tap to Play / Pause (बिन YouTube खोले)
    const wrap = document.getElementById("gpbVideoWrap");
    const iframe = document.getElementById("gpbYtFrame");
    const shield = document.getElementById("gpbVideoShield");
    const fsBtn = document.getElementById("gpbLandscapeBtn");

    let isPlaying = false;

    if (shield && iframe && wrap) {
      shield.addEventListener("click", () => {
        if (isPlaying) {
          sendPlayerCommand(iframe, "pauseVideo");
          wrap.classList.remove("is-playing");
          isPlaying = false;
        } else {
          sendPlayerCommand(iframe, "playVideo");
          wrap.classList.add("is-playing");
          isPlaying = true;
        }
      });
    }

    // 2. कस्टम Landscape Fullscreen बटन
    if (fsBtn && wrap) {
      fsBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (wrap.requestFullscreen) {
              await wrap.requestFullscreen();
            } else if (wrap.webkitRequestFullscreen) {
              wrap.webkitRequestFullscreen();
            }
            // मोबाइल को अपने आप Landscape में घुमाने की कोशिश
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock("landscape").catch(() => {});
            }
          } else {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          }
        } catch (_) {}
      });
    }

    // 3. लिस्ट से दूसरा वीडियो चुनना
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
