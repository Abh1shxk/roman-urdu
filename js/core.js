/* Core: word index, progress storage, spaced repetition, answer checking, helpers. */
(function () {
  "use strict";
  const App = (window.App = window.App || {});

  /* ---------- Word index ---------- */
  App.categories = (window.URDU_DATA || []).map(function (c) {
    const words = c.words.map(function (w, i) {
      return {
        id: c.id + ":" + i,
        cat: c.id,
        roman: w[0],
        english: w[1],
        sounds: w[2] || "",
        variants: w[3] ? w[3].split("|").filter(Boolean) : [],
        note: w[4] || ""
      };
    });
    return { id: c.id, name: c.name, icon: c.icon, blurb: c.blurb, words: words };
  });
  App.words = [];
  App.byId = {};
  App.categories.forEach(function (c) {
    c.words.forEach(function (w) { App.words.push(w); App.byId[w.id] = w; });
  });
  App.cat = function (id) { return App.categories.find(function (c) { return c.id === id; }); };

  /* ---------- Progress storage (localStorage, this browser only) ---------- */
  const KEY = "romanUrdu.progress.v1";
  const BOX_LEARNED = 3;               // answered right 3 times in a row => learned
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // days until next review per box

  function blank() {
    return { words: {}, days: {}, quizzes: [], bestStreak: 0, settings: { goal: 15, theme: "auto" } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const p = Object.assign(blank(), JSON.parse(raw));
      p.settings = Object.assign(blank().settings, p.settings || {});
      return p;
    } catch (e) { return blank(); }
  }
  App.progress = load();
  App.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(App.progress)); } catch (e) { /* storage unavailable */ }
    scheduleCloud();
  };
  App.resetProgress = function () { App.progress = blank(); App.save(); };

  /* ---------- Account sync (only when published as a claude.ai artifact) ----------
     Progress is kept in the viewer's private area of the artifact's database, so it follows
     them across devices. Anywhere else (the local file, signed-out viewers) it stays in this browser. */
  App.cloud = "off";            // "off" | "connecting" | "on"
  App.downloads = null;         // claude.ai downloads capability, when available
  let cloudDoc = null, cloudBusy = false, cloudDirty = false, cloudTimer = null;

  function scheduleCloud() {
    if (!cloudDoc) return;
    cloudDirty = true;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(flushCloud, 1500);  // one write per pause, not per click
  }
  function flushCloud() {
    if (!cloudDoc || cloudBusy || !cloudDirty) return;
    cloudBusy = true;
    cloudDirty = false;
    cloudDoc.set({ json: JSON.stringify(App.progress), v: 1 }).then(function () {
      cloudBusy = false;
      if (cloudDirty) flushCloud();
    }, function (e) {
      cloudBusy = false;
      if (e && e.code === "invalid_argument") { cloudDoc = null; App.cloud = "off"; return; } // this viewer can't save here
      cloudDirty = true;
      clearTimeout(cloudTimer);
      cloudTimer = setTimeout(flushCloud, 8000);
    });
  }
  function stable(v) {  // key-order-independent JSON, for comparing two progress objects
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v === undefined ? null : v);
  }
  function mergeProgress(a, b) {
    const out = blank();
    out.words = Object.assign({}, a.words);
    Object.keys(b.words || {}).forEach(function (k) {
      const x = out.words[k], y = b.words[k];
      if (!x || (y && (y.seen || 0) > (x.seen || 0))) out.words[k] = y;
    });
    out.days = Object.assign({}, a.days);
    Object.keys(b.days || {}).forEach(function (d) { out.days[d] = Math.max(out.days[d] || 0, b.days[d] || 0); });
    out.quizzes = ((b.quizzes || []).length > (a.quizzes || []).length ? b.quizzes : a.quizzes) || [];
    out.bestStreak = Math.max(a.bestStreak || 0, b.bestStreak || 0);
    out.settings = Object.assign(blank().settings, a.settings, b.settings);
    return out;
  }
  App.initCloud = function (onChange) {
    const c = window.claude;
    if (!c || typeof c.use !== "function") return;
    App.cloud = "connecting";
    const done = function () { try { onChange(); } catch (e) { /* view refresh failed */ } };
    c.use("downloads").then(function (d) { App.downloads = d; }, function () {});
    Promise.all([c.use("db"), c.use("user")]).then(function (r) {
      const db = r[0], user = r[1];
      if (!db || !user) { App.cloud = "off"; return done(); }
      return user.id().then(function (id) {
        if (!id) { App.cloud = "off"; return done(); }
        const ref = db.collection("data/users/" + id).doc("progress");
        let timedOut = false;
        const timer = setTimeout(function () { timedOut = true; App.cloud = "off"; done(); }, 10000);
        return ref.get().then(function (snap) {
          clearTimeout(timer);
          if (timedOut) return;
          const remoteJson = snap.exists ? String((snap.data() || {}).json || "") : "";
          let remote = null;
          try { remote = remoteJson ? JSON.parse(remoteJson) : null; } catch (e) { remote = null; }
          cloudDoc = ref;
          App.cloud = "on";
          const hadLocal = Object.keys(App.progress.days).length > 0;
          if (remote && typeof remote.words === "object" && typeof remote.days === "object") {
            App.progress = mergeProgress(App.progress, remote);
            try { localStorage.setItem(KEY, JSON.stringify(App.progress)); } catch (e) { /* ignore */ }
            if (stable(App.progress) !== stable(remote)) { cloudDirty = true; flushCloud(); } // upload only real differences
          } else if (hadLocal) {
            cloudDirty = true; flushCloud();  // first visit with account sync: upload what this browser has
          }
          done();
        });
      });
    }).catch(function () { App.cloud = "off"; done(); });
  };

  /* ---------- Dates & streak ---------- */
  App.today = function (d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  function addDays(dateStr, n) {
    const p = dateStr.split("-").map(Number);
    const d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() + n);
    return App.today(d);
  }
  App.addDays = addDays;
  App.streak = function () {
    const days = App.progress.days;
    let d = App.today();
    if (!days[d]) d = addDays(d, -1);   // streak survives until today ends
    let n = 0;
    while (days[d]) { n++; d = addDays(d, -1); }
    return n;
  };
  App.todayCount = function () { return App.progress.days[App.today()] || 0; };
  function logActivity() {
    const t = App.today();
    App.progress.days[t] = (App.progress.days[t] || 0) + 1;
    App.progress.bestStreak = Math.max(App.progress.bestStreak || 0, App.streak());
  }

  /* ---------- Spaced repetition (Leitner boxes) ---------- */
  App.state = function (id) {
    return App.progress.words[id] || { box: 0, due: "", right: 0, wrong: 0, seen: 0 };
  };
  App.isLearned = function (id) {
    const s = App.progress.words[id];
    return !!s && (s.box >= BOX_LEARNED || !!s.manual);
  };
  App.isStarted = function (id) { return !!App.progress.words[id]; };
  App.isDue = function (id) {
    const s = App.progress.words[id];
    return !!s && s.due && s.due <= App.today();
  };
  App.record = function (id, correct) {
    const s = Object.assign({ box: 0, due: "", right: 0, wrong: 0, seen: 0 }, App.progress.words[id] || {});
    s.seen++;
    if (correct) { s.right++; s.box = Math.min(s.box + 1, INTERVALS.length - 1); }
    else { s.wrong++; s.box = 0; s.manual = false; }
    s.due = addDays(App.today(), INTERVALS[s.box]);
    App.progress.words[id] = s;
    logActivity();
    App.save();
  };
  App.toggleLearned = function (id) {
    const s = Object.assign({ box: 0, due: "", right: 0, wrong: 0, seen: 0 }, App.progress.words[id] || {});
    if (App.isLearned(id)) { s.manual = false; s.box = Math.min(s.box, BOX_LEARNED - 1); s.due = App.today(); }
    else { s.manual = true; s.box = Math.max(s.box, BOX_LEARNED); s.due = addDays(App.today(), INTERVALS[s.box]); }
    App.progress.words[id] = s;
    App.save();
  };
  App.learnedCount = function (list) {
    return (list || App.words).filter(function (w) { return App.isLearned(w.id); }).length;
  };
  App.dueWords = function (list) {
    return (list || App.words).filter(function (w) { return App.isDue(w.id); });
  };
  App.logQuiz = function (score, total) {
    App.progress.quizzes.push({ d: App.today(), s: score, t: total });
    if (App.progress.quizzes.length > 200) App.progress.quizzes.shift();
    App.save();
  };

  /* ---------- Answer checking ---------- */
  // Roman Urdu: fold common spelling variants (aa/a, ee/i, oo/u, w/v, q/k, ay/e, chh/ch, gh/g, doubled letters...)
  App.normRoman = function (s) {
    s = String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    s = s.replace(/['’`]/g, "").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
    s = s.split(" ").map(function (w) {
      w = w.replace(/(ay|ey|ae)$/, "e").replace(/([aeiou])h$/, "$1");
      return w;
    }).join("");
    s = s.replace(/w/g, "v").replace(/q/g, "k")
         .replace(/chh/g, "ch").replace(/gh/g, "g")
         .replace(/ee/g, "i").replace(/oo/g, "u").replace(/ai/g, "e")
         .replace(/iy/g, "y").replace(/ia/g, "ya").replace(/ie/g, "ye")
         .replace(/(.)\1+/g, "$1");
    return s;
  };
  function skeleton(n) { return n.replace(/[aeiouy]/g, ""); }
  App.lev = function (a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    // Optimal string alignment distance: edits plus swapped neighbours ("lvoe" -> "love" = 1)
    let prev2 = null;
    let prev = Array.from({ length: n + 1 }, function (_, j) { return j; });
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
      }
      prev2 = prev;
      prev = cur;
    }
    return prev[n];
  };
  // A different final vowel usually changes gender or number (larka / larki, beta / beti), so never call it "close".
  function endingDiffers(t, a) {
    const x = t[t.length - 1], y = a[a.length - 1];
    return x !== y && /[aeiu]/.test(x) && /[aeiu]/.test(y);
  }
  // Returns "exact" | "close" | false
  App.checkRoman = function (typed, word) {
    const t = App.normRoman(typed);
    if (!t) return false;
    const answers = [word.roman].concat(word.variants);
    let best = false;
    for (let i = 0; i < answers.length; i++) {
      const a = App.normRoman(answers[i]);
      if (t === a) return "exact";
      if (endingDiffers(t, a)) continue;
      const d = App.lev(t, a);
      if (a.length >= 5 && skeleton(t) === skeleton(a) && d <= 2) best = "close";
      else if (a.length >= 5 && d <= 1) best = "close";
      else if (a.length >= 9 && d <= 2) best = "close";
    }
    return best;
  };
  // English: accept any of the "/"-separated meanings, ignoring "to", articles and bracketed notes.
  App.normEnglish = function (s) {
    return String(s).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ").trim().replace(/^(to|a|an|the) /, "").replace(/^(to|a|an|the) /, "");
  };
  App.englishAnswers = function (word) {
    const out = [];
    const noBrackets = word.english.replace(/\([^)]*\)/g, " ");
    noBrackets.split(/[\/;,]/).forEach(function (p) { const n = App.normEnglish(p); if (n) out.push(n); });
    const whole = App.normEnglish(noBrackets); if (whole) out.push(whole);
    const full = App.normEnglish(word.english); if (full) out.push(full);
    (word.english.match(/\(([^)]*)\)/g) || []).forEach(function (m) {
      const inner = m.slice(1, -1);
      if (/^lit\.|^said|^with|^to a|^polite|^formal|^male|^informal|^very|^everyday|^literary|^a woman/.test(inner)) return;
      inner.split(/[\/;,]/).forEach(function (p) { const n = App.normEnglish(p); if (n && n.length > 2) out.push(n); });
    });
    return out;
  };
  App.checkEnglish = function (typed, word) {
    const t = App.normEnglish(typed).replace(/\?$/, "");
    if (!t) return false;
    // Same spelling, different meanings (khaana = food / to eat, hafta = week / Saturday): accept any of them.
    const key = App.normRoman(word.roman);
    let answers = [];
    App.words.forEach(function (w) { if (w === word || App.normRoman(w.roman) === key) answers = answers.concat(App.englishAnswers(w)); });
    let best = false;
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (t === a) return "exact";
      const d = App.lev(t, a);
      if ((a.length >= 4 && d <= 1) || (a.length >= 8 && d <= 2)) best = "close";
    }
    return best;
  };

  /* ---------- Helpers ---------- */
  App.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  App.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  App.wordsFor = function (scope) {
    if (!scope || scope === "all") return App.words.slice();
    if (scope === "due") return App.dueWords();
    if (scope === "new") return App.words.filter(function (w) { return !App.isStarted(w.id); });
    if (scope === "learning") return App.words.filter(function (w) { return App.isStarted(w.id) && !App.isLearned(w.id); });
    if (scope === "learned") return App.words.filter(function (w) { return App.isLearned(w.id); });
    const c = App.cat(scope);
    return c ? c.words.slice() : App.words.slice();
  };
  // Explain the pronunciation symbols used in a "sounds like" hint.
  App.soundTips = function (s) {
    const tips = [];
    if (/(^|[^'])kh/.test(s.replace(/k'h/g, ""))) tips.push("kh = throaty, like 'loch'");
    if (/gh/.test(s.replace(/g'h/g, ""))) tips.push("gh = soft gargle from the throat");
    if (/q/.test(s)) tips.push("q = k from deep in the throat");
    if (/[TDR]/.test(s)) tips.push("T / D / R = tongue curled back");
    if (/'h/.test(s)) tips.push("' h = add a puff of breath");
    if (/chh/.test(s)) tips.push("chh = ch with a puff of breath");
    if (/\(n\)/.test(s)) tips.push("(n) = say it through the nose");
    return tips;
  };
  App.wordOfDay = function () {
    const t = App.today();
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    return App.words[h % App.words.length];
  };
})();
