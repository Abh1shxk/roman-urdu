/* Quiz: English <-> Roman Urdu, multiple choice or typed (spelling-tolerant). */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;
  const ui = { scope: "all", dir: "both", style: "mix", len: 10 };

  function pickDistractors(w, field) {
    const key = function (x) { return field === "roman" ? App.normRoman(x.roman) : x.english.toLowerCase(); };
    const bad = function (x) {
      return x.id === w.id || key(x) === key(w) || x.english.toLowerCase() === w.english.toLowerCase() ||
        App.normRoman(x.roman) === App.normRoman(w.roman);
    };
    const out = [], seen = {};
    seen[key(w)] = true;
    const pools = [App.shuffle(App.cat(w.cat).words), App.shuffle(App.words)];
    for (let p = 0; p < pools.length && out.length < 3; p++) {
      for (let k = 0; k < pools[p].length && out.length < 3; k++) {
        const x = pools[p][k];
        if (bad(x) || seen[key(x)]) continue;
        seen[key(x)] = true;
        out.push(x);
      }
    }
    return out;
  }

  App.views.quiz = {
    render: function (el, param) {
      if (param === "custom" && App.pendingQuizIds) ui.scope = "custom";
      else if (param && (App.cat(param) || ["all", "due", "learning", "learned", "saved", "everyday", "adabi"].indexOf(param) >= 0)) ui.scope = param;
      let qs = [], i = 0, score = 0, missed = [], answered = false;

      function scopeWords() {
        if (ui.scope === "custom") return (App.pendingQuizIds || []).map(function (id) { return App.byId[id]; }).filter(Boolean);
        return App.wordsFor(ui.scope);
      }

      function setup() {
        const extra = (App.pendingQuizIds ? [["custom", "My last flashcard round"]] : [])
          .concat([["learning", "Words I'm learning"], ["learned", "Words I've learned"], ["due", "Due for review"]]);
        el.innerHTML = App.practiceSwitch("quiz") +
          '<h1>Quiz</h1>' +
          '<p class="lead">Test yourself both ways. When typing Roman Urdu, any common spelling counts: <b>bahut</b>, <b>bohat</b> and <b>bohot</b> are all right.</p>' +
          '<div class="card quiz-card">' +
            '<div class="setup-grid">' +
              '<label class="field">Words<select id="s-scope">' + App.scopeOptions(ui.scope, extra) + '</select></label>' +
              '<label class="field">Questions<select id="s-len">' + [10, 20, 30].map(function (n) { return '<option' + (n === ui.len ? " selected" : "") + '>' + n + '</option>'; }).join("") + '</select></label>' +
            '</div>' +
            '<div class="field" style="margin-bottom:8px">Direction</div>' +
            '<div class="chips" id="s-dir" style="margin-bottom:16px">' +
              ch("dir", "en-ur", "English → Roman Urdu") + ch("dir", "ur-en", "Roman Urdu → English") + ch("dir", "both", "Both") + '</div>' +
            '<div class="field" style="margin-bottom:8px">Answer style</div>' +
            '<div class="chips" id="s-style" style="margin-bottom:20px">' +
              ch("style", "mc", "Multiple choice") + ch("style", "type", "Type the answer") + ch("style", "mix", "Mix") + '</div>' +
            '<button class="btn btn-primary btn-lg" type="button" id="start" style="width:100%">Start quiz</button>' +
            '<p class="muted" id="s-note" style="font-size:14px;margin:10px 0 0"></p>' +
          '</div>' + history();

        const note = el.querySelector("#s-note");
        const refresh = function () {
          const n = scopeWords().length;
          note.textContent = n ? n + " word" + (n === 1 ? "" : "s") + " in this set." : "No words in this set yet: pick another.";
          el.querySelector("#start").disabled = n === 0;
        };
        el.querySelector("#s-scope").addEventListener("change", function (e) { ui.scope = e.target.value; refresh(); });
        el.querySelector("#s-len").addEventListener("change", function (e) { ui.len = +e.target.value; });
        el.querySelectorAll("[data-k]").forEach(function (b) {
          b.addEventListener("click", function () {
            ui[b.dataset.k] = b.dataset.v;
            el.querySelectorAll('[data-k="' + b.dataset.k + '"]').forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          });
        });
        el.querySelector("#start").addEventListener("click", function () { begin(App.shuffle(scopeWords()).slice(0, ui.len)); });
        refresh();
      }
      function ch(k, v, label) { return '<button class="chip" type="button" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (ui[k] === v) + '">' + label + '</button>'; }
      function history() {
        const qz = App.progress.quizzes.slice(-5).reverse();
        if (!qz.length) return "";
        return '<div class="card quiz-card" style="margin-top:14px"><h3>Recent quizzes</h3>' +
          qz.map(function (q) { return '<div class="miss"><span>' + q.d + '</span><b>' + q.s + ' / ' + q.t + '</b></div>'; }).join("") + '</div>';
      }

      function begin(words) {
        qs = words.map(function (w) {
          const dir = ui.dir === "both" ? (Math.random() < 0.5 ? "en-ur" : "ur-en") : ui.dir;
          let style = ui.style === "mix" ? (Math.random() < 0.5 ? "mc" : "type") : ui.style;
          const field = dir === "en-ur" ? "roman" : "english";
          const d = pickDistractors(w, field);
          if (style === "mc" && d.length < 3) style = "type";
          return { w: w, dir: dir, style: style, opts: style === "mc" ? App.shuffle([w].concat(d)) : null };
        });
        i = 0; score = 0; missed = [];
        ask();
      }

      function ask() {
        if (i >= qs.length) return results();
        answered = false;
        const q = qs[i], w = q.w, enUr = q.dir === "en-ur";
        el.innerHTML =
          '<div class="card quiz-card">' +
            '<div class="q-top"><span class="muted" style="font-weight:600">' + (i + 1) + ' / ' + qs.length + '</span>' +
              '<div class="bar"><i style="width:' + Math.round((i / qs.length) * 100) + '%"></i></div>' +
              '<span class="badge">✓ ' + score + '</span></div>' +
            '<div class="q-prompt-k">' + (enUr ? "Say it in Roman Urdu" : "What does this mean in English?") + '</div>' +
            '<div class="q-prompt' + (enUr ? "" : " roman") + '">' + esc(enUr ? w.english : w.roman) + '</div>' +
            (!enUr ? '<div class="muted" style="font-size:14px">sounds like: ' + esc(w.sounds) + '</div>' : '') +
            (q.style === "mc"
              ? '<div class="options">' + q.opts.map(function (o, k) {
                  return '<button class="opt" type="button" data-id="' + o.id + '"><span class="n">' + (k + 1) + '</span>' + esc(enUr ? o.roman : o.english) + '</button>';
                }).join("") + '</div>'
              : '<input class="answer-input" id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (enUr ? "Type in Roman Urdu…" : "Type the English meaning…") + '" aria-label="Your answer">' +
                '<div class="row" style="margin-top:12px"><button class="btn btn-primary" type="button" id="check">Check</button><button class="btn btn-ghost" type="button" id="skip">I don\'t know</button></div>') +
            '<div class="feedback" id="fb" aria-live="polite"></div>' +
          '</div>';
        if (q.style === "mc") {
          el.querySelectorAll(".opt").forEach(function (b) { b.addEventListener("click", function () { chooseMC(b); }); });
        } else {
          const inp = el.querySelector("#ans");
          inp.focus();
          el.querySelector("#check").addEventListener("click", checkTyped);
          el.querySelector("#skip").addEventListener("click", function () { inp.value = ""; finishQ(false, "", true); });
        }
      }

      function chooseMC(btn) {
        if (answered) return;
        const q = qs[i], ok = btn.dataset.id === q.w.id;
        el.querySelectorAll(".opt").forEach(function (b) {
          b.disabled = true;
          if (b.dataset.id === q.w.id) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");
        finishQ(ok, "exact");
      }

      function checkTyped() {
        if (answered) return;
        const q = qs[i], inp = el.querySelector("#ans");
        if (!inp.value.trim()) { inp.focus(); return; }
        const res = q.dir === "en-ur" ? App.checkRoman(inp.value, q.w) : App.checkEnglish(inp.value, q.w);
        finishQ(!!res, res);
      }

      function finishQ(ok, how, skipped) {
        answered = true;
        const q = qs[i], w = q.w, enUr = q.dir === "en-ur";
        const inp = el.querySelector("#ans");
        if (inp) { inp.disabled = true; inp.classList.add(ok ? "correct" : "wrong"); }
        const acts = el.querySelector("#check");
        if (acts) acts.parentElement.remove();
        App.record(w.id, ok);
        App.updateHeader();
        if (ok) score++; else missed.push(q);
        const right = enUr ? w.roman : w.english;
        const fb = el.querySelector("#fb");
        fb.className = "feedback show " + (ok ? "good" : "bad");
        fb.innerHTML =
          (ok ? (how === "close" ? "<b>Close enough!</b> The usual spelling is:" : "<b>Sahi!</b> (correct)")
              : (skipped ? "<b>The answer is:</b>" : "<b>Not quite.</b> The answer is:")) +
          ((!ok || how === "close" || q.style === "type") ? '<div class="ans">' + esc(right) + '</div>' : '') +
          '<div class="muted" style="font-size:14px;margin-top:4px">' + esc(w.roman) + ' = ' + esc(w.english) + ' · sounds like ' + esc(w.sounds) + '</div>' +
          '<div class="row" style="margin-top:12px">' +
            '<button class="btn btn-primary" type="button" id="next">' + (i + 1 < qs.length ? "Next" : "See results") + ' →</button>' +
            (!ok && inp && !skipped ? '<button class="btn btn-ghost" type="button" id="override">I was right</button>' : '') +
          '</div>';
        const next = fb.querySelector("#next");
        next.addEventListener("click", function () { i++; ask(); });
        const ov = fb.querySelector("#override");
        if (ov) ov.addEventListener("click", function () {
          App.record(w.id, true); score++; missed.pop(); App.updateHeader();
          ov.remove(); fb.className = "feedback show good";
          fb.querySelector("b").textContent = "Counted as correct."; App.toast("Counted as correct");
          next.focus();
        });
        setTimeout(function () { next.focus(); }, 30);
      }

      function results() {
        App.logQuiz(score, qs.length);
        const pct = Math.round((score / qs.length) * 100);
        const msg = pct >= 90 ? "Zabardast! (fantastic)" : pct >= 70 ? "Bahut achha! (very good)" : pct >= 40 ? "Achhi koshish! (good effort)" : "Koi baat nahin, keep going!";
        el.innerHTML = '<div class="card quiz-card" style="text-align:center">' +
          '<div class="score-big">' + score + ' / ' + qs.length + '</div>' +
          '<h2 style="margin-top:10px">' + msg + '</h2><p class="muted">' + pct + '% correct</p>' +
          '<div class="row" style="justify-content:center;margin-top:10px">' +
            (missed.length ? '<button class="btn btn-primary btn-lg" type="button" id="retry">Retry the ' + missed.length + ' I missed</button>' : '') +
            '<button class="btn btn-lg" type="button" id="again">New quiz</button>' +
          '</div>' +
          (missed.length ? '<h3 style="margin-top:22px;text-align:left">Words to practise</h3><div class="miss-list">' +
            missed.map(function (q) { return '<div class="miss"><b>' + esc(q.w.roman) + '</b><span>' + esc(q.w.english) + '</span></div>'; }).join("") + '</div>' : '') +
          '</div>';
        const r = el.querySelector("#retry");
        if (r) r.addEventListener("click", function () { begin(App.shuffle(missed.map(function (q) { return q.w; }))); });
        el.querySelector("#again").addEventListener("click", setup);
      }

      function onKey(e) {
        if (!qs.length || i >= qs.length || !el.querySelector(".q-prompt")) return;
        const q = qs[i];
        if (e.key === "Enter") {
          if (e.target.closest("button")) return;
          e.preventDefault();
          if (answered) { i++; ask(); }
          else if (q.style === "type") checkTyped();
        } else if (!answered && q.style === "mc" && /^[1-4]$/.test(e.key)) {
          const b = el.querySelectorAll(".opt")[+e.key - 1];
          if (b) chooseMC(b);
        }
      }
      document.addEventListener("keydown", onKey);
      setup();
      return function () { document.removeEventListener("keydown", onKey); };
    }
  };
})();
