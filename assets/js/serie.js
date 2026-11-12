"use strict";
// Vitrine « Intelligence relationnelle » : affiche « Disponible » ou « Précommande » selon la date de sortie de chaque tome.
(function () {
    const aujourdhui = new Date();
    document.querySelectorAll(".serie-tome[data-sortie]").forEach(function (tome) {
        const sortie = new Date(tome.dataset.sortie + "T00:00:00");
        const statut = tome.querySelector(".serie-statut");
        const lien = tome.querySelector(".serie-lien");
        const disponible = aujourdhui >= sortie;
        if (statut) {
            statut.textContent = disponible ? "Disponible · livre et livre audio" : "En précommande · sortie le " + statut.dataset.date;
            statut.classList.add(disponible ? "est-disponible" : "est-precommande");
        }
        if (lien) lien.textContent = disponible ? "Voir sur Amazon" : "Précommander sur Amazon";
    });
})();
