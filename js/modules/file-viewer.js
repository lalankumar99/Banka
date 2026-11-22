/* =========================================================
   GP Banka Student Learning - Universal File Viewer
   Supports: PDF, Image, HTML, DOC/DOCX (Local & Firebase URLs)
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const titleEl = document.getElementById("viewerTitle");
  const subtitleEl = document.getElementById("viewerSubtitle");
  const subjectEl = document.getElementById("viewerSubject");
  const formatBadgeEl = document.getElementById("viewerFormatBadge");
  const downloadBtn = document.getElementById("downloadBtn");
  const stageEl = document.getElementById("viewerStage");

  const params = new URLSearchParams(window.location.search);
  const fileId = params.get("id");

  if (!fileId) {
    showError("कोई फाइल सेलेक्ट नहीं की गई है।");
    return;
  }

  const allMaterials = await window.DataService.getMaterials();
  const file = allMaterials.find((m) => String(m.id) === String(fileId));

  if (!file) {
    showError("यह फाइल डेटाबेस में नहीं मिली।");
    return;
  }

  // पाथ रिजॉल्व करना: अगर Firebase/HTTP लिंक है तो वैसा ही रहेगा, लोकल है तो ../ जुड़ेगा
  const isExternal = /^https?:\/\//i.test(file.url);
  const resolvedUrl = isExternal ? file.url : `../${file.url}`;
  const format = (file.fileFormat || "pdf").toLowerCase();

  // हेडर और मेटा अपडेट
  document.title = `${file.title} - GP Banka`;
  titleEl.textContent = file.title;
  subtitleEl.textContent = `${(file.branch || "").toUpperCase()} • Sem ${file.semester || "-"}`;
  subjectEl.textContent = `${file.subject || "Study Material"} ${file.size ? "• " + file.size : ""}`;
  formatBadgeEl.textContent = format.toUpperCase();

  // Download बटन एक्टिव करें
  downloadBtn.href = resolvedUrl;
  downloadBtn.classList.remove("hidden");

  // फाइल फॉर्मेट के हिसाब से रेंडर करें
  if (format === "image") {
    renderImage(resolvedUrl, file.title);
  } else if (format === "html") {
    renderHtmlNote(resolvedUrl);
  } else if (format === "pdf") {
    renderPdf(resolvedUrl, isExternal);
  } else if (format === "doc" || format === "docx") {
    renderDoc(resolvedUrl, file.title, isExternal);
  } else {
    renderFallback(resolvedUrl, file.title, "यह फाइल सीधे डाउनलोड करके खोली जा सकती है।");
  }

  // ---------- 1. Image Viewer (Tap to Zoom) ----------
  function renderImage(url, alt) {
    stageEl.innerHTML = `
      <div class="viewer-image-wrap">
        <img src="${url}" alt="${escapeHTML(alt)}" class="viewer-image" id="zoomImg" loading="lazy" />
        <span class="notice-date">इमेज को ज़ूम करने के लिए उस पर टैप करें</span>
      </div>
    `;

    const img = document.getElementById("zoomImg");
    img.addEventListener("click", () => img.classList.toggle("zoomed"));
    img.addEventListener("error", () => {
      renderFallback(url, alt, "इमेज फाइल अभी फोल्डर में मौजूद नहीं है।");
    });
  }

  // ---------- 2. Interactive HTML Notes Viewer ----------
  function renderHtmlNote(url) {
    stageEl.innerHTML = `
      <iframe
        src="${url}"
        class="viewer-frame"
        title="HTML Notes Viewer"
        loading="lazy"
      ></iframe>
    `;
  }

  // ---------- 3. PDF Viewer (Mobile-Safe + Quick Open) ----------
  function renderPdf(url, external) {
    const iframeSrc = external
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
      : url;

    stageEl.innerHTML = `
      <div style="padding:10px 16px; border-bottom:1px solid var(--border-light); display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <span class="notice-date">अगर मोबाइल में PDF न खुले, तो Open दबाएँ</span>
        <a href="${url}" target="_blank" rel="noopener" class="btn-outline">Open PDF</a>
      </div>
      <iframe
        src="${iframeSrc}"
        class="viewer-frame"
        title="PDF Viewer"
      ></iframe>
    `;
  }

  // ---------- 4. DOC / DOCX Viewer ----------
  function renderDoc(url, title, external) {
    if (external) {
      // Firebase/Online URL होने पर Google Docs Viewer से अंदर ही खुलेगा
      const gviewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
      stageEl.innerHTML = `
        <iframe src="${gviewUrl}" class="viewer-frame" title="DOC Viewer"></iframe>
      `;
    } else {
      // लोकल DOC फाइल के लिए साफ़ डाउनलोड और ओपन कार्ड
      renderFallback(
        url,
        title,
        "Word (.doc/.docx) फाइल देखने के लिए नीचे Download बटन दबाएँ। (Firebase से जुड़ने पर यह सीधे ऐप के अंदर भी खुलेगी।)"
      );
    }
  }

  function renderFallback(url, title, message) {
    stageEl.innerHTML = `
      <div class="viewer-fallback-box">
        <div class="format-box">${format.toUpperCase()}</div>
        <div class="help-title">${escapeHTML(title)}</div>
        <div class="help-desc">${escapeHTML(message)}</div>
        <div class="viewer-actions-row">
          <a href="${url}" download class="btn-solid">Download File</a>
          <a href="${url}" target="_blank" rel="noopener" class="btn-outline">Open External</a>
        </div>
      </div>
    `;
  }

  function showError(msg) {
    titleEl.textContent = "File Not Found";
    stageEl.innerHTML = `<div class="viewer-fallback-box"><div class="help-desc">${escapeHTML(msg)}</div></div>`;
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
