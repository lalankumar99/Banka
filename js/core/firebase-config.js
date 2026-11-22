/* =========================================================
   GP Banka Student Learning - Central Firebase Controller
   भविष्य में सिर्फ इसी एक फाइल से पूरा ऐप Firebase से जुड़ेगा
   ========================================================= */

window.GPB_CONFIG = {
  // अभी लोकल डेटा के लिए false रखें।
  // जब Firebase सेटअप कर लें, तो बस इसे true कर दें।
  USE_FIREBASE: false,

  // भविष्य में Firebase Console से मिलने वाला Config यहाँ पेस्ट करें
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  // Firestore Collections के नाम (Admin Panel भी इन्हीं नामों को यूज़ करेगा)
  collections: {
    branches: "branches",
    teachers: "teachers",
    materials: "materials",
    notices: "notices"
  }
};

// Firebase Auto-Initializer (जब USE_FIREBASE = true होगा तब चलेगा)
window.GPB_DB = null;

(function initFirebaseIfEnabled() {
  if (!window.GPB_CONFIG.USE_FIREBASE) {
    console.log("[GPB Core] Mode: Local JSON (Fast Offline-Ready)");
    return;
  }

  try {
    if (typeof firebase !== "undefined" && firebase.apps) {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.GPB_CONFIG.firebaseConfig);
      }
      window.GPB_DB = firebase.firestore();
      console.log("[GPB Core] Mode: Firebase Connected");
    } else {
      console.warn("[GPB Core] Firebase SDK लोड नहीं है, Local Mode पर चल रहा है।");
      window.GPB_CONFIG.USE_FIREBASE = false;
    }
  } catch (err) {
    console.error("[GPB Core] Firebase Init Error:", err);
    window.GPB_CONFIG.USE_FIREBASE = false;
  }
})();
