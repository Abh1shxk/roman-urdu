/* Home: search, today's goal, two words of the day, quick actions and all categories. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;

  App.views.home = {
    render: function (el) {
      const goal = App.progress.settings.goal;
      const done = App.todayCount();
      const pct = Math.min(100, Math.round((done / goal) * 100));
      const due = App.dueWords().length;
      const isNew = Object.keys(App.progress.words).length === 0;
      const w1 = App.wordOfDay("everyday"), w2 = App.wordOfDay("adabi");

      el.innerHTML =
        '<section class="hero-card">' +
          '<div class="eyebrow">' + (isNew ? "Khush aamdeed · welcome" : "Seekhte raho · keep learning") + '</div>' +
          '<h1>Learn Urdu in English letters</h1>' +
          '<p>' + App.wordsFor("everyday").length + ' everyday words and ' + App.wordsFor("adabi").length + ' pure Urdu words, all written in English letters, with flashcards and quizzes that forgive spelling variants.</p>' +
          '<form class="hero-search" id="hs" role="search">' + App.icon("search") +
            '<input id="hs-q" type="search" placeholder="Search a word, e.g. love" aria-label="Search an English or Roman Urdu word" autocomplete="off">' +
            '<button class="btn btn-primary" type="submit">Search</button></form>' +
        '</section>' +
        (isNew ? '<div class="callout">New here? Read the <a href="#guide">sounds guide</a> first (two minutes) so the spellings make sense, then try the <a href="#cards-greetings">greetings flashcards</a>.</div>' : '') +
        '<div class="quick">' +
          (due ? quick("cards-due", "clock", "", "Review " + due + " due", "Words ready for another look")
               : quick("cards-new", "layers", "", "Learn new words", "A round of 20 flashcards")) +
          quick("quiz", "target", "", "Quick quiz", "10 questions, both directions") +
          quick("adabi", "feather", "gold", "Pure Urdu", "Literary words like nadaamat and ulfat") +
        '</div>' +
        '<section class="grid grid-3" style="margin-top:14px">' +
          '<div class="card goal-card"><div class="ring" style="--p:' + pct + '"><span>' + pct + '%</span></div>' +
            '<div><div class="eyebrow">Today\'s goal</div><div class="big-num">' + done + ' / ' + goal + '</div>' +
            '<div class="muted" style="font-size:14px">answers · ' + App.streak() + ' day streak</div></div></div>' +
          wod(w1, "Word of the day") +
          wod(w2, "Pure Urdu word of the day") +
        '</section>' +
        '<div class="section-head"><h2>Everyday Urdu</h2><span class="spacer"></span><a href="#learn">Browse all</a></div>' +
        '<div class="cat-grid">' + App.groups.everyday.map(tile).join("") + '</div>' +
        '<div class="section-head"><h2>Pure Urdu</h2><span class="muted" style="font-size:14px">literary words of Persian and Arabic origin</span><span class="spacer"></span><a href="#adabi">Open</a></div>' +
        '<div class="cat-grid">' + App.groups.adabi.map(tile).join("") + '</div>';

      el.querySelector("#hs").addEventListener("submit", function (e) {
        e.preventDefault();
        const q = el.querySelector("#hs-q").value.trim();
        App.go("translate" + (q ? "-" + encodeURIComponent(q) : ""));
      });
      el.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { App.go(b.dataset.go); }); });
      el.querySelectorAll(".cat-tile").forEach(function (b) {
        b.addEventListener("click", function () { App.go((App.cat(b.dataset.cat).group === "adabi" ? "adabi-" : "learn-") + b.dataset.cat); });
      });
      App.bindWordClicks(el);
    }
  };

  function quick(go, icon, cls, title, sub) {
    return '<button type="button" data-go="' + go + '"><span class="qi ' + cls + '">' + App.icon(icon) + '</span><b>' + title + '</b><span>' + sub + '</span></button>';
  }
  function wod(w, label) {
    return '<div class="card wod' + (w.group === "adabi" ? " adabi" : "") + '" data-word="' + w.id + '" style="cursor:pointer" tabindex="0" role="button" aria-label="' + esc(label + ": " + w.roman) + '">' +
      App.starBtn(w.id) +
      '<div class="eyebrow">' + label + '</div>' +
      '<div class="roman">' + esc(w.roman) + '</div>' +
      '<div class="eng">' + esc(w.english) + '</div>' +
      '<div class="snd">sounds like ' + esc(w.sounds) + '</div></div>';
  }
  function tile(c) {
    const l = App.learnedCount(c.words);
    const pct = Math.round((l / c.words.length) * 100);
    return '<button class="cat-tile" type="button" data-cat="' + c.id + '">' +
      '<span class="t"><span class="em" aria-hidden="true">' + c.icon + '</span><span>' + esc(c.name) + (c.urdu ? '<span class="u">' + esc(c.urdu) + '</span>' : '') + '</span></span>' +
      '<span class="meta">' + l + ' / ' + c.words.length + ' learned</span>' +
      '<span class="bar"><i style="width:' + pct + '%"></i></span></button>';
  }
})();
