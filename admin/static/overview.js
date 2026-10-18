"use strict";
/* Sprint 12 : vue strictement privée et informative. */
(function () {
  const target = document.getElementById("chest0-overview-list");
  if (!target) return;
  const txt = (v) => v == null ? "Non renseigné" : String(v);
  function line(parent, label, value) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label + " : ";
    p.append(strong, document.createTextNode(txt(value)));
    parent.append(p);
  }
  async function refresh() {
    target.replaceChildren();
    try {
      const response = await fetch("/api/ecosystem/overview", {cache: "no-store", credentials: "same-origin"});
      if (!response.ok) throw new Error("Service indisponible");
      const payload = await response.json();
      if (!payload.ok || !Array.isArray(payload.projects)) throw new Error("Registre indisponible");
      for (const item of payload.projects) {
        const card = document.createElement("article");
        card.className = "ecosystem-card";
        const h = document.createElement("h3");
        h.textContent = txt(item.name);
        card.append(h);
        line(card, "État du projet", item.state);
        line(card, "Version stable", item.stable_version);
        line(card, "Présence locale", item.local_status);
        line(card, "Exécution", item.runtime_state);
        line(card, "Niveaux d'intégration", (item.integration_levels || []).join(", ") || "Aucun");
        target.append(card);
      }
      if (!payload.projects.length) target.textContent = "Aucun projet administrable.";
    } catch (_) { target.textContent = "Supervision momentanément indisponible."; }
  }
  const button = document.getElementById("chest0-overview-refresh");
  if (button) button.addEventListener("click", refresh);
  refresh();
})();
