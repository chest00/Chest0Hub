# CHEST0 HUB — SPRINT 13 — RAPPORT FINAL

DEBUT RAPPORT CHEST0 SPRINT 13

Date : 18 octobre 2026. Périmètre : Chest0Hub exclusivement.

## Version et Git

Départ : v1.7.0 documentée (fiche historique Hub v1.6.0 conservée comme référence).
Arrivée : v1.8.0 locale, déclarée dans CHANGELOG et gouvernance du Hub.
Commit initial et final : 84cb8c6649fe59a85a4c5bdd5c5b4608377c1519.
Branche main, propre avant intervention ; modifications Sprint 13 non commitées.
Référence locale origin/main : 007983b2a39aa19cc5f644785588c8ef4420f20e.
Aucun fetch, push, release, DNS, Cloudflare ni déploiement. Site chest0.fr non
consulté ni modifié ; son état courant n'est pas certifié par cette mission.

## Livraison fonctionnelle

Registre officiel unique config/projects.registry.json : 12 fiches, six publiques
historiques conservées avec leurs identifiants, textes, URL et parcours inchangés.
Contrat administratif governance version 1 optionnel sur schéma 1 : états de
conception/développement/test/stabilité/suspension/inconnu ; validation distincte ;
disponibilité locale/publique/future/indisponible/inconnue/suspendue ; provenance,
date de vérification documentaire, mode d'accès et quatre versions indépendantes.
Migration des anciennes fiches en mémoire, sans réécriture automatique.
Capacités disponibles vérifiées, non vérifiées, prévues ou non prises en charge.
La supervision Admin présente ces données et conserve les états runtime séparés.
Les accès et erreurs des cinq lanceurs restent servis par le mécanisme existant.
Refus du chemin AI exclu avant inspection par le catalogue et le chargeur de
lanceurs ; si cette racine est configurée, son lancement est volontairement refusé.

Éditions Studio : privé, conception documentée, aucun code applicatif créé,
aucun lanceur. Exports Markdown/DOCX/EPUB/PDF et échanges Blog/Video/Social/AI/Quiz
prévus uniquement ; KDP sans publication automatique. Aucun développement certifié.
Video Studio : fiche privée préparée, non activée. Aucun contrat d'entrée/port/
environnement/santé certifié dans le Hub ; qualification dédiée nécessaire avant
activation. Aucun dossier Video inspecté, aucune adaptation de Video effectuée.
Accompagnement : fiche privée suspendue. Cloud reste privé. Les autres studios,
Photo Cleaner et Mes Démarches conservent leurs données et références historiques.
Les outils auxiliaires restent dans leurs parcours existants ; aucun ajout non
justifié au registre. Aucun dossier externe d'application ouvert ou modifié.

## Validation exécutée

Campagne scripts/validate.sh : RÉUSSIE sur l'arbre livré (hors ajout du rapport).
72 tests Python et 6 tests Deno réussis ; syntaxe Python et shell, diff --check,
contrôles HTTP réels sur serveurs de test 127.0.0.1, Host/Origin/CSRF, liste fermée,
applications absentes, erreurs de registre, non-régression Sprint 12, migration,
contrats inconnus, non-opérationnalité Éditions, filtrage privé et injection.
Export explicite --check : réussi ; projection strictement identique à l'artefact
public existant. 16 fichiers données/médias comparés à la sauvegarde initiale :
empreintes inchangées. Aucun historique ni secret modifié.
Restauration et refus d'écrasement : tests isolés réussis. Vérification additionnelle
du manifeste complet et restauration de l'ensemble des fichiers livrés en copie
isolée effectuées lors de la clôture ; aucun retour arrière sur le dépôt réel.

Premier passage : serveurs bloqués par sandbox et deux fixtures utilisant des
chemins temporaires macOS non canoniques ; fixtures corrigées dans un seul lot.
Passage autorisé : tests tous réussis, dernier contrôle signalant des caches pyc.
Caches conservés hors projet dans le répertoire temporaire
chest0-s13-preserved-caches-ovo1agx7 ; campagne finale entièrement réussie.
Journaux initial et final conservés dans backups/sprint13.
Aucun studio externe démarré, aucune API fournisseur interrogée ; les tests
simulés ne prouvent pas le fonctionnement réel des applications externes.
Aucune validation visuelle humaine ni certification de reprise applicative complète.

