/* Shared UI: icons, word cards, the word detail sheet and the Flashcards/Quiz switch. */
(function () {
  "use strict";
  const App = window.App;
  const esc = App.esc;

  /* Line icons (24px grid, stroke-based) */
  const ICONS = {
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    feather: '<path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
    type: '<path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    target: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    star: '<path d="m12 2.5 2.95 6 6.55.95-4.75 4.6 1.12 6.5L12 17.5l-5.87 3.05 1.12-6.5L2.5 9.45l6.55-.95z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    check: '<circle cx="12" cy="12" r="9.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
    shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>'
  };
  App.icon = function (name, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + '</svg>';
  };
  App.fillIcons = function (root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      el.outerHTML = App.icon(el.getAttribute("data-icon"), el.className || "");
    });
  };

  /* Status badge for a word */
  App.statusBadge = function (id) {
    if (App.isLearned(id)) return '<span class="badge learned">learned</span>';
    if (App.isDue(id)) return '<span class="badge due">due</span>';
    if (App.isStarted(id)) return '<span class="badge learning">learning</span>';
    return "";
  };
  App.starBtn = function (id) {
    const on = App.isSaved(id);
    return '<button class="star-btn" type="button" data-star="' + id + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove from saved words" : "Save word") + '" title="' + (on ? "Saved" : "Save word") + '">' + App.icon("star") + '</button>';
  };

  /* A word card. Clicking it opens the detail sheet (see App.bindWordClicks). */
  App.wordCard = function (w, opts) {
    opts = opts || {};
    const alts = w.variants.filter(function (v) { return v.toLowerCase() !== w.roman.toLowerCase(); }).slice(0, 2);
    return '<article class="word' + (w.group === "adabi" ? " adabi" : "") + '" data-word="' + w.id + '" tabindex="0" role="button" aria-label="' + esc(w.roman + ": " + w.english) + '">' +
      '<div class="top"><div class="roman">' + esc(w.roman) + '</div>' + App.starBtn(w.id) + '</div>' +
      '<div class="eng">' + esc(w.english) + '</div>' +
      '<div class="snd">sounds like <b>' + esc(w.sounds) + '</b></div>' +
      (w.plain ? '<div class="plain">everyday word: <b>' + esc(w.plain) + '</b></div>' : '') +
      (opts.example && w.example ? '<div class="ex"><i>' + esc(w.example.ur) + '</i><span>' + esc(w.example.en) + '</span></div>' : '') +
      ((alts.length || App.isStarted(w.id) || opts.showCat) ? '<div class="meta">' + App.statusBadge(w.id) +
        (opts.showCat ? '<span class="badge">' + esc(App.cat(w.cat).name) + '</span>' : '') +
        (alts.length ? '<span class="badge">also: ' + alts.map(esc).join(", ") + '</span>' : '') + '</div>' : '') +
      '</article>';
  };

  /* Clicks on word cards, result rows and star buttons inside a container */
  App.bindWordClicks = function (root, onChange) {
    root.addEventListener("click", function (e) {
      const star = e.target.closest("[data-star]");
      if (star) {
        e.stopPropagation();
        const on = App.toggleSaved(star.dataset.star);
        document.querySelectorAll('[data-star="' + star.dataset.star + '"]').forEach(function (s) {
          s.setAttribute("aria-pressed", String(on));
          s.setAttribute("aria-label", on ? "Remove from saved words" : "Save word");
        });
        App.toast(on ? "Saved: practise it from Flashcards → Saved words" : "Removed from saved words");
        if (onChange) onChange();
        return;
      }
      const card = e.target.closest("[data-word]");
      if (card && root.contains(card)) App.openWord(card.dataset.word, onChange);
    });
    root.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-word]")) { e.preventDefault(); App.openWord(e.target.dataset.word, onChange); }
    });
  };

  /* Word detail sheet */
  App.openWord = function (id, onChange) {
    const w = App.byId[id];
    if (!w) return;
    const c = App.cat(w.cat);
    const tips = App.soundTips(w.sounds);
    const alts = w.variants.filter(function (v) { return v.toLowerCase() !== w.roman.toLowerCase(); });
    const back = document.createElement("div");
    back.className = "sheet-back";
    const render = function () {
      const learned = App.isLearned(w.id);
      back.innerHTML = '<div class="sheet' + (w.group === "adabi" ? " adabi" : "") + '" role="dialog" aria-modal="true" aria-label="' + esc(w.roman) + '">' +
        '<button class="icon-btn close" type="button" aria-label="Close">' + App.icon("x") + '</button>' +
        '<div class="eyebrow">' + esc(c.icon + "  " + c.name) + (c.urdu ? " · " + esc(c.urdu) : "") + '</div>' +
        '<div class="roman">' + esc(w.roman) + '</div>' +
        '<div class="eng">' + esc(w.english) + '</div>' +
        '<dl>' +
          '<dt>Sounds like</dt><dd><b>' + esc(w.sounds) + '</b>' + (tips.length ? '<div class="tips">' + tips.map(function (t) { return '<span class="tip">' + esc(t) + '</span>'; }).join("") + '</div>' : '') + '</dd>' +
          (w.plain ? '<dt>Everyday word</dt><dd>' + esc(w.plain) + '</dd>' : '') +
          (alts.length ? '<dt>Also written</dt><dd>' + alts.map(esc).join(", ") + '</dd>' : '') +
          (w.note ? '<dt>Note</dt><dd>' + esc(w.note) + '</dd>' : '') +
          '<dt>Status</dt><dd>' + (App.statusBadge(w.id) || '<span class="badge">not started</span>') + '</dd>' +
        '</dl>' +
        (w.example ? '<div class="ex"><i>' + esc(w.example.ur) + '</i><span>' + esc(w.example.en) + '</span></div>' : '') +
        '<div class="acts">' +
          '<button class="btn" type="button" data-act="save">' + App.icon("star") + (App.isSaved(w.id) ? "Saved" : "Save") + '</button>' +
          '<button class="btn" type="button" data-act="learned">' + App.icon("check") + (learned ? "Learned" : "Mark learned") + '</button>' +
          '<button class="btn btn-primary" type="button" data-act="practise">Practise ' + esc(c.name) + '</button>' +
        '</div></div>';
      back.querySelector(".close").focus();
    };
    const close = function () { document.removeEventListener("keydown", onKey); back.remove(); if (onChange) onChange(); };
    const onKey = function (e) { if (e.key === "Escape") close(); };
    back.addEventListener("click", function (e) {
      if (e.target === back || e.target.closest(".close")) return close();
      const act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.dataset.act === "save") { App.toggleSaved(w.id); document.querySelectorAll('[data-star="' + w.id + '"]').forEach(function (s) { s.setAttribute("aria-pressed", String(App.isSaved(w.id))); }); render(); }
      else if (act.dataset.act === "learned") { App.toggleLearned(w.id); App.updateHeader(); render(); }
      else if (act.dataset.act === "practise") { close(); App.go("cards-" + w.cat); }
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    render();
  };

  /* Flashcards | Quiz switch shown at the top of both practice screens */
  App.practiceSwitch = function (active) {
    return '<div class="seg" role="navigation" aria-label="Practice mode">' +
      '<a href="#cards"' + (active === "cards" ? ' aria-current="page"' : '') + '>' + App.icon("layers") + 'Flashcards</a>' +
      '<a href="#quiz"' + (active === "quiz" ? ' aria-current="page"' : '') + '>' + App.icon("target") + 'Quiz</a></div>';
  };

  /* Options for "which words" selectors in Flashcards and Quiz */
  App.scopeOptions = function (selected, extra) {
    const opts = (extra || []).concat([
      ["saved", "★ Saved words (" + App.wordsFor("saved").length + ")"],
      ["everyday", "All everyday words"],
      ["adabi", "All pure Urdu words"],
      ["all", "Everything"]
    ]);
    let html = opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === selected ? " selected" : "") + '>' + esc(o[1]) + '</option>'; }).join("");
    html += '<optgroup label="Everyday Urdu">' + App.groups.everyday.map(function (c) { return '<option value="' + c.id + '"' + (c.id === selected ? " selected" : "") + '>' + esc(c.icon + " " + c.name) + '</option>'; }).join("") + '</optgroup>';
    html += '<optgroup label="Pure Urdu">' + App.groups.adabi.map(function (c) { return '<option value="' + c.id + '"' + (c.id === selected ? " selected" : "") + '>' + esc(c.icon + " " + c.name) + '</option>'; }).join("") + '</optgroup>';
    return html;
  };
})();
