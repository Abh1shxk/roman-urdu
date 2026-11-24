/* Search: English -> Roman Urdu dictionary (and Roman Urdu -> English), typo-tolerant, with pure Urdu synonyms. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;
  const RECENT_KEY = "romanUrdu.recentSearches";
  const TRY = ["love", "thank you", "water", "beautiful", "friend", "remorse", "dream", "how are you"];

  function getRecent() {
    try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(r) ? r.slice(0, 8) : []; } catch (e) { return []; }
  }
  function addRecent(q) {
    q = q.trim().toLowerCase();
    if (!q) return;
    const r = getRecent().filter(function (x) { return x !== q; });
    r.unshift(q);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8))); } catch (e) { /* storage unavailable */ }
  }

  App.views.translate = {
    render: function (el, param) {
      el.innerHTML =
        '<h1>Search</h1>' +
        '<p class="lead">Type an English word to see it in Urdu, or a Roman Urdu word to see what it means. Typos and spelling variants are fine.</p>' +
        '<form class="search-hero" id="sf" role="search">' + App.icon("search") +
          '<input id="tq" type="search" placeholder="e.g. love, water, thank you…" aria-label="Search an English or Roman Urdu word" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          '<button class="icon-btn clear" type="button" id="tclear" aria-label="Clear search">' + App.icon("x") + '</button>' +
        '</form>' +
        '<div id="tout" aria-live="polite"></div>';

      const input = el.querySelector("#tq");
      const out = el.querySelector("#tout");
      const form = el.querySelector("#sf");
      let timer = null, recentTimer = null;

      function draw() {
        const q = input.value.trim();
        form.classList.toggle("has-text", !!q);
        clearTimeout(recentTimer);
        if (!q) return drawEmpty();
        const r = App.search(q, 24);
        if (!r.en.length && !r.ur.length) {
          const sug = App.suggest(q);
          out.innerHTML = '<div class="card empty" style="margin-top:20px"><h3>No match for “' + esc(q) + '”</h3>' +
            (sug.length ? '<p>Did you mean:</p><div class="chips" style="justify-content:center">' + sug.map(function (s) { return '<button class="chip" type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join("") + '</div>'
                        : '<p>Try a simpler or more common word, or <a href="#learn">browse all words</a>.</p>') + '</div>';
          return;
        }
        let html = "";
        const enFirst = r.en.length && (!r.ur.length || r.en[0].score >= r.ur[0].score);
        if (enFirst) {
          const main = r.en[0].w;
          html += mainCard(main, "“" + q + "” in Urdu");
          const others = r.en.slice(1);
          const everyday = others.filter(function (x) { return x.w.group !== "adabi"; });
          const adabi = others.filter(function (x) { return x.w.group === "adabi"; });
          if (everyday.length) html += list("More translations", everyday);
          if (adabi.length) html += list("In pure Urdu", adabi, "Literary words with a similar meaning");
          if (r.ur.length) html += list("Roman Urdu words like “" + q + "”", r.ur);
        } else {
          html += mainCard(r.ur[0].w, "“" + q + "” means");
          if (r.ur.length > 1) html += list("Similar Roman Urdu words", r.ur.slice(1));
          if (r.en.length) html += list("English matches", r.en);
        }
        out.innerHTML = html;
        recentTimer = setTimeout(function () { addRecent(q); }, 1500);
      }

      function mainCard(w, from) {
        const c = App.cat(w.cat);
        return '<div class="result-main' + (w.group === "adabi" ? " adabi" : "") + '">' +
          App.starBtn(w.id) +
          '<div class="from">' + esc(from) + '</div>' +
          '<div class="roman">' + esc(w.roman) + '</div>' +
          '<div class="eng">' + esc(w.english) + '</div>' +
          '<div class="snd">sounds like <b>' + esc(w.sounds) + '</b>' + (w.plain ? ' · everyday word: <b>' + esc(w.plain) + '</b>' : '') + '</div>' +
          (w.example ? '<div class="ex"><i>' + esc(w.example.ur) + '</i><span>' + esc(w.example.en) + '</span></div>' : '') +
          (w.note ? '<div class="muted" style="margin-top:6px;font-size:14px">' + esc(w.note) + '</div>' : '') +
          '<div class="row"><button class="btn" type="button" data-word="' + w.id + '">Details</button>' +
          '<button class="btn btn-ghost" type="button" data-cards="' + w.cat + '">Practise ' + esc(c.name) + ' ' + App.icon("arrow") + '</button>' +
          '<span class="spacer"></span><span class="badge' + (w.group === "adabi" ? " adabi" : "") + '">' + esc(c.icon + " " + c.name) + '</span></div></div>';
      }
      function list(title, rows, sub) {
        return '<div class="results-head"><h3>' + esc(title) + '</h3>' + (sub ? '<span class="muted" style="font-size:13.5px">' + esc(sub) + '</span>' : '') + '</div>' +
          '<div class="res-list">' + rows.map(function (x) {
            const w = x.w;
            return '<button class="res' + (w.group === "adabi" ? " adabi" : "") + '" type="button" data-word="' + w.id + '">' +
              '<span><span class="roman">' + esc(w.roman) + '</span><span class="eng">' + esc(w.english) + '</span></span>' +
              App.icon("arrow") + '</button>';
          }).join("") + '</div>';
      }
      function drawEmpty() {
        const recent = getRecent();
        out.innerHTML =
          '<div class="try"><span class="muted">Try:</span>' + TRY.map(function (t) { return '<button class="chip" type="button" data-q="' + esc(t) + '">' + esc(t) + '</button>'; }).join("") + '</div>' +
          (recent.length ? '<div class="results-head"><h3>Recent searches</h3><span class="spacer"></span><button class="btn btn-ghost" type="button" id="clr-recent">Clear</button></div>' +
            '<div class="recent">' + recent.map(function (t) { return '<button class="chip" type="button" data-q="' + esc(t) + '">' + App.icon("clock") + esc(t) + '</button>'; }).join("") + '</div>' : '') +
          '<div class="card" style="margin-top:22px"><h3>Tip</h3><p class="muted" style="margin:0">Press <kbd>/</kbd> anywhere in the app to jump straight to search. Results are marked when they are <span class="roman" style="color:var(--accent);font-style:italic">pure Urdu</span> words.</p></div>';
      }

      input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(draw, 110); });
      form.addEventListener("submit", function (e) { e.preventDefault(); draw(); addRecent(input.value); input.blur(); });
      el.querySelector("#tclear").addEventListener("click", function () { input.value = ""; draw(); input.focus(); });
      out.addEventListener("click", function (e) {
        const q = e.target.closest("[data-q]");
        if (q) { input.value = q.dataset.q; draw(); addRecent(q.dataset.q); return; }
        const cards = e.target.closest("[data-cards]");
        if (cards) { App.go("cards-" + cards.dataset.cards); return; }
        if (e.target.closest("#clr-recent")) { try { localStorage.removeItem(RECENT_KEY); } catch (err) { /* ignore */ } draw(); }
      });
      App.bindWordClicks(out);

      if (param) input.value = param;
      draw();
      if (!param) setTimeout(function () { input.focus(); }, 30);
    }
  };
})();
