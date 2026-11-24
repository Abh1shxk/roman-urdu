/* Words: browse and search the vocabulary, mark words as learned. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;
  const ui = { q: "", filter: "all" };

  App.views.learn = {
    render: function (el, param) {
      const cat = App.cat(param) ? param : "all";
      el.innerHTML =
        '<h1>Words &amp; Phrases</h1>' +
        '<p class="lead">Browse all ' + App.words.length + ' entries. Tap <b>Mark learned</b> on words you already know; flashcards and quizzes mark the rest for you.</p>' +
        '<div class="toolbar">' +
          '<input type="search" id="q" placeholder="Search English or Roman Urdu…" aria-label="Search words" value="' + esc(ui.q) + '">' +
          '<select id="cat" aria-label="Category"><option value="all">All categories</option>' +
            App.categories.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat ? " selected" : "") + '>' + c.icon + " " + esc(c.name) + '</option>'; }).join("") +
          '</select>' +
        '</div>' +
        '<div class="row" style="margin-bottom:16px">' +
          '<div class="chips" role="group" aria-label="Filter">' +
            chip("all", "All") + chip("new", "Not started") + chip("learning", "Learning") + chip("learned", "Learned") +
          '</div><span class="spacer"></span>' +
          '<button class="btn" type="button" id="to-cards">🃏 Flashcards</button>' +
          '<button class="btn" type="button" id="to-quiz">🎯 Quiz</button>' +
        '</div>' +
        '<div id="list"></div>';

      const q = el.querySelector("#q");
      const sel = el.querySelector("#cat");
      q.addEventListener("input", function () { ui.q = q.value; draw(el, sel.value); });
      sel.addEventListener("change", function () { App.setHash("#learn" + (sel.value === "all" ? "" : "-" + sel.value)); draw(el, sel.value); });
      el.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          ui.filter = b.dataset.f;
          el.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          draw(el, sel.value);
        });
      });
      el.querySelector("#to-cards").addEventListener("click", function () { App.go("cards-" + sel.value); });
      el.querySelector("#to-quiz").addEventListener("click", function () { App.go("quiz-" + sel.value); });
      el.querySelector("#list").addEventListener("click", function (e) {
        const b = e.target.closest(".learn-btn");
        if (!b) return;
        App.toggleLearned(b.dataset.id);
        const on = App.isLearned(b.dataset.id);
        b.setAttribute("aria-pressed", String(on));
        b.textContent = on ? "✓ Learned" : "Mark learned";
        const badge = b.parentElement.querySelector(".badge");
        if (badge) badge.outerHTML = statusBadge(b.dataset.id);
        App.updateHeader();
      });
      draw(el, cat);
    }
  };

  function chip(f, label) {
    return '<button class="chip" type="button" data-f="' + f + '" aria-pressed="' + (ui.filter === f) + '">' + label + '</button>';
  }

  function matches(w, q) {
    if (!q) return true;
    const ql = q.toLowerCase().trim();
    if (w.english.toLowerCase().indexOf(ql) >= 0) return true;
    if (w.roman.toLowerCase().indexOf(ql) >= 0) return true;
    if (w.variants.some(function (v) { return v.toLowerCase().indexOf(ql) >= 0; })) return true;
    const n = App.normRoman(q);
    return n.length >= 3 && App.normRoman(w.roman).indexOf(n) >= 0;
  }
  function passFilter(w) {
    if (ui.filter === "new") return !App.isStarted(w.id);
    if (ui.filter === "learning") return App.isStarted(w.id) && !App.isLearned(w.id);
    if (ui.filter === "learned") return App.isLearned(w.id);
    return true;
  }

  function draw(el, cat) {
    const list = el.querySelector("#list");
    const cats = cat === "all" ? App.categories : [App.cat(cat)];
    let html = "", count = 0;
    cats.forEach(function (c) {
      const ws = c.words.filter(function (w) { return matches(w, ui.q) && passFilter(w); });
      if (!ws.length) return;
      count += ws.length;
      html += '<div class="cat-head"><span class="em" aria-hidden="true">' + c.icon + '</span><div><h2>' + esc(c.name) + '</h2>' +
        '<div class="muted" style="font-size:14px">' + esc(c.blurb) + '</div></div></div>' +
        '<div class="word-list">' + ws.map(card).join("") + '</div>';
    });
    list.innerHTML = count ? html : '<div class="empty card">No words match. Try another search or filter.</div>';
  }

  function statusBadge(id) {
    if (App.isLearned(id)) return '<span class="badge learned">learned</span>';
    if (App.isDue(id)) return '<span class="badge due">due</span>';
    if (App.isStarted(id)) return '<span class="badge learning">learning</span>';
    return '<span class="badge">new</span>';
  }

  function card(w) {
    const on = App.isLearned(w.id);
    const alts = w.variants.filter(function (v) { return v.toLowerCase() !== w.roman.toLowerCase(); }).slice(0, 3);
    const tips = App.soundTips(w.sounds);
    return '<article class="word">' +
      '<div><div class="roman">' + esc(w.roman) + '</div><div class="eng">' + esc(w.english) + '</div></div>' +
      '<div class="row" style="justify-content:flex-end;gap:6px">' + statusBadge(w.id) +
        '<button class="learn-btn" type="button" data-id="' + w.id + '" aria-pressed="' + on + '">' + (on ? "✓ Learned" : "Mark learned") + '</button></div>' +
      '<div style="grid-column:1/-1">' +
        '<div class="snd">Sounds like: <b>' + esc(w.sounds) + '</b></div>' +
        (tips.length ? '<div class="tips">' + tips.map(function (t) { return '<span class="tip">' + esc(t) + '</span>'; }).join("") + '</div>' : '') +
        (alts.length ? '<div class="alt">Also written: ' + alts.map(esc).join(", ") + '</div>' : '') +
        (w.note ? '<div class="note">' + esc(w.note) + '</div>' : '') +
      '</div></article>';
  }
})();
