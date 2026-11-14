/* Micro-interactions des outils gratuits Chest0.
   Couche ajoutée : elle observe les pages sans toucher aux calculs ni aux données.
   Si ce fichier ne se charge pas, les outils fonctionnent exactement comme avant. */
(function () {
  "use strict";

  function whenShown(el, cb) {
    if (!el) return;
    new MutationObserver(function () { if (!el.hidden) cb(); })
      .observe(el, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
  }

  function stagger(list) {
    if (!list) return;
    Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty("--i", i); });
    list.classList.remove("fx-stagger"); void list.offsetWidth; list.classList.add("fx-stagger");
  }

  /* Mon équilibre quotidien : barre de progression + réponses mises en valeur + résultats */
  function equilibre() {
    var form = document.getElementById("balance-form"), box = document.getElementById("questions");
    if (!form || !box) return;
    var total = box.querySelectorAll("fieldset").length;
    var bar = document.createElement("div");
    bar.className = "fx-progress"; bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = '<div class="fx-progress-text"><span>Votre progression</span><strong>0 / ' + total + '</strong></div><div class="fx-progress-track"><div class="fx-progress-bar"></div></div>';
    box.parentNode.insertBefore(bar, box);
    function update(e) {
      var names = {};
      form.querySelectorAll('#questions input[type="radio"]:checked').forEach(function (r) { names[r.name] = 1; });
      var n = Object.keys(names).length;
      bar.querySelector("strong").textContent = n + " / " + total;
      bar.querySelector(".fx-progress-bar").style.width = (total ? 100 * n / total : 0) + "%";
      bar.classList.toggle("is-done", n === total);
      form.querySelectorAll("#questions .answer").forEach(function (l) {
        var on = l.querySelector("input").checked;
        l.classList.toggle("is-picked", on);
        if (on && e && e.target && l.contains(e.target)) { l.classList.remove("fx-pop"); void l.offsetWidth; l.classList.add("fx-pop"); }
      });
    }
    form.addEventListener("change", update);
    form.addEventListener("reset", function () { setTimeout(update, 0); });
    update();
    var results = document.getElementById("results");
    whenShown(results, function () {
      var axes = document.getElementById("axis-results");
      if (!axes || axes.dataset.fxDone === axes.innerHTML.length + "") return;
      axes.querySelectorAll(".axis-result").forEach(function (r) {
        var t = (r.querySelector("span") || {}).textContent || "";
        r.dataset.level = /Bien/.test(t) ? "ok" : /renforcer/.test(t) ? "mid" : "low";
      });
      stagger(axes);
      axes.dataset.fxDone = axes.innerHTML.length + "";
    });
  }

  /* Pauses actives : les pauses proposées apparaissent l'une après l'autre */
  function pauses() {
    var result = document.getElementById("planning-result"), list = document.getElementById("planning-list");
    if (!result || !list) return;
    var last = "";
    whenShown(result, function () { if (list.innerHTML !== last) { last = list.innerHTML; stagger(list); } });
  }

  /* Journal du sommeil : 7 repères qui se remplissent, confirmation mise en valeur */
  function sommeil() {
    var progress = document.getElementById("journal-progress"), status = document.getElementById("save-status");
    if (!progress) return;
    var dots = document.createElement("div");
    dots.className = "fx-dots"; dots.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 7; i++) dots.appendChild(document.createElement("i"));
    progress.insertAdjacentElement("afterend", dots);
    var prev = -1;
    function update() {
      var n = parseInt(progress.textContent, 10) || 0;
      Array.prototype.forEach.call(dots.children, function (d, k) {
        d.classList.toggle("on", k < n);
        d.classList.toggle("new", prev >= 0 && k >= prev && k < n);
      });
      prev = n;
    }
    new MutationObserver(update).observe(progress, { childList: true, characterData: true, subtree: true });
    update();
    if (status) new MutationObserver(function () {
      status.classList.remove("fx-flash"); void status.offsetWidth; status.classList.add("fx-flash");
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }

  /* Page Outils : halo doré qui suit la souris sur les cartes */
  function cartes() {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".tool-card");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  function init() { equilibre(); pauses(); sommeil(); cartes(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
