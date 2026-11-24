/* Progress: streak, learned words, accuracy, activity, per-category bars, backup/reset. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};
  const esc = App.esc;

  App.views.progress = {
    render: function (el) {
      const p = App.progress;
      const states = Object.keys(p.words).map(function (k) { return p.words[k]; });
      const right = states.reduce(function (a, s) { return a + (s.right || 0); }, 0);
      const seen = states.reduce(function (a, s) { return a + (s.right || 0) + (s.wrong || 0); }, 0);
      const acc = seen ? Math.round((right / seen) * 100) + "%" : "–";
      const learned = App.learnedCount();
      const total = App.words.length;
      const quizAvg = p.quizzes.length ? Math.round(p.quizzes.reduce(function (a, q) { return a + q.s / q.t; }, 0) / p.quizzes.length * 100) + "%" : "–";

      // last 45 days, oldest first
      const cells = [];
      for (let d = 44; d >= 0; d--) {
        const day = App.addDays(App.today(), -d);
        const n = p.days[day] || 0;
        const lvl = n === 0 ? "" : n < 10 ? "l1" : n < 25 ? "l2" : "l3";
        cells.push('<i class="' + lvl + '" title="' + day + ": " + n + ' answers"></i>');
      }

      el.innerHTML =
        '<h1>Your progress</h1>' +
        '<p class="lead">' + (App.cloud === "on"
          ? "Synced to your claude.ai account, so it follows you to other devices. Only you can see it."
          : "Saved in this browser on this device.") + '</p>' +
        '<section class="grid grid-3">' +
          stat("🔥 Current streak", App.streak() + " day" + (App.streak() === 1 ? "" : "s"), "best: " + (p.bestStreak || 0)) +
          stat("✅ Words learned", learned + " / " + total, Math.round((learned / total) * 100) + "% of the app") +
          stat("🎯 Accuracy", acc, p.quizzes.length + " quiz" + (p.quizzes.length === 1 ? "" : "zes") + " · avg " + quizAvg) +
        '</section>' +
        '<section class="grid grid-2" style="margin-top:14px">' +
          '<div class="card"><h3>Last 45 days</h3><div class="heat">' + cells.join("") + '</div>' +
            '<p class="muted" style="font-size:13px;margin:10px 0 0">Each square is a day; darker means more answers.</p></div>' +
          '<div class="card"><h3>Daily goal</h3><p class="muted" style="margin-top:0">How many flashcard or quiz answers a day?</p>' +
            '<select id="goal" aria-label="Daily goal">' + [5, 10, 15, 25, 40, 60].map(function (n) {
              return '<option value="' + n + '"' + (n === p.settings.goal ? " selected" : "") + '>' + n + ' answers a day</option>';
            }).join("") + '</select>' +
            '<p class="muted" style="font-size:14px">Today: ' + App.todayCount() + ' answers. A word counts as <b>learned</b> after you get it right 3 times in a row, or when you mark it yourself.</p></div>' +
        '</section>' +
        '<h2>By category</h2><div class="card">' + App.categories.map(function (c) {
          const l = App.learnedCount(c.words);
          const started = c.words.filter(function (w) { return App.isStarted(w.id); }).length;
          return '<div class="cat-prog"><span style="font-size:20px" aria-hidden="true">' + c.icon + '</span>' +
            '<div><div class="nm"><a href="#learn-' + c.id + '" style="color:inherit;text-decoration:none">' + esc(c.name) + '</a></div>' +
            '<div class="bar"><i style="width:' + Math.round((l / c.words.length) * 100) + '%"></i></div></div>' +
            '<div class="ct">' + l + '/' + c.words.length + '<br><span style="font-size:11px">' + Math.max(0, started - l) + ' in progress</span></div></div>';
        }).join("") + '</div>' +
        '<h2>Backup</h2><div class="card"><p class="muted" style="margin-top:0">' + (App.cloud === "on"
          ? "Export a copy of your progress to keep, or import a copy you saved earlier."
          : "Progress lives in this browser. To move it to another device or keep a copy, export it and import it there.") + '</p>' +
          '<div class="row"><button class="btn" type="button" id="exp">⬇ Export progress</button>' +
          '<label class="btn" style="cursor:pointer">⬆ Import progress<input type="file" id="imp" accept=".json,application/json" class="sr-only"></label>' +
          '<span class="spacer"></span><button class="btn btn-bad" type="button" id="reset">Reset all progress</button></div></div>';

      el.querySelector("#goal").addEventListener("change", function (e) { p.settings.goal = +e.target.value; App.save(); App.toast("Daily goal saved"); });
      el.querySelector("#exp").addEventListener("click", function () {
        const json = JSON.stringify(App.progress, null, 1);
        const filename = "roman-urdu-progress-" + App.today() + ".json";
        if (App.downloads) {  // published on claude.ai: the viewer confirms the save
          App.downloads.save({ filename: filename, data: json })
            .then(function () { App.toast("Backup saved"); }, function () { App.toast("Backup not saved"); });
        } else if (window.top === window) {  // opened as a local file or its own tab
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
          a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(json)
            .then(function () { App.toast("Backup copied: paste it into a text file to keep it"); },
                  function () { App.toast("Export isn't available here"); });
        } else App.toast("Export isn't available here");
      });
      el.querySelector("#imp").addEventListener("change", function (e) {
        const f = e.target.files[0];
        if (!f) return;
        f.text().then(function (txt) {
          const data = JSON.parse(txt);
          if (!data || typeof data.words !== "object" || typeof data.days !== "object") throw new Error("bad file");
          e.target.value = "";
          App.confirmBox("Replace your current progress with the imported backup?", "Replace", function () {
            App.progress = Object.assign({ words: {}, days: {}, quizzes: [], bestStreak: 0 }, data);
            App.progress.settings = Object.assign({ goal: 15, theme: "auto" }, data.settings || {});
            App.save(); App.toast("Progress imported"); App.go("progress");
          });
        }).catch(function () { e.target.value = ""; App.toast("That file isn't a Roman Urdu progress backup"); });
      });
      el.querySelector("#reset").addEventListener("click", function () {
        App.confirmBox("Reset all progress (learned words, streak and quiz history)? This can't be undone.", "Reset everything", function () {
          App.resetProgress(); App.toast("Progress reset"); App.go("progress");
        });
      });
    }
  };

  function stat(label, num, sub) {
    return '<div class="card"><div class="muted" style="font-weight:600;font-size:14px">' + label + '</div>' +
      '<div class="big-num">' + num + '</div><div class="muted" style="font-size:13px">' + sub + '</div></div>';
  }
})();
