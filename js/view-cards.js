/* Flashcards with spaced repetition. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;
  const ui = { dir: "en-ur" };
  const ROUND = 20;

  function setOptions(sel) {
    return App.scopeOptions(sel, [
      ["due", "Due for review (" + App.dueWords().length + ")"],
      ["new", "New words"],
      ["learning", "Words I'm learning"]
    ]);
  }

  function buildDeck(scope) {
    let ws = App.wordsFor(scope);
    if (scope === "new") return ws.slice(0, ROUND);
    if (scope === "due") return App.shuffle(ws).slice(0, ROUND);
    const due = ws.filter(function (w) { return App.isDue(w.id); });
    const fresh = ws.filter(function (w) { return !App.isStarted(w.id); });
    const rest = ws.filter(function (w) { return App.isStarted(w.id) && !App.isDue(w.id); });
    const notLearned = rest.filter(function (w) { return !App.isLearned(w.id); });
    const learned = rest.filter(function (w) { return App.isLearned(w.id); });
    return App.shuffle(due).concat(fresh, App.shuffle(notLearned), App.shuffle(learned)).slice(0, ROUND);
  }

  App.views.cards = {
    render: function (el, param) {
      let scope = param || (App.dueWords().length ? "due" : "new");
      let deck = [], i = 0, flipped = false, knew = 0, again = 0, requeued = {};

      el.innerHTML = App.practiceSwitch("cards") +
        '<h1>Flashcards</h1>' +
        '<p class="lead">Say the answer in your head, flip the card, then be honest. Words you miss come back sooner; words you know wait longer.</p>' +
        '<div class="toolbar">' +
          '<select id="scope" aria-label="Which words">' + setOptions(scope) + '</select>' +
          '<div class="chips" role="group" aria-label="Direction">' +
            '<button class="chip" type="button" data-dir="en-ur" aria-pressed="' + (ui.dir === "en-ur") + '">English → Urdu</button>' +
            '<button class="chip" type="button" data-dir="ur-en" aria-pressed="' + (ui.dir === "ur-en") + '">Urdu → English</button>' +
          '</div>' +
        '</div>' +
        '<div id="stage"></div>';

      const stage = el.querySelector("#stage");
      el.querySelector("#scope").addEventListener("change", function (e) { scope = e.target.value; App.setHash("#cards-" + scope); start(); });
      el.querySelectorAll("[data-dir]").forEach(function (b) {
        b.addEventListener("click", function () {
          ui.dir = b.dataset.dir;
          el.querySelectorAll("[data-dir]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          b.blur(); // so Space flips the card instead of re-pressing this chip
          show();
        });
      });

      function start() {
        deck = buildDeck(scope); i = 0; knew = 0; again = 0; requeued = {};
        if (!deck.length) {
          stage.innerHTML = '<div class="card empty"><h3>Nothing here right now</h3><p>' +
            (scope === "due" ? "No words are due for review. Nice work!" : scope === "learning" ? "You haven't started any words yet." :
             scope === "saved" ? "You haven't saved any words yet. Tap the ☆ on any word card to save it." : "No words in this set.") +
            '</p><button class="btn btn-primary" type="button" id="go-new">Learn new words</button></div>';
          stage.querySelector("#go-new").addEventListener("click", function () { App.go("cards-new"); });
          return;
        }
        show();
      }

      function show() {
        if (!deck.length) return;
        if (i >= deck.length) return finish();
        const w = deck[i];
        flipped = false;
        const enFirst = ui.dir === "en-ur";
        const front = enFirst
          ? '<div class="k">English</div><div class="main">' + esc(w.english) + '</div>'
          : '<div class="k">Roman Urdu</div><div class="main roman">' + esc(w.roman) + '</div>';
        const back = enFirst
          ? '<div class="k">Roman Urdu</div><div class="main roman">' + esc(w.roman) + '</div><div class="snd">' + esc(w.sounds) + '</div>'
          : '<div class="k">English</div><div class="main">' + esc(w.english) + '</div><div class="snd">' + esc(w.sounds) + '</div>';
        const alts = w.variants.slice(0, 2);
        stage.innerHTML =
          '<div class="q-top"><span class="muted" style="font-weight:600">' + (i + 1) + ' / ' + deck.length + '</span>' +
            '<div class="bar"><i style="width:' + Math.round((i / deck.length) * 100) + '%"></i></div>' +
            '<span class="badge">' + esc(App.cat(w.cat).icon + " " + App.cat(w.cat).name) + '</span></div>' +
          '<div class="flash-wrap"><button class="flash" type="button" id="flash" aria-label="Flip card">' +
            '<div class="face front">' + front + '<div class="hint">Tap or press Space to flip</div></div>' +
            '<div class="face back">' + back +
              (alts.length ? '<div class="muted" style="font-size:13px">also: ' + alts.map(esc).join(", ") + '</div>' : '') +
              (w.note ? '<div class="muted" style="font-size:13px;font-style:italic;max-width:420px">' + esc(w.note) + '</div>' : '') +
            '</div>' +
          '</button></div>' +
          '<div class="flash-actions" id="acts">' +
            '<button class="btn btn-primary btn-lg" type="button" id="flip">Show answer</button>' +
          '</div>' +
          '<div class="kbd"><kbd>Space</kbd> flip · <kbd>1</kbd> didn\'t know · <kbd>2</kbd> knew it</div>';
        stage.querySelector("#flash").addEventListener("click", flip);
        stage.querySelector("#flip").addEventListener("click", flip);
      }

      function flip() {
        const card = stage.querySelector("#flash");
        if (!card) return;
        flipped = !flipped;
        card.classList.toggle("flipped", flipped);
        if (flipped && !stage.querySelector("#knew")) {
          stage.querySelector("#acts").innerHTML =
            '<button class="btn btn-bad btn-lg" type="button" id="again">✗ Didn\'t know</button>' +
            '<button class="btn btn-good btn-lg" type="button" id="knew">✓ Knew it</button>';
          stage.querySelector("#again").addEventListener("click", function () { answer(false); });
          stage.querySelector("#knew").addEventListener("click", function () { answer(true); });
        }
      }

      function answer(ok) {
        const w = deck[i];
        App.record(w.id, ok);
        if (ok) knew++;
        else {
          again++;
          if (!requeued[w.id]) { requeued[w.id] = true; deck.splice(Math.min(deck.length, i + 4), 0, w); }
        }
        App.updateHeader();
        i++;
        show();
      }

      function finish() {
        const learnedNow = App.learnedCount(deck);
        stage.innerHTML = '<div class="card quiz-card" style="text-align:center">' +
          '<div style="font-size:44px">🎉</div><h2 style="margin-top:6px">Round complete. Shaabaash!</h2>' +
          '<p class="muted">' + knew + ' known · ' + again + ' to practise again · ' + learnedNow + ' of these now learned</p>' +
          '<div class="row" style="justify-content:center;margin-top:12px">' +
            '<button class="btn btn-primary btn-lg" type="button" id="more">Another round</button>' +
            '<button class="btn btn-lg" type="button" id="quiz">Quiz me on these</button>' +
          '</div></div>';
        const ids = deck.map(function (w) { return w.id; });
        stage.querySelector("#more").addEventListener("click", start);
        stage.querySelector("#quiz").addEventListener("click", function () { App.pendingQuizIds = ids; App.go("quiz-custom"); });
      }

      function onKey(e) {
        if (e.target.matches("input, select, textarea")) return;
        if (!stage.querySelector("#flash")) return;
        if ((e.key === " " || e.key === "Enter") && e.target.closest("button")) return; // the focused button handles it
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
        else if (flipped && (e.key === "1" || e.key === "ArrowLeft")) answer(false);
        else if (flipped && (e.key === "2" || e.key === "ArrowRight")) answer(true);
      }
      document.addEventListener("keydown", onKey);
      start();
      return function () { document.removeEventListener("keydown", onKey); };
    }
  };
})();
