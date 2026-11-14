/* Animations interactives de l'accueil Chest0.
   Amélioration progressive : si ce fichier ne se charge pas, la page reste identique. */
(function () {
    "use strict";

    var NS = "http://www.w3.org/2000/svg";

    function el(name, attrs) {
        var node = document.createElementNS(NS, name);
        Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
        return node;
    }

    /* 1. Remplace le logo image par le même monogramme en SVG animable */
    function animateLogo() {
        var img = document.querySelector(".hero-logo");
        if (!img || !/chest0-mark\.svg$/.test(img.getAttribute("src") || "")) return;

        var svg = el("svg", { viewBox: "0 0 512 512", "class": "hero-logo-anim", role: "img", "aria-label": img.alt || "Logo Chest0" });
        var clip = el("clipPath", { id: "c0-clip" });
        clip.appendChild(el("rect", { width: "512", height: "512", rx: "120" }));
        var defs = el("defs", {});
        var shine = el("linearGradient", { id: "c0-shine-grad", x1: "0", x2: "1" });
        [["0", "0"], [".5", ".22"], ["1", "0"]].forEach(function (s) {
            shine.appendChild(el("stop", { offset: s[0], "stop-color": "#ffffff", "stop-opacity": s[1] }));
        });
        defs.appendChild(clip);
        defs.appendChild(shine);
        svg.appendChild(defs);

        var g = el("g", { "clip-path": "url(#c0-clip)" });
        g.appendChild(el("rect", { width: "512", height: "512", fill: "#09090D" }));
        var art = el("g", { transform: "translate(64 64) scale(.75)" });
        art.appendChild(el("path", { "class": "logo-c", d: "M339.75 382.33A170 170 0 1 1 339.75 129.67", stroke: "#F5F5F7", "stroke-width": "58", "stroke-linecap": "round", fill: "none", pathLength: "1" }));
        art.appendChild(el("circle", { "class": "logo-o", cx: "300", cy: "256", r: "74", stroke: "#D7B56D", "stroke-width": "40", fill: "none", pathLength: "1" }));
        g.appendChild(art);
        g.appendChild(el("rect", { "class": "logo-shine", x: "-200", y: "-100", width: "200", height: "712", fill: "url(#c0-shine-grad)", transform: "rotate(20 256 256)" }));
        svg.appendChild(g);

        img.replaceWith(svg);
    }

    /* 2. Halo doré qui suit le pointeur sur les cartes */
    function cardSpotlight() {
        document.addEventListener("pointermove", function (e) {
            var card = e.target.closest && e.target.closest(".hub-card, .social-card");
            if (!card) return;
            var r = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - r.left) + "px");
            card.style.setProperty("--my", (e.clientY - r.top) + "px");
        }, { passive: true });
    }

    /* 3. Ordre d'apparition en cascade, puis retour à l'état normal.
       Les cartes des réseaux sociaux sont créées après coup par data-engine.js :
       on renumérote donc à chaque ajout. */
    function numberCards() {
        document.querySelectorAll(".hub-card, .social-card").forEach(function (card) {
            var siblings = Array.prototype.filter.call(card.parentElement.children, function (c) {
                return c.classList.contains("hub-card") || c.classList.contains("social-card");
            });
            card.style.setProperty("--i", siblings.indexOf(card));
        });
    }

    function cardCascade() {
        numberCards();
        document.addEventListener("animationend", function (ev) {
            if (ev.animationName === "card-in" && ev.target.classList) ev.target.classList.add("is-in");
        });
        var grid = document.querySelector(".social-grid");
        if (grid && "MutationObserver" in window) {
            new MutationObserver(numberCards).observe(grid, { childList: true });
        }
    }

    function init() {
        animateLogo();
        cardSpotlight();
        cardCascade();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
