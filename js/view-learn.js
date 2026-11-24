/* Words: browse and filter the everyday vocabulary (pure Urdu has its own screen). Tap a card for details. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;
  const ui = { q: "", filter: "all" };

  App.views.learn = {
    render: function (el, param) {
      const cat = App.cat(param) ? param : "everyday";
      el.innerHTML =
        '<h1>Everyday words</h1>' +
        '<p class="lead">' + App.wordsFor("everyday").length + ' words and phrases for daily life. Tap a card for details, or the star to save it for practice.</p>' +
        '<div class="toolbar">' +
          '<input type="search" id="q" placeholder="Filter by English or Roman Urdu…" aria-label="Filter words" value="' + esc(ui.q) + '">' +
          '<select id="cat" aria-label="Category">' +
            '<option value="everyday"' + (cat === "everyday" ? " selected" : "") + '>All everyday categories</option>' +
            '<optgroup label="Everyday Urdu">' + App.groups.everyday.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat ? " selected" : "") + '>' + c.icon + " " + esc(c.name) + '</option>'; }).join("") + '</optgroup>' +
            '<optgroup label="Pure Urdu">' + App.groups.adabi.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat ? " selected" : "") + '>' + c.icon + " " + esc(c.name) + '</option>'; }).join("") + '</optgroup>' +
          '</select>' +
        '</div>' +
        '<div class="row" style="margin-bottom:6px">' +
          '<div class="chips" role="group" aria-label="Show">' +
            chip("all", "All") + chip("new", "Not started") + chip("learning", "Learning") + chip("learned", "Learned") + chip("saved", "★ Saved") +
          '</div><span class="spacer"></span>' +
          '<button class="btn" type="button" id="to-cards">' + App.icon("layers") + 'Flashcards</button>' +
          '<button class="btn" type="button" id="to-quiz">' + App.icon("target") + 'Quiz</button>' +
        '</div>' +
        '<div id="list"></div>';

      const q = el.querySelector("#q");
      const sel = el.querySelector("#cat");
      const list = el.querySelector("#list");
      q.addEventListener("input", function () { ui.q = q.value; draw(); });
      sel.addEventListener("change", function () { App.setHash("#learn" + (sel.value === "everyday" ? "" : "-" + sel.value)); draw(); });
      el.querySelectorAll(".chip").forEach(function (b) {
        b.addEventListener("click", function () {
          ui.filter = b.dataset.f;
          el.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          draw();
        });
      });
      el.querySelector("#to-cards").addEventListener("click", function () { App.go("cards-" + sel.value); });
      el.querySelector("#to-quiz").addEventListener("click", function () { App.go("quiz-" + sel.value); });
      App.bindWordClicks(list, function () { if (ui.filter === "saved" || ui.filter !== "all") draw(); });

      function draw() {
        const cats = sel.value === "everyday" ? App.groups.everyday : [App.cat(sel.value)];
        let html = "", count = 0;
        cats.forEach(function (c) {
          const ws = c.words.filter(function (w) { return matches(w, ui.q) && passFilter(w); });
          if (!ws.length) return;
          count += ws.length;
          html += '<div class="cat-head"><span class="em" aria-hidden="true">' + c.icon + '</span><div style="min-width:0"><h2>' + esc(c.name) +
            (c.urdu ? '<span class="u">' + esc(c.urdu) + '</span>' : '') + '</h2>' +
            '<div class="muted" style="font-size:14px">' + esc(c.blurb) + '</div></div></div>' +
            '<div class="word-list">' + ws.map(function (w) { return App.wordCard(w, { example: c.group === "adabi" }); }).join("") + '</div>';
        });
        list.innerHTML = count ? html : '<div class="empty card" style="margin-top:16px">' +
          (ui.filter === "saved" ? "No saved words here yet. Tap the ☆ on any word to save it." : "No words match. Try another filter, or use <a href=\"#translate\">Search</a>.") + '</div>';
      }
      draw();
    }
  };

  function chip(f, label) {
    return '<button class="chip" type="button" data-f="' + f + '" aria-pressed="' + (ui.filter === f) + '">' + label + '</button>';
  }
  function matches(w, q) {
    if (!q) return true;
    const ql = q.toLowerCase().trim();
    if (w.english.toLowerCase().indexOf(ql) >= 0 || w.roman.toLowerCase().indexOf(ql) >= 0) return true;
    if (w.variants.some(function (v) { return v.toLowerCase().indexOf(ql) >= 0; })) return true;
    const n = App.normRoman(q);
    return n.length >= 3 && App.normRoman(w.roman).indexOf(n) >= 0;
  }
  function passFilter(w) {
    if (ui.filter === "new") return !App.isStarted(w.id);
    if (ui.filter === "learning") return App.isStarted(w.id) && !App.isLearned(w.id);
    if (ui.filter === "learned") return App.isLearned(w.id);
    if (ui.filter === "saved") return App.isSaved(w.id);
    return true;
  }
})();
