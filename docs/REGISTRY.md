# Registre central Chest0 — schéma 1

Hub Admin organise et pilote ; Hub Public présente et commercialise ; chaque
application conserve son code, ses données, ses versions et son autonomie.

## Source et validation

`config/projects.registry.json` contient `schema_version: 1` et `projects`.
1 à 64 projets, fichier JSON de 128 Kio maximum, identifiants uniques de 64
caractères maximum (minuscules/chiffres/tirets). Clés inconnues, doublons JSON,
versions inconnues, types erronés, liens non HTTPS, credentials/query/fragment
dans les liens et dépendances absentes sont refusés. Une version inconnue
n’est jamais migrée silencieusement. Lecture bornée, sans écriture automatique,
liens symboliques et fichiers non réguliers/multi-liés refusés.

Champs obligatoires (valeur null ou liste vide lorsque inconnue) :
project_id, name, short_name, description, category, state, stable_version,
stable_commit, type, platforms, admin_visible, public_visible,
commercial_status, integration_levels, launch_id, repository, documentation,
public_links, capabilities, dependencies, notes. Les textes sont bornés à 500
caractères ; listes de 16 éléments maximum, liens 8 maximum. Les plateformes
prévues portent explicitement cette mention, elles ne signifient pas disponible.
Aucun prix ni lien de vente fictif. Les versions sont des références déclarées,
pas des vérifications réseau ou des promesses d’installation.

Niveaux indépendants : A référencée, B présentée, C commercialisée, D pilotée,
E interconnectée, F automatisable. Il n’existe aucune progression obligatoire.
Commercial : non_commercial, gratuit, commercialisation_prevue, commercialise.
Types : application, produit, infrastructure, hub, service.
États : stable, developpement, prevu, prive.
Capacités déclaratives : local_api, versioned_json_exchange, cli,
launchable_local_app, public_web_app, product_page, analytics_source.
Une capacité ne déclenche ni appel API ni transfert de fichier.

## Projets

Hub natif ; Social Studio v1.0.0 (commit fourni par le propriétaire) ; AI Studio ;
Quiz Studio ; Mes Démarches de Vie ; Photo Cleaner ; Market Intelligence ;
Chest0 Cloud privé. Aucune disponibilité de produit futur n’est inventée.
Aucune version des autres projets n’est inspectée pour alimenter ce registre.
Les versions observées déjà affichées par le lanceur restent distinctes.

## Privé et public

Le catalogue interne vit sous config/, exclu de GitHub Pages. Les chemins
machine restent exclusivement dans `config/ecosystem.local.json`, ignoré par
Git. Aucun chemin n’est copié dans le registre, dans la réponse API ou l’export.
La configuration locale facultative lie un identifiant à `{ "root": "..." }`.
Son absence signifie non configuré ; la présence d’un dossier ne signifie pas
opérationnel. Les lectures du catalogue ne font aucune sonde réseau.
Pour une autre machine, adapter cette configuration locale seulement.

`public_export(payload)` valide puis projette uniquement les projets public_visible
et les champs project_id, name, short_name, description, category, type,
platforms, commercial_status, public_links et state. Pas de notes, références techniques,
commandes, versions observées, chemins ou documentation administrative.
Aucun export n’est automatiquement enregistré. Depuis le Sprint 11, la commande
explicite décrite ci-dessous prépare le dérivé consommé par la page Projets. `data/projects.json` est encore la sélection éditoriale publiée,
non une seconde configuration de pilotage. Une publication future devra choisir
explicitement un contenu et valider son export. Ne jamais servir le dépôt brut
sur Internet : run_dev.sh est un serveur de travail loopback qui peut servir
les fichiers du dépôt, contrairement au périmètre filtré GitHub Pages.

## Admin et lancement

Le panneau existant présente toutes les entrées visibles. Les projets sans
lanceur n’ont aucun bouton de lancement. Les trois accès existants restent
allowlistés dans ecosystem.py, commandes construites sans shell. Aucun texte
libre du registre ne devient une commande ; launch_id doit être l’identifiant
lui-même et appartenir aux trois accès prévus. Les routes POST existantes
conservent Host/Origin/CSRF et arrêt uniquement des processus détenus.
Une configuration de racine absente n’arrête plus les deux autres projets.
Le catalogue ne démarre jamais les applications. Le polling historique des
états des trois lanceurs reste le comportement antérieur de l’Admin ; il est
simulé dans les tests, aucune application réelle n’a été appelée au Sprint 10.

