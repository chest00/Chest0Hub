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
        line(card, "Référence historique stable", item.stable_version);
        const g = item.governance || {};
        line(card, "Développement", g.development || "inconnu");
        line(card, "Validation", g.validation || "non_verifiee");
        line(card, "Disponibilité déclarée", g.availability || "inconnue");
        line(card, "Provenance", g.source);
        line(card, "Vérification documentaire", g.verified_on);
        for (const [kind, version] of Object.entries(g.versions || {})) line(card, "Version " + kind, version);
        for (const [cap, status] of Object.entries(g.capabilities || {})) line(card, "Capacité " + cap, status);
        line(card, "Présence locale", item.local_status);
        line(card, "Exécution", item.runtime_state);
        if (item.id === "chest0-video-studio") {
          line(card, "Type", "Application graphique native — sans port HTTP");
          line(card, "Sécurité", "Arrêt depuis le Hub désactivé ; générations non vérifiées");
          if (item.runtime_state === "prêt_non_testé") {
            const start = document.createElement("button");
            start.type = "button";
            start.textContent = "Lancer Video Studio (validation locale requise)";
            start.addEventListener("click", async () => {
              start.disabled = true;
              try {
                const status = await fetch("/api/status", {cache:"no-store",credentials:"same-origin"});
                if (!status.ok) throw new Error("Authentification locale indisponible");
                const auth = await status.json();
                if (typeof auth.csrfToken !== "string") throw new Error("Protection CSRF absente");
                const result = await fetch("/api/ecosystem/start", {
                  method:"POST", credentials:"same-origin",
                  headers:{"Content-Type":"application/json", "X-CSRF-Token":auth.csrfToken},
                  body:JSON.stringify({applicationId:"chest0-video-studio"})
                });
                const body = await result.json();
                if (!result.ok || !body.ok) throw new Error(body.error || "Lancement refusé");
                await refresh();
              } catch (error) {
                const notice = document.createElement("p");
                notice.textContent = "Video Studio : " + String(error.message || "Erreur de lancement");
                card.append(notice);
                start.disabled = false;
              }
            });
            card.append(start);
          }
        }
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
