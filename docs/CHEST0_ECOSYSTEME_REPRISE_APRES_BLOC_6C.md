# Chest0 Écosystème — synthèse et reprise après le Bloc 6C

Document de référence établi le 27 août 2026.

## 1. État global certifié

Le parcours local de référence est opérationnel de bout en bout :

1. Chest0 Quiz Studio prépare et contrôle un quiz ;
2. Quiz Studio exporte manuellement un paquet Chest0 Quiz Exchange 1.0 ;
3. l'utilisateur télécharge le fichier JSON ;
4. Chest0 AI Studio analyse le paquet sans écriture persistante ;
5. AI Studio prépare les cinq segments audio Kokoro dans un espace temporaire ;
6. l'utilisateur écoute le résultat ;
7. le projet est promu uniquement après confirmation humaine explicite, ou la préparation est annulée ;
8. Chest0 Hub permet de lancer, ouvrir, surveiller et arrêter localement Quiz Studio et AI Studio.

Le Hub reste un orchestrateur local. Il ne lit, ne copie, ne valide, ne déplace et n'importe aucun paquet Exchange. Il ne génère aucun audio et ne promeut aucun projet.

## 2. Synthèse des Blocs 3 à 6

### Bloc 3 — preuve de contrat et import réversible

- **3A** : audit des trois dépôts, sauvegardes hors dépôt et baselines SHA-256 avant implémentation.
- **3B** : première implémentation du contrat canonique Chest0 Quiz Exchange 1.0 côté Quiz Studio.
- **3C** : analyse et import contrôlé côté AI Studio, avec préparation temporaire et absence d'écriture persistante avant confirmation.
- **3D** : workflow utilisateur complet, gestion explicite des collisions, génération Kokoro temporaire, écoute, promotion confirmée ou annulation réversible.

### Bloc 4 — export utilisateur contrôlé

Quiz Studio expose un parcours d'aperçu et de téléchargement JSON. Le paquet contient la question, quatre réponses, la bonne réponse, la taxonomie et les cinq segments narratifs ordonnés. Aucun chemin absolu n'est inclus dans Chest0 Quiz Exchange 1.0.

### Bloc 5 — validation réelle et correctif minimal

Le parcours a été validé dans les interfaces réelles. L'initialisation SQLite de Quiz Studio a été rendue strictement idempotente et le journal mutable `logs/app.log` a été retiré du contrôle d'intégrité persistant strict. L'aperçu, le téléchargement, l'analyse, la génération des cinq WAV, l'écoute et l'annulation ont été validés sans promotion involontaire.

### Bloc 6 — intégration du Hub

- **6A** : choix de l'Option B — panneau Admin « Écosystème local », ports fixes et rôle strict de lanceur/guide.
- **6B** : implémentation d'un registre allowlisté, gestion sûre des processus, états techniques, ouverture dans le navigateur, guide visuel, protection CSRF et absence d'exposition des chemins/PID/commandes.
- **6C** : certification globale, matrice de compatibilité et gel documentaire de la séquence.

## 3. Matrice de compatibilité certifiée

| Composant | Branche | Référence certifiée | Version applicative | Tests | Relation distante |
| --- | --- | --- | --- | --- | --- |
| Chest0 Quiz Studio | `main` | `9a4d0d443a20567cf0e363acff5b1d731e21839a` | 1.1.0 | 216/216 | aucun remote configuré |
| Chest0 AI Studio | `main` | `1d41248044cb25618dbedbb368f709132233505a` | 1.1.0 | 76/76 | aucun remote configuré |
| Chest0 Hub | `main` | `0b80d78e8eb27d3f74e6404cc64011a501b3ca01` | 1.2.0 | 27/27 Python + 2/2 Deno | `origin/main`, dépôt local en avance d'un commit avant ce document |
| Chest0 Quiz Exchange | — | contrat canonique | 1.0 | couvert par Quiz Studio et AI Studio | format inchangé |

Ports locaux réservés :

- Hub Admin : `127.0.0.1:8090` ;
- Quiz Studio : `127.0.0.1:8501` ;
- AI Studio : `127.0.0.1:8502`.

