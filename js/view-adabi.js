/* Pure Urdu: literary (adabi) words of Persian and Arabic origin, grouped by theme, with everyday equivalents. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;

  App.views.adabi = {
    render: function (el, param) {
      const themes = App.groups.adabi;
      let theme = App.cat(param) && App.cat(param).group === "adabi" ? param : "all";
      const total = App.wordsFor("adabi").length;
      const learned = App.learnedCount(App.wordsFor("adabi"));

      el.innerHTML =
        '<section class="hero-card adabi-hero">' +
          '<div class="eyebrow">Adabi Urdu · ' + total + ' words</div>' +
          '<h1>Pure Urdu</h1>' +
          '<p>Literary words of Persian and Arabic origin: the language of ghazals, letters, speeches and old film songs. Each one is written in English letters, with the everyday word it replaces. Say <span class="roman">nadaamat</span> instead of pachhtaawa, or <span class="roman">ulfat</span> instead of pyaar.</p>' +
          '<div class="row" style="margin-top:18px">' +
            '<button class="btn btn-accent" type="button" data-go="cards-adabi">' + App.icon("layers") + 'Flashcards</button>' +
            '<button class="btn" type="button" data-go="quiz-adabi" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3)">' + App.icon("target") + 'Quiz</button>' +
            '<span style="color:rgba(255,255,255,.8);font-size:14px;margin-left:4px">' + learned + ' of ' + total + ' learned</span>' +
          '</div>' +
        '</section>' +
        '<div class="theme-bar"><div class="chips" role="group" aria-label="Theme">' +
          '<button class="chip" type="button" data-theme="all" aria-pressed="' + (theme === "all") + '">All themes</button>' +
          themes.map(function (c) { return '<button class="chip" type="button" data-theme="' + c.id + '" aria-pressed="' + (theme === c.id) + '">' + c.icon + ' ' + esc(c.name) + '</button>'; }).join("") +
        '</div></div>' +
        '<div id="alist"></div>';

      const list = el.querySelector("#alist");
      function draw() {
        const shown = theme === "all" ? themes : [App.cat(theme)];
        let html = "";
        if (theme === "all") {
          // one pair per everyday word, taken round-robin across themes so the grid mixes topics
          const pools = themes.map(function (c) { return c.words.filter(function (w) { return w.plain; }); });
          const pairs = [], usedPlain = {};
          for (let round = 0; pairs.length < 12 && round < 25; round++) {
            pools.forEach(function (p) {
              const w = p[round];
              if (w && !usedPlain[w.plain] && pairs.length < 12) { usedPlain[w.plain] = 1; pairs.push(w); }
            });
          }
          html += '<div class="section-head" style="margin-top:12px"><h2>Everyday word → pure Urdu</h2></div>' +
            '<div class="pairs">' + pairs.slice(0, 12).map(function (w) {
              return '<button class="pair" type="button" data-word="' + w.id + '"><span class="from">' + esc(w.plain) + '</span><span class="arrow">' + App.icon("arrow") + '</span><span class="to">' + esc(w.roman) + '</span></button>';
            }).join("") + '</div>';
        }
        shown.forEach(function (c) {
          const l = App.learnedCount(c.words);
          html += '<div class="cat-head"><span class="em" aria-hidden="true">' + c.icon + '</span>' +
            '<div style="min-width:0"><h2>' + esc(c.name) + '<span class="u">' + esc(c.urdu) + '</span></h2>' +
            '<div class="muted" style="font-size:14px">' + esc(c.blurb) + ' · ' + l + '/' + c.words.length + ' learned</div></div>' +
            '<span class="spacer"></span><button class="btn btn-ghost" type="button" data-go="cards-' + c.id + '">' + App.icon("layers") + '<span>Practise</span></button></div>' +
            '<div class="word-list">' + c.words.map(function (w) { return App.wordCard(w, { example: true }); }).join("") + '</div>';
        });
        list.innerHTML = html;
      }

      el.querySelectorAll("[data-theme]").forEach(function (b) {
        b.addEventListener("click", function () {
          theme = b.dataset.theme;
          el.querySelectorAll("[data-theme]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          App.setHash("#adabi" + (theme === "all" ? "" : "-" + theme));
          draw();
          const top = list.getBoundingClientRect().top + window.scrollY - 140;
          if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
        });
      });
      el.addEventListener("click", function (e) {
        const g = e.target.closest("[data-go]");
        if (g) App.go(g.dataset.go);
      });
      App.bindWordClicks(list);
      draw();
    }
  };
})();
