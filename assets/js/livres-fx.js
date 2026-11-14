/* Animations des livres Chest0 : couvertures en relief au survol, compte à rebours
   des précommandes, badge « Nouveau », apparition en cascade.
   Couche ajoutée : si ce fichier ne se charge pas, la page reste identique. */
(function () {
  "use strict";
  var DAY = 86400000, NEW_DAYS = 30;
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  function wrap(img) {
    if (!img || img.parentNode.classList.contains("fx-cover-wrap")) return img && img.parentNode;
    var w = document.createElement("span");
    w.className = "fx-cover-wrap";
    img.parentNode.insertBefore(w, img);
    w.appendChild(img);
    var g = document.createElement("span"); g.className = "fx-glare"; g.setAttribute("aria-hidden", "true");
    w.appendChild(g);
    if (fine && !reduced) tilt(w, img);
    return w;
  }

  /* Relief 3D qui suit la souris */
  function tilt(w, img) {
    w.addEventListener("pointermove", function (e) {
      var r = w.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      img.style.transform = "rotateY(" + ((x - .5) * 16) + "deg) rotateX(" + ((.5 - y) * 12) + "deg) translateY(-4px)";
      img.style.boxShadow = ((.5 - x) * 24) + "px " + (18 + (y - .5) * 10) + "px 40px rgba(0,0,0,.45)";
      w.style.setProperty("--gx", (x * 100) + "%"); w.style.setProperty("--gy", (y * 100) + "%");
      w.classList.add("is-tilting");
    });
    w.addEventListener("pointerleave", function () { img.style.transform = ""; img.style.boxShadow = ""; w.classList.remove("is-tilting"); });
  }

  function pill(w, cls, text) {
    var p = document.createElement("span"); p.className = "fx-pill " + cls; p.textContent = text; p.setAttribute("aria-hidden", "true");
    w.appendChild(p);
  }

  /* Vitrine de la série (accueil) : J-x avant la sortie, « Nouveau » le premier mois */
  function serie() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    document.querySelectorAll(".serie-tome").forEach(function (tome, i) {
      tome.style.setProperty("--i", i);
      var w = wrap(tome.querySelector("img"));
      if (!w || !tome.dataset.sortie) return;
      var days = Math.round((new Date(tome.dataset.sortie + "T00:00:00") - today) / DAY);
      if (days > 0) pill(w, "countdown", days === 1 ? "Demain" : "J-" + days);
      else if (days > -NEW_DAYS) pill(w, "nouveau", "Nouveau");
    });
  }

  /* Page Livres : cartes créées après coup par data-engine.js */
  function livres() {
    var grid = document.getElementById("books-grid");
    if (!grid) return;
    function decorate() {
      Array.prototype.forEach.call(grid.querySelectorAll(".book-card"), function (card, i) {
        if (card.dataset.fx) return;
        card.dataset.fx = "1"; card.style.setProperty("--i", i); card.classList.add("fx-in");
        wrap(card.querySelector("img.book-cover"));
      });
    }
    new MutationObserver(decorate).observe(grid, { childList: true });
    decorate();
  }

  function init() { serie(); livres(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