## 4. Certification du Bloc 6C

Les campagnes ont été rejouées intégralement le 27 août 2026 :

- Quiz Studio : 216 tests réussis sur 216 ;
- AI Studio : 76 tests réussis sur 76 ;
- Hub : 27 tests Python réussis sur 27 ;
- Hub : 2 tests Deno réussis sur 2 ;
- certification syntaxique, sécurité HTTP, intégrité et absence de bytecode parasite : réussie.

Les ports 8090, 8501 et 8502 étaient libres après les contrôles. Aucun processus applicatif résiduel n'a été détecté.

## 5. Intégrité persistante

La baseline du Bloc 6B est conservée hors dépôts dans :

`/private/tmp/chest0-block6b-20260827.RXqdpf`

Les manifestes finaux du Bloc 6C ont été générés dans :

- `/private/tmp/chest0-block6c-quiz-final.sha256` ;
- `/private/tmp/chest0-block6c-ai-final.sha256` ;
- `/private/tmp/chest0-block6c-hub-final.sha256`.

Les 2 412 empreintes sont strictement identiques à la baseline :

- Quiz Studio : 48 fichiers ;
- AI Studio : 2 349 fichiers ;
- Hub : 15 fichiers.

Aucune donnée utilisateur, base SQLite, ressource audio, image ou autre média persistant n'a été altéré.

## 6. Règles architecturales à préserver

- Chest0 Quiz Exchange 1.0 demeure le contrat canonique.
- Quiz Studio est seul responsable de l'export.
- AI Studio est seul responsable de l'analyse, de Kokoro et de la promotion.
- Toute promotion exige une confirmation humaine explicite.
- Hub ne réimplémente pas le validateur Exchange et ne manipule aucun paquet.
- Les applications ne partagent aucune base SQLite.
- Aucun chemin absolu ne doit apparaître dans un paquet ou dans l'API publique du Hub.
- Les commandes du Hub restent allowlistées, sans `shell=True`, et liées à `127.0.0.1`.
- Hub n'arrête que les processus qu'il a lui-même lancés.
- Toute évolution doit rester locale, observable et réversible par défaut.

## 7. Proposition de version et de tag Hub

Le panneau « Écosystème local » constitue une fonctionnalité nouvelle rétrocompatible. La proposition conforme au versionnement sémantique est donc :

- prochaine version Hub : **1.3.0** ;
- tag annoté proposé : **`v1.3.0`** ;
- message proposé : **`Chest0 Hub v1.3.0 — Écosystème local`**.

Le tag ne doit pas être créé sur un état annonçant encore la version 1.2.0. Avant le tag, un bloc de publication explicitement autorisé devra :

1. mettre à jour de façon cohérente les références de version Hub 1.2.0 vers 1.3.0 ;
2. ajouter la date de version au changelog ;
3. rejouer la certification Hub complète ;
4. créer un commit local de version ;
5. obtenir une confirmation humaine finale ;
6. créer le tag annoté `v1.3.0` ;
7. pousser `main`, puis le tag, uniquement sur autorisation explicite.

À la clôture du Bloc 6C, aucun tag, push ou déploiement n'a été effectué.

## 8. Procédure de reprise

Avant tout nouveau bloc :

1. relire intégralement ce document ;
2. vérifier les trois chemins, branches, HEAD et états Git ;
3. contrôler la relation de Hub avec `origin/main` ;
4. confirmer que les ports 8090, 8501 et 8502 sont libres ;
5. rejouer les campagnes proportionnées au périmètre ;
6. établir une nouvelle baseline SHA-256 avant toute modification persistante ;
7. arrêter immédiatement en cas d'écart inexpliqué.

## 9. Décision finale

**A — Séquence des Blocs 3 à 6 certifiée et prête pour gel de version.**

La prochaine action recommandée est un bloc court de préparation de la version Hub 1.3.0, suivi — après validation explicite — du tag et de la synchronisation Git. Tout nouveau développement fonctionnel devrait commencer seulement après ce gel.