## Fichiers livrés

- admin/registry.py : extension et migration conservatrice, exclusion.
- admin/ecosystem.py : refus du chemin explicitement exclu.
- admin/overview.py et admin/static/overview.js : supervision enrichie.
- config/projects.registry.json : consolidation et trois nouvelles fiches privées.
- tests/test_registry.py : attentes adaptées aux douze fiches.
- tests/test_sprint13.py : contrats, migration, exclusion, export, restauration.
- scripts/sprint13_update.py : procédure unique de vérification/restauration.
- docs/REGISTRY.md : contrat, limites et procédure.
- docs/SPRINT13_DIAGNOSTIC.md : diagnostic initial.
- docs/SPRINT13_RAPPORT_FINAL.md : clôture et reprise.
- CHANGELOG.md : v1.8.0 locale.

## Sauvegarde, mise à jour et restauration

Mise à jour déjà appliquée au dépôt local ; aucune installation supplémentaire
nécessaire. Python standard et outils déjà présents, aucune dépendance installée.
Sauvegarde de travail distincte backups/sprint13/before, SHA-256 initiaux dans
baseline.json. Cette sauvegarde conserve les fichiers suivis du Hub ; elle est
plus large que le sous-ensemble modifié et ne contient pas la configuration
locale ignorée. Copies livrées dans after ; manifeste avant/après manifest.json.
Ces fichiers restent ignorés par Git et sont exclus de la publication statique.
Sauvegardes protégées antérieures et disque externe non utilisés et non modifiés.

Procédure reproductible : python3 -B scripts/sprint13_update.py depuis le dépôt.
Elle vérifie branche, HEAD, empreintes actuelles et sauvegardes puis les tests.
Pour restaurer : ajouter --restore à cette même procédure. Toute divergence
interrompt avant restauration ; ajouts archivés dans retired au lieu de suppression.
Il s'agit d'une mise à jour locale déjà appliquée et d'un retour arrière gardé,
pas d'un installateur de distribution vers une autre machine. Une prévalidation
échouée n'entraîne pas de restauration automatique du travail courant.
Arrêter l'Admin et ne pas éditer pendant une restauration : pas de verrou système
contre un autre processus ; une erreur I/O peut interrompre une copie. L'outil
ne prétend pas garantir une transaction atomique multi-fichiers dans ce cas.
Conserver ensemble le dépôt et backups/sprint13 pour une reprise reproductible.

## Limites et prochaine mission

Les versions installées/Git/déployées externes restent inconnues faute de preuve.
La référence stable historique est distincte de la version locale du Hub.
Aucun nouveau health-check, arrêt externe ou connecteur fictif. Pas de bus de
messages, de partage SQLite ou d'effet distant. Contrat administratif validé
structurellement ; qualification réelle par application encore nécessaire.
Les chemins exclus ne peuvent pas être pilotés pendant ce périmètre de mission.
La procédure ne couvre pas une réinstallation complète de macOS ni les comptes.

Prompt de reprise :
« Reprendre Chest0 Hub v1.8.0 local après Sprint 13. Lire docs/SPRINT13_RAPPORT_FINAL.md,
docs/REGISTRY.md et le manifeste backups/sprint13/manifest.json. Préserver les
modifications non commitées et les six fiches publiques. Qualifier, sur mandat
explicite, le contrat d'intégration Video (entrée, environnement, port, santé,
lancement/arrêt) avant activation dans la liste fermée. Aucun autre dépôt modifié,
aucun push ni déploiement. Ne jamais accéder au dossier Desktop/Projet Chest0 AI
Studio. Distinguer tests Hub, preuve documentaire et fonctionnement externe. »

FIN RAPPORT CHEST0 SPRINT 13
