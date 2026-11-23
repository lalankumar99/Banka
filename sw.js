/* =========================================================
   GP Banka Student Learning - Zero-Lag Service Worker (v6)
   Strategy: Cache-First (UI/CSS/JS) | Network-First (Data)
   ========================================================= */

const CACHE_NAME = "gpb-learning-v6";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css",
  "./css/components.css",
  "./js/core/firebase-config.js",
  "./js/core/data-service.js",
  "./js/modules/home.js",
  "./js/modules/teachers.js",
  "./js/modules/study.js",
  "./js/modules/videos.js",
  "./js/modules/quiz.js",
  "./js/modules/file-viewer.js",
  "./pages/branches.html",
  "./pages/semester.html",
  "./pages/study-material.html",
  "./pages/teachers.html",
  "./pages/viewer.html",
  "./pages/notices.html",
  "./pages/tools.html"
];

// Install: Core files ko cache mein save karein
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Purana cache (v1-v5) apne aap delete karein
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Data/Quiz JSON ke liye Network-First, baaki UI ke liye Cache-First
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // JSON data (materials, videos, quizzes, quiz-sets) & Firebase -> Network-First
  if (url.pathname.includes("/data/") || url.hostname.includes("firestore")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // CSS, JS, HTML -> Cache-First (Zero-Lag)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      });
    })
  );
});
