"use strict";
/* Chest0 Video Studio : commande graphique native, contrôlée par le serveur. */
(() => {
  const ID = "chest0-video-studio";
  const TITLE = "Chest0 Video Studio";
  let inFlight = false;
  let scheduled = false;

  function videoCard() {
    // Ne pas supposer que le titre est un h2/h3/h4 : le Hub peut le rendre autrement.
    for (const el of document.querySelectorAll("article,section,.ecosystem-card,.project-card,.card")) {
      if (!el.textContent.includes(TITLE) || el.textContent.includes("Chest0 Accompagnement")) continue;
      if (el.querySelectorAll("button").length >= 3) return el;
    }
    for (const el of document.querySelectorAll("h1,h2,h3,h4,h5,strong,b,div,span")) {
      if (el.children.length || el.textContent.trim() !== TITLE) continue;
      let parent = el.parentElement;
      for (let i = 0; parent && i < 7; i++, parent = parent.parentElement) {
        if (parent.querySelectorAll("button").length >= 3 &&
            parent.textContent.includes(TITLE) &&
            !parent.textContent.includes("Chest0 Accompagnement")) return parent;
      }
    }
    return null;
  }

  async function launch(button, info) {
    if (inFlight) return;
    inFlight = true;
    button.disabled = true;
    info.textContent = "Vérification de l'autorisation de lancement…";
    try {
      const r = await fetch("/api/ecosystem/status", {credentials:"same-origin", cache:"no-store"});
      if (!r.ok) throw new Error("API d'état indisponible");
      const payload = await r.json();
      const video = Array.isArray(payload.applications)
        ? payload.applications.find(item => item.id === ID) : null;
      if (!video || video.can_start !== true || video.state !== "prêt_non_testé") {
        throw new Error("Lancement non autorisé : " + (video?.message || video?.state || "état inconnu"));
      }
      const r2 = await fetch("/api/status", {credentials:"same-origin", cache:"no-store"});
      if (!r2.ok) throw new Error("Session administrateur indisponible");
      const auth = await r2.json();
      if (!auth.csrfToken) throw new Error("Jeton CSRF absent");
      const r3 = await fetch("/api/ecosystem/start", {
        method:"POST", credentials:"same-origin",
        headers:{"Content-Type":"application/json","X-CSRF-Token":auth.csrfToken},
        body:JSON.stringify({applicationId:ID})
      });
      const result = await r3.json();
      if (!r3.ok || result.ok !== true) throw new Error(result.error || "Lancement refusé par le Hub");
      info.textContent = "Demande acceptée : vérifier la fenêtre Video Studio sur le Mac.";
    } catch (err) {
      info.textContent = "Lancement refusé : " + String(err?.message || err);
    } finally {
      inFlight = false;
      button.disabled = false;
    }
  }

  function render() {
    const card = videoCard();
    if (!card || card.querySelector("[data-chest0-video-native-launch]")) return;
    const wrap = document.createElement("div");
    wrap.setAttribute("data-chest0-video-native-launch", "true");
    wrap.style.cssText = "margin-top:12px;padding-top:8px;border-top:1px solid #555;";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Lancer Video Studio (application graphique)";
    button.style.cssText = "padding:8px 12px;cursor:pointer;opacity:1;";
    const info = document.createElement("p");
    info.setAttribute("role", "status");
    info.style.fontSize = "0.85rem";
    info.textContent = "L'arrêt depuis le Hub reste interdit.";
    button.addEventListener("click", () => launch(button, info));
    wrap.append(button, info);
    card.append(wrap);
  }

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; render(); });
  });
  function init() {
    render();
    observer.observe(document.body, {childList:true, subtree:true});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();

/* Photo Cleaner: fixed native app, no forced stop, no public exposure. */
(() => {
  "use strict";
  const ID = "chest0-photo-cleaner";
  let busy = false;
  let scheduled = false;
  function locate() {
    for (const card of document.querySelectorAll("article,section,.ecosystem-card,.project-card,.card")) {
      const title = card.querySelector("h1,h2,h3,h4,h5");
      if (title && title.textContent.trim() === "Chest0 Photo Cleaner") return card;
    }
    return null;
  }
  function render() {
    const card = locate();
    if (!card || card.querySelector("[data-chest0-photo-launch]")) return;
    const wrap = document.createElement("div");
    wrap.setAttribute("data-chest0-photo-launch", "true");
    wrap.style.cssText = "margin-top:12px;padding-top:8px;border-top:1px solid #555";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Ouvrir Photo Cleaner (application macOS)";
    const notice = document.createElement("p");
    notice.setAttribute("role", "status");
    notice.textContent = "Ouverture locale uniquement ; arrêt Hub interdit.";
    button.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      try {
        const response = await fetch("/api/ecosystem/status", {credentials:"same-origin",cache:"no-store"});
        if (!response.ok) throw new Error("Statut indisponible");
        const data = await response.json();
        const app = Array.isArray(data.applications) ? data.applications.find(a => a.id === ID) : null;
        if (!app || app.can_start !== true) throw new Error(app?.message || "Application non certifiée");
        const authResponse = await fetch("/api/status", {credentials:"same-origin",cache:"no-store"});
        if (!authResponse.ok) throw new Error("Session locale indisponible");
        const auth = await authResponse.json();
        if (typeof auth.csrfToken !== "string") throw new Error("Jeton CSRF absent");
        const launchResponse = await fetch("/api/ecosystem/start", {
          method:"POST",credentials:"same-origin",
          headers:{"Content-Type":"application/json","X-CSRF-Token":auth.csrfToken},
          body:JSON.stringify({applicationId:ID})
        });
        const result = await launchResponse.json();
        if (!launchResponse.ok || result.ok !== true) throw new Error(result.error || "Ouverture refusée");
        notice.textContent = "Ouverture demandée à macOS ; vérifier la fenêtre Photo Cleaner.";
      } catch (error) {
        notice.textContent = "Photo Cleaner : " + String(error?.message || error);
      } finally { busy = false; button.disabled = false; }
    });
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Fermer Photo Cleaner (normalement)";
    closeButton.style.marginLeft = "8px";
    closeButton.addEventListener("click", async () => {
      if (busy) return;
      busy = true; closeButton.disabled = true;
      try {
        const statusResponse = await fetch("/api/ecosystem/status", {credentials:"same-origin",cache:"no-store"});
        if (!statusResponse.ok) throw new Error("Statut indisponible");
        const data = await statusResponse.json();
        const app = Array.isArray(data.applications) ? data.applications.find(a => a.id === ID) : null;
        if (!app?.can_stop) throw new Error("Fermeture non autorisée dans cette session Hub");
        const authResponse = await fetch("/api/status", {credentials:"same-origin",cache:"no-store"});
        if (!authResponse.ok) throw new Error("Session locale indisponible");
        const auth = await authResponse.json();
        if (typeof auth.csrfToken !== "string") throw new Error("Jeton CSRF absent");
        const response = await fetch("/api/ecosystem/stop", {
          method:"POST",credentials:"same-origin",
          headers:{"Content-Type":"application/json","X-CSRF-Token":auth.csrfToken},
          body:JSON.stringify({applicationId:ID})
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.error || "Fermeture refusée");
        notice.textContent = "Fermeture normale demandée à macOS ; aucun arrêt forcé.";
      } catch (error) { notice.textContent = "Photo Cleaner : " + String(error?.message || error); }
      finally { busy = false; closeButton.disabled = false; }
    });
    wrap.append(button, closeButton, notice);
    card.append(wrap);
  }
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; render(); });
  });
  function init() { render(); observer.observe(document.body, {childList:true,subtree:true}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