## Ajouter un projet et tester

Ajouter une entrée au JSON avec identifiant unique, valeurs vérifiées, listes
vides/null pour les données inconnues et launch_id null. Les dépendances sont
des références logiques, jamais une orchestration. Aucun changement de code
n’est nécessaire pour un nouveau projet utilisant les types/capacités existants.
Ajouter un nouveau type de lancement exige au contraire une modification
explicite de l’allowlist et ses tests ; le registre ne peut l’autoriser seul.

`python3 -B -m unittest discover -s tests -p test_registry.py -v` teste schéma,
export, corruption, chemins, absence, commandes et HTTP temporaire. Un test
Node VM exerce le rendu DOM avec plusieurs projets, sans navigateur ni réseau.
`bash scripts/validate.sh` exécute la régression Python/Deno, HTML/ressources,
syntaxes, SEO/PWA, intégrité données/médias, secrets et git diff --check.
Les scénarios sont fictifs, dans des répertoires temporaires nettoyés.

Hors périmètre : automatisation inter-applications, API métier appelée,
boutique/paiement, collecte de statistiques, déploiement, redesign public.
Aucun document maître n’a été recopié ; les exigences de reprise guident ce sprint.

## Mise à jour publique — Sprint 11

Le propriétaire a autorisé public_visible, dans cet ordre, pour Hub, AI Studio,
Quiz Studio, Social Studio, Photo Cleaner et Market Intelligence. Cloud et Mes
Démarches de Vie restent non publics. Cloud et un état
prive sont refusés à l’export même si public_visible est activé par erreur.
Le schéma public 1 reçoit le champ additif state ; le schéma administratif ne
change pas. Le client vérifie strictement champs/types/états/liens avant rendu.

1. Modifier volontairement les informations publiques et la visibilité dans le
registre après décision éditoriale. Les notes et champs privés ne servent pas
à rédiger automatiquement une description publique.
2. Exécuter `python3 -B scripts/export_public_projects.py --write` : validation,
projection, écriture temporaire puis remplacement atomique, JSON déterministe.
Aucun timestamp variable ni chemin local n’est généré. Un échec garde l’export
précédent. Les liens symboliques de destination sont refusés.
3. Vérifier `python3 -B scripts/export_public_projects.py --check`, puis la
certification complète. Toute divergence est signalée, jamais corrigée à l’insu
du propriétaire. Le serveur Admin ne lance pas ce générateur.
4. Prévisualiser avec run_dev.sh et approuver l’aspect. Commit/tag/push constituent
une opération distincte autorisée séparément ; Pages conserve sa configuration.

Le catalogue éditorial public historique n’est ni réécrit ni importé dans le
registre administratif. Les anciens textes, dont certains parlent de versions
anciennes, sont présentés dans des détails « Présentation historique » avec
avertissement de contexte. Le registre courant fournit nom/rôle/état/plateformes.

Photo Cleaner est en développement : macOS et Windows prévus, Android ultérieur,
Web/PWA à étudier. Aucun prix/version/date/capture/téléchargement inventé. Aucun
bouton d’achat : le schéma actuel n’identifie pas de lien officiel de vente.
Un lien public générique reste un lien « Site officiel », jamais assimilé à un
paiement. Une future vente nécessitera statut compatible et validation explicite
d’un lien commercial avant toute présentation comme tel.

Confidentialité : navigateur public = fichiers data/ publics seulement ; aucune
route Admin, commande ou config machine. Les exclusions Pages admin/config/
backups/scripts/tests sont conservées. Le serveur de développement brut reste
strictement loopback et ne constitue pas le périmètre publié. Les descriptions
sont du texte, pas du HTML ; aucun chemin provenant du registre privé n’est
injecté dans les liens. Aucun service distant requis pour le rendu.


Correction Sprint 11 : six cartes, ordre issu du registre. Social Studio conserve
son état stable et macOS local. Market Intelligence présente un périmètre visé
en développement, sans ordres réels en V1, promesse financière ou accès privé.
Les intégrations futures Photo Cleaner et Video Studio restent hors périmètre ;
Video Studio n’est pas une septième carte.
