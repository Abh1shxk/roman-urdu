/* Router, header, theme, confirm dialog and toast. Views live in view-*.js and register in App.views. */
(function () {
  "use strict";
  const App = window.App;
  const viewEl = document.getElementById("view");
  let cleanup = null;
  let currentView = "home";

  App.updateHeader = function () {
    document.getElementById("hdr-streak").textContent = App.streak();
    document.getElementById("hdr-learned").textContent = App.learnedCount();
  };

  let toastTimer;
  App.toast = function (msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  };

  /* In-page confirmation (browser confirm() dialogs are blocked inside published artifacts). */
  App.confirmBox = function (message, okLabel, onYes) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-msg">' +
      '<p id="modal-msg"></p><div class="row" style="justify-content:flex-end">' +
      '<button class="btn" type="button" id="modal-no">Cancel</button>' +
      '<button class="btn btn-bad" type="button" id="modal-yes"></button></div></div>';
    back.querySelector("#modal-msg").textContent = message;
    back.querySelector("#modal-yes").textContent = okLabel;
    const close = function () { document.removeEventListener("keydown", onKey); back.remove(); };
    const onKey = function (e) { if (e.key === "Escape") close(); };
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    back.querySelector("#modal-no").addEventListener("click", close);
    back.querySelector("#modal-yes").addEventListener("click", function () { close(); onYes(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    back.querySelector("#modal-no").focus();
  };

  /* Views are addressed as #view or #view-option (e.g. #learn-food, #cards-due). */
  App.go = function (hash) {
    if (location.hash === "#" + hash) route();
    else location.hash = hash;
  };
  App.setHash = function (h) {
    try { history.replaceState(null, "", h.charAt(0) === "#" ? h : "#" + h); } catch (e) { /* not allowed here */ }
  };

  function route() {
    const raw = location.hash.replace(/^#/, "") || "home";
    const cut = raw.indexOf("-");
    const first = cut < 0 ? raw : raw.slice(0, cut);
    const name = App.views[first] ? first : "home";
    const param = cut < 0 ? "" : decodeURIComponent(raw.slice(cut + 1));
    if (typeof cleanup === "function") cleanup();
    cleanup = null;
    currentView = name;
    document.querySelectorAll(".tab").forEach(function (b) {
      if (b.dataset.view === name) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    viewEl.innerHTML = "";
    cleanup = App.views[name].render(viewEl, param) || null;
    App.updateHeader();
    window.scrollTo(0, 0);
  }

  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () { App.go(b.dataset.view); });
  });

  /* Theme: auto (follows the system, or the claude.ai theme when published) -> light -> dark */
  const hostTheme = document.documentElement.getAttribute("data-theme");
  function applyTheme() {
    const t = App.progress.settings.theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else if (hostTheme) document.documentElement.setAttribute("data-theme", hostTheme);
    else document.documentElement.removeAttribute("data-theme");
  }
  document.getElementById("theme-btn").addEventListener("click", function () {
    const order = ["auto", "light", "dark"];
    const s = App.progress.settings;
    s.theme = order[(order.indexOf(s.theme) + 1) % order.length];
    App.save();
    applyTheme();
    App.toast("Theme: " + s.theme);
  });

  if (App.progress.settings.theme !== "auto") applyTheme();
  window.addEventListener("hashchange", route);
  route();

  /* When published on claude.ai, sync progress to the viewer's account once it answers. */
  App.initCloud(function () {
    if (App.progress.settings.theme !== "auto") applyTheme();
    if (currentView === "home" || currentView === "learn" || currentView === "progress") route();
    else App.updateHeader();
  });
})();
