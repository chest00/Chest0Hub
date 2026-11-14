/* Chest0 Games Studio — retours visuels et sonores.
   Couche indépendante : elle observe l'interface (score, victoire, défaite) sans toucher aux jeux.
   Sons générés par l'API Web Audio : aucun fichier audio, rien n'est envoyé sur Internet. */
(function () {
  "use strict";
  var KEY = "chest0-games-son";
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var soundOn = true;
  try { soundOn = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  var ctx = null;

  function audio() {
    if (!soundOn) return null;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  /* Une note courte : fréquence (Hz), départ (s), durée (s), forme, volume */
  function note(freq, start, dur, type, vol) {
    var c = audio(); if (!c) return;
    var t = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }

  var sounds = {
    click: function () { note(660, 0, 0.05, "triangle", 0.04); },
    point: function () { note(880, 0, 0.08, "sine", 0.05); note(1320, 0.05, 0.1, "sine", 0.04); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { note(f, i * 0.11, 0.35, "triangle", 0.07); }); note(1568, 0.48, 0.6, "sine", 0.04); },
    lose: function () { note(392, 0, 0.25, "sine", 0.06); note(311, 0.18, 0.4, "sine", 0.05); }
  };

  /* Confettis aux couleurs Chest0 (vert du jeu, or, blanc) */
  function confetti() {
    if (reduced) return;
    var cv = document.createElement("canvas"); cv.className = "fx-canvas"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    var g = cv.getContext("2d"); g.scale(dpr, dpr);
    var colors = ["#a4f4cb", "#d7b56d", "#f5f5f7"], parts = [];
    for (var i = 0; i < 90; i++) parts.push({ x: w / 2, y: h * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 11 - 3, r: Math.random() * 6.28, s: 4 + Math.random() * 5, c: colors[i % 3] });
    var start = performance.now();
    (function frame(now) {
      var t = now - start; g.clearRect(0, 0, w, h);
      parts.forEach(function (p) { p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.r += 0.15; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - t / 1800); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (t < 1800) requestAnimationFrame(frame); else cv.remove();
    })(start);
  }

  function popAt(el, text) {
    if (reduced || !el) return;
    var r = el.getBoundingClientRect(), s = document.createElement("span");
    s.className = "fx-pop"; s.textContent = text; s.setAttribute("aria-hidden", "true");
    s.style.left = (r.left + scrollX + r.width / 2 - 10) + "px"; s.style.top = (r.top + scrollY - 6) + "px";
    document.body.appendChild(s); setTimeout(function () { s.remove(); }, 950);
  }

  function bump(el) { if (!el || reduced) return; el.classList.remove("fx-bump"); void el.offsetWidth; el.classList.add("fx-bump"); }

  /* Bouton Son activé / coupé */
  function toggle() {
    var b = document.createElement("button");
    b.type = "button"; b.className = "fx-toggle";
    function label() { b.textContent = soundOn ? "Son : activé" : "Son : coupé"; b.setAttribute("aria-pressed", String(soundOn)); }
    label();
    b.addEventListener("click", function () { soundOn = !soundOn; try { localStorage.setItem(KEY, soundOn ? "on" : "off"); } catch (e) {} label(); if (soundOn) sounds.click(); });
    document.body.appendChild(b);
  }

  /* Suivi de l'interface */
  var lastScore = null, lastResult = null;
  function check() {
    var scoreEl = document.querySelector(".score strong");
    if (scoreEl) {
      var v = parseInt(scoreEl.textContent, 10);
      if (!isNaN(v)) {
        if (lastScore !== null && v > lastScore) { sounds.point(); bump(scoreEl); popAt(scoreEl, "+" + (v - lastScore)); }
        lastScore = v;
      }
    } else { lastScore = null; }
    var res = document.querySelector(".result"), state = null;
    if (res) { var h = res.querySelector("h2"); state = h && /réussi/i.test(h.textContent) ? "won" : "lost"; }
    if (state && state !== lastResult) {
      res.classList.add(state === "won" ? "fx-won" : "fx-lost");
      if (state === "won") { sounds.win(); confetti(); } else { sounds.lose(); }
    }
    lastResult = state;
  }

  function init() {
    toggle();
    var root = document.getElementById("root") || document.body;
    new MutationObserver(check).observe(root, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".controls button, button.primary");
      if (b && !b.disabled) sounds.click();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
