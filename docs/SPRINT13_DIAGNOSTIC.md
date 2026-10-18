# Sprint 13 — diagnostic initial unique

18 octobre 2026. HEAD 84cb8c6649fe59a85a4c5bdd5c5b4608377c1519, main, arbre propre.
Base Sprint 12, version documentaire 1.7.0 ; registre Hub encore référencé 1.6.0.
Registre officiel unique : config/projects.registry.json, schéma 1, neuf projets,
six publics. Projection explicite par scripts/export_public_projects.py.
Admin loopback 8090, Host/Origin/CSRF contrôlés ; cinq commandes fermées dans
admin/ecosystem.py. Supervision Sprint 12 séparée du lancement.
Tests unittest et Deno, scripts/validate.sh ; sauvegardes existantes préservées.
Audits détaillés non présents dans docs ; référentiel V3 et état du dépôt utilisés.

Lot retenu : extension administrative optionnelle et versionnée du schéma 1,
migration en mémoire conservatrice, trois fiches privées, supervision enrichie,
protection du chemin exclu, tests et mécanisme unique de contrôle/restauration.
Aucune modification des données publiques nécessaire ; export identique attendu.
Video : aucun contrat Hub certifié dans le dépôt ; préparé, non activé, sans
inspection supplémentaire des autres applications. Vérifier ultérieurement son
entrée, son environnement, son port et sa santé avant ajout à la liste fermée.
Sauvegarde de travail préalable dans backups/sprint13 ; espace disponible 55 Gio.
