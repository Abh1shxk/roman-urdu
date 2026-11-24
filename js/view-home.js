/* Home: word of the day, daily goal, quick actions, categories. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;

  App.views.home = {
    render: function (el) {
      const w = App.wordOfDay();
      const goal = App.progress.settings.goal;
      const done = App.todayCount();
      const pct = Math.min(100, Math.round((done / goal) * 100));
      const due = App.dueWords().length;
      const learned = App.learnedCount();
      const total = App.words.length;
      const started = Object.keys(App.progress.words).length;
      const isNew = started === 0;

      el.innerHTML =
        '<h1>' + (isNew ? "Khush aamdeed! <span class='muted' style='font-size:.6em'>(welcome)</span>" : "Seekhte raho! <span class='muted' style='font-size:.6em'>(keep learning)</span>") + '</h1>' +
        '<p class="lead">Learn Urdu using only English letters. ' + total + ' words and phrases, flashcards that space out your reviews, and quizzes that forgive spelling variants like <b>mohabbat / muhabbat</b>.</p>' +
        (isNew ? '<div class="callout">New here? Spend two minutes on the <a href="#guide">Sounds guide</a> so the spellings make sense, then start with <a href="#cards-greetings">Greetings flashcards</a>.</div>' : '') +
        '<section class="hero">' +
          '<div class="card wotd">' +
            '<div class="k">Word of the day</div>' +
            '<div class="roman">' + esc(w.roman) + '</div>' +
            '<div class="eng">' + esc(w.english) + '</div>' +
            '<div class="snd">Sounds like: <b>' + esc(w.sounds) + '</b></div>' +
            '<div class="row" style="margin-top:14px">' +
              '<button class="btn" id="wotd-learn" type="button" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.35)">' + (App.isLearned(w.id) ? "✓ Learned" : "Mark as learned") + '</button>' +
              '<a class="btn" href="#learn-' + w.cat + '" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35);text-decoration:none">More ' + esc(App.cat(w.cat).name) + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="goal-ring">' +
              '<div class="ring" style="--p:' + pct + '"><span>' + pct + '%</span></div>' +
              '<div><div class="muted" style="font-weight:600">Today\'s goal</div>' +
              '<div class="big-num">' + done + ' / ' + goal + '</div>' +
              '<div class="muted" style="font-size:14px">answers today · 🔥 ' + App.streak() + ' day streak</div></div>' +
            '</div>' +
            '<div class="grid" style="margin-top:16px">' +
              (due ? '<button class="btn btn-primary btn-lg" type="button" data-go="cards-due">Review ' + due + ' due word' + (due === 1 ? "" : "s") + '</button>'
                   : '<button class="btn btn-primary btn-lg" type="button" data-go="cards-new">Learn new words</button>') +
              '<button class="btn btn-lg" type="button" data-go="quiz">Take a quick quiz</button>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="grid grid-3" style="margin-top:14px">' +
          stat("Words learned", learned, "of " + total) +
          stat("In progress", Math.max(0, started - learned), "being practised") +
          stat("Due for review", due, due ? "ready now" : "all caught up") +
        '</section>' +
        '<h2>Categories</h2>' +
        '<div class="cat-grid">' + App.categories.map(tile).join("") + '</div>';

      el.querySelectorAll("[data-go]").forEach(function (b) {
        b.addEventListener("click", function () { App.go(b.dataset.go); });
      });
      el.querySelectorAll(".cat-tile").forEach(function (b) {
        b.addEventListener("click", function () { App.go("learn-" + b.dataset.cat); });
      });
      el.querySelector("#wotd-learn").addEventListener("click", function (e) {
        App.toggleLearned(w.id);
        e.currentTarget.textContent = App.isLearned(w.id) ? "✓ Learned" : "Mark as learned";
        App.updateHeader();
      });
    }
  };

  function stat(label, num, sub) {
    return '<div class="card"><div class="muted" style="font-weight:600;font-size:14px">' + label + '</div>' +
      '<div class="big-num">' + num + '</div><div class="muted" style="font-size:13px">' + sub + '</div></div>';
  }
  function tile(c) {
    const l = App.learnedCount(c.words);
    const pct = Math.round((l / c.words.length) * 100);
    return '<button class="cat-tile" type="button" data-cat="' + c.id + '">' +
      '<span class="t"><span class="em" aria-hidden="true">' + c.icon + '</span>' + esc(c.name) + '</span>' +
      '<span class="meta">' + l + ' / ' + c.words.length + ' learned</span>' +
      '<span class="bar"><i style="width:' + pct + '%"></i></span></button>';
  }
})();
