/* =========================================================
   GP Banka Student Learning - Universal Data Service
   Zero-Lag In-Memory Cache + Auto Path Resolver + Firebase Bridge
   ========================================================= */

window.DataService = (function () {
  // मेमोरी कैश: एक बार लोड हुआ डेटा दोबारा डाउनलोड नहीं होगा (Zero-Lag)
  const _cache = {};

  // यह अपने आप पहचान लेगा कि पेज root (index.html) पर है या pages/ फोल्डर में
  function getBasePath() {
    return window.location.pathname.includes("/pages/") ? "../" : "";
  }

  // लोकल JSON फाइल या Firebase से डेटा लाने का कॉमन फंक्शन
  async function fetchCollection(key) {
    // 1. अगर कैश में पहले से है, तो तुरंत लौटाओ
    if (_cache[key]) {
      return _cache[key];
    }

    // 2. अगर Firebase चालू है -> Firestore से डेटा लाओ
    if (window.GPB_CONFIG && window.GPB_CONFIG.USE_FIREBASE && window.GPB_DB) {
      try {
        const colName = window.GPB_CONFIG.collections[key] || key;
        const snapshot = await window.GPB_DB.collection(colName).get();
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        _cache[key] = list;
        return list;
      } catch (err) {
        console.error(`[DataService] Firebase fetch error (${key}):`, err);
        return [];
      }
    }

    // 3. अगर Firebase बंद है -> लोकल data/*.json से डेटा लाओ
    try {
      const url = `${getBasePath()}data/${key}.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      _cache[key] = data;
      return data;
    } catch (err) {
      console.warn(`[DataService] Local JSON load failed (${key}):`, err.message);
      return [];
    }
  }

  return {
    // सभी ब्रांच की लिस्ट
    async getBranches() {
      return await fetchCollection("branches");
    },

    // टीचर हेल्प सेंटर (ब्रांच के हिसाब से फ़िल्टर करने का ऑप्शन)
    async getTeachers(branchId = "all") {
      const teachers = await fetchCollection("teachers");
      if (!branchId || branchId === "all") return teachers;
      return teachers.filter(
        (t) => t.branch.toLowerCase() === branchId.toLowerCase() || t.branch === "all"
      );
    },

    // स्टडी मटेरियल (PDF, Image, DOC, HTML) — ब्रांच, सेमेस्टर और टाइप के हिसाब से फ़िल्टर
    async getMaterials(filters = {}) {
      const items = await fetchCollection("materials");
      return items.filter((item) => {
        if (filters.branch && filters.branch !== "all" && item.branch !== filters.branch) {
          return false;
        }
        if (filters.semester && filters.semester !== "all" && String(item.semester) !== String(filters.semester)) {
          return false;
        }
        if (filters.type && filters.type !== "all" && item.type !== filters.type) {
          return false;
        }
        if (filters.fileFormat && filters.fileFormat !== "all" && item.fileFormat !== filters.fileFormat) {
          return false;
        }
        return true;
      });
    },

    // कॉलेज और SBTE के नोटिस
    async getNotices() {
      return await fetchCollection("notices");
    },

    // ग्लोबल सर्च (होम पेज सर्च बार के लिए)
    async searchAll(query) {
      const q = (query || "").trim().toLowerCase();
      if (!q) return { materials: [], teachers: [] };

      const [materials, teachers] = await Promise.all([
        fetchCollection("materials"),
        fetchCollection("teachers")
      ]);

      return {
        materials: materials.filter(
          (m) =>
            (m.title && m.title.toLowerCase().includes(q)) ||
            (m.subject && m.subject.toLowerCase().includes(q)) ||
            (m.type && m.type.toLowerCase().includes(q))
        ),
        teachers: teachers.filter(
          (t) =>
            (t.name && t.name.toLowerCase().includes(q)) ||
            (t.subjects && t.subjects.join(" ").toLowerCase().includes(q)) ||
            (t.branch && t.branch.toLowerCase().includes(q))
        )
      };
    },

    // कैश क्लियर करने के लिए (भविष्य में Refresh बटन के काम आएगा)
    clearCache() {
      Object.keys(_cache).forEach((k) => delete _cache[k]);
    }
  };
})();
