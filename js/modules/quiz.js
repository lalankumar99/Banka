/* =========================================================
   GP Banka Student Learning - Modular MCQ Quiz Engine
   Index: data/quizzes.json | Questions: Separate JSON files
   ========================================================= */

window.QuizModule = (function () {
  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Relative path fix (kyunki study-material.html pages/ folder ke andar hai)
  function resolvePath(filePath) {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath) || filePath.startsWith("../") || filePath.startsWith("/")) {
      return filePath;
    }
    return "../" + filePath;
  }

  // 1. Quiz List dikhana
  function render(containerEl, quizzes) {
    if (!quizzes || quizzes.length === 0) {
      containerEl.innerHTML = `<div class="empty-state">Is branch ya semester ke liye abhi koi MCQ Quiz nahi hai.</div>`;
      return;
    }

    containerEl.innerHTML = quizzes
      .map(
        (qz) => `
        <button
          type="button"
          class="app-card material-card quiz-start-btn"
          data-qid="${escapeHTML(qz.id)}"
          style="width:100%; text-align:left;"
        >
          <div class="material-left">
            <div class="format-box">MCQ</div>
            <div class="material-body">
              <div class="material-title">${escapeHTML(qz.title)}</div>
              <div class="material-meta">${escapeHTML(qz.subject)} • Sem ${escapeHTML(qz.semester)} ${qz.questionCount ? "• " + escapeHTML(qz.questionCount) + " Qs" : ""}</div>
            </div>
          </div>
          <svg class="chevron-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `
      )
      .join("");

    containerEl.querySelectorAll(".quiz-start-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const selected = quizzes.find((q) => q.id === btn.dataset.qid);
        if (!selected) return;

        containerEl.innerHTML = `<div class="empty-state">Quiz load ho raha hai...</div>`;

        try {
          const res = await fetch(resolvePath(selected.file));
          if (!res.ok) throw new Error("File not found");
          const questions = await res.json();

          if (!Array.isArray(questions) || questions.length === 0) {
            containerEl.innerHTML = `<div class="empty-state">Is quiz mein abhi koi question nahi hai.</div>`;
            return;
          }

          startQuiz(containerEl, selected, questions, quizzes);
        } catch (err) {
          containerEl.innerHTML = `
            <div class="empty-state">
              Quiz file load nahi ho paayi.<br><br>
              <button type="button" class="btn-outline" id="quizRetryLoadBtn">Wapas jayein</button>
            </div>
          `;
          const backBtn = document.getElementById("quizRetryLoadBtn");
          if (backBtn) backBtn.addEventListener("click", () => render(containerEl, quizzes));
        }
      });
    });
  }

  // 2. Quiz shuru karna
  function startQuiz(containerEl, quizMeta, questions, allQuizzes) {
    let currentIndex = 0;
    let score = 0;
    let answered = false;

    function showQuestion() {
      answered = false;
      const qObj = questions[currentIndex];
      const total = questions.length;

      containerEl.innerHTML = `
        <div class="app-card quiz-box">
          <div class="quiz-top">
            <span class="badge-clean">Q ${currentIndex + 1} / ${total}</span>
            <button type="button" class="section-link" id="quizExitBtn">Exit</button>
          </div>

          <div class="quiz-question">${escapeHTML(qObj.q)}</div>

          <div class="quiz-options" id="quizOptions">
            ${qObj.options
              .map(
                (opt, idx) => `
                <button type="button" class="quiz-option" data-idx="${idx}">
                  <span class="quiz-opt-key">${String.fromCharCode(65 + idx)}</span>
                  <span>${escapeHTML(opt)}</span>
                </button>
              `
              )
              .join("")}
          </div>

          <div class="quiz-exp hidden" id="quizExp"></div>

          <div class="quiz-footer hidden" id="quizFooter">
            <button type="button" class="btn-solid" id="quizNextBtn" style="width:100%;">
              ${currentIndex + 1 === total ? "Result Dekhein" : "Next Question →"}
            </button>
          </div>
        </div>
      `;

      document.getElementById("quizExitBtn").addEventListener("click", () => {
        render(containerEl, allQuizzes);
      });

      const optionsWrap = document.getElementById("quizOptions");
      const expBox = document.getElementById("quizExp");
      const footerBox = document.getElementById("quizFooter");

      optionsWrap.querySelectorAll(".quiz-option").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (answered) return;
          answered = true;

          const picked = Number(btn.dataset.idx);
          const correct = Number(qObj.answer);

          if (picked === correct) {
            score++;
            btn.classList.add("correct");
          } else {
            btn.classList.add("wrong");
            const rightBtn = optionsWrap.querySelector(`[data-idx="${correct}"]`);
            if (rightBtn) rightBtn.classList.add("correct");
          }

          if (qObj.explanation) {
            expBox.textContent = "Explanation: " + qObj.explanation;
            expBox.classList.remove("hidden");
          }
          footerBox.classList.remove("hidden");
        });
      });

      document.getElementById("quizNextBtn").addEventListener("click", () => {
        currentIndex++;
        if (currentIndex < total) {
          showQuestion();
        } else {
          showResult();
        }
      });
    }

    // 3. Final Scorecard
    function showResult() {
      const total = questions.length;
      const percent = Math.round((score / total) * 100);

      containerEl.innerHTML = `
        <div class="app-card quiz-score-card">
          <div class="badge-clean">${escapeHTML(quizMeta.subject)}</div>
          <div class="quiz-score-num">${score} / ${total}</div>
          <div class="quiz-score-sub">Accuracy: ${percent}%</div>
          <div class="quiz-score-actions">
            <button type="button" class="btn-solid" id="quizRetryBtn">Phir se khelein</button>
            <button type="button" class="btn-outline" id="quizBackListBtn">All Quizzes</button>
          </div>
        </div>
      `;

      document.getElementById("quizRetryBtn").addEventListener("click", () => {
        startQuiz(containerEl, quizMeta, questions, allQuizzes);
      });
      document.getElementById("quizBackListBtn").addEventListener("click", () => {
        render(containerEl, allQuizzes);
      });
    }

    showQuestion();
  }

  return { render };
})();
