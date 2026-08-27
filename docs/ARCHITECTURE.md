# Architecture — Chest0 Hub

## Principe

Chest0 Hub sépare clairement :

- la structure HTML ;
- le design CSS ;
- la logique JavaScript ;
- les données JSON ;
- les médias ;
- l’interface d’administration locale.

Cette organisation permet de faire évoluer les contenus sans devoir réécrire les pages HTML.

## Site public

Le site public repose principalement sur :

```text
index.html
pages/
assets/
data/
manifest.webmanifest
sw.js
```

Il reste compatible avec GitHub Pages.

La racine du dépôt contient également des outils de développement qui ne font
pas partie du site. La configuration `_config.yml` exclut de la construction
GitHub Pages `admin/`, `tests/`, `scripts/`, `docs/`, les scripts de lancement,
la documentation racine, les sauvegardes et les trois JSON dormants. Les six
JSON actifs restent publiés, car le moteur public les charge directement.

## Données

Les contenus évolutifs sont stockés dans le dossier `data/`.

### Fichiers principaux

- `profile.json` : identité générale et profil ;
- `social.json` : réseaux sociaux ;
- `books.json` : livres ;
- `products.json` : produits ;
- `projects.json` : projets ;
- `blog.json` : blog et articles ;
- `links.json` : liens principaux ;
- `navigation.json` : navigation ;
- `settings.json` : paramètres généraux.

### Sources actives

Les fichiers suivants sont consommés par le site public et modifiables
depuis Chest0 Hub Admin :

- `profile.json` : identité commune, accueil, contact, logo, avatar et pieds de page ;
- `social.json` : cartes des réseaux sociaux ;
- `books.json` : identité auteur, page Amazon et fiches Livres ;
- `products.json` : fiches Produits et mise en avant ;
- `projects.json` : fiches Projets ;
- `blog.json` : identité du blog et articles sélectionnés.

Les identifiants `id` sont des clés techniques. Ils sont propagés dans le
DOM avec `data-content-id` afin de conserver une identité stable sans être
affichés comme du contenu éditorial.

### Sources dormantes ou réservées

Les fichiers suivants restent versionnés mais ne pilotent pas encore le
site et ne sont pas proposés dans l’Admin :

- `links.json` ;
- `navigation.json` ;
- `settings.json`.

Ils ne doivent pas être présentés comme des sources fonctionnelles tant
qu’un consommateur public explicite n’a pas été mis en place. Ils sont conservés
comme données historiques ou réservées dans le dépôt, mais exclus de l’app shell
et de la publication GitHub Pages.

## Médias

Les médias utilisés par le site sont stockés dans `assets/images/`.

Organisation actuelle :

```text
assets/images/avatar/
assets/images/books/
assets/images/products/
```

L’interface Admin peut importer les images sélectionnées depuis Finder et enregistrer leur chemin dans le fichier JSON correspondant.

Le retrait d’une image depuis une fiche supprime sa référence dans les données après enregistrement, mais conserve le fichier physique afin d’éviter une suppression accidentelle.

## Chest0 Hub Admin

L’interface d’administration locale se trouve dans `admin/`.

Elle comprend notamment :

```text
admin/server.py
admin/templates/
admin/static/
```

`admin/server.py` fournit le serveur Python local nécessaire aux fonctions d’administration.

L’interface permet de gérer :

- le Profil ;
- les Réseaux sociaux ;
- les Produits ;
- les Livres ;
- les Projets ;
- le Blog ;
- les médias associés.

Le serveur valide le type racine, les champs indispensables, les types de
champs, l’unicité des identifiants, les URL web et les chemins médias avant
toute sauvegarde ou écriture. Un refus de validation laisse le fichier
source inchangé.

## Fonctionnement local de l’Admin

Chest0 Hub Admin est lancé avec :

```bash
./run_admin.sh
```

L’interface est accessible localement à l’adresse :

```text
http://127.0.0.1:8090
```

L’Admin Python fonctionne uniquement en local et n’est pas exécuté par GitHub Pages.

### Contrôleur de l’écosystème local

`admin/ecosystem.py` isole le registre allowlisté et le cycle de vie des deux
applications locales. Les racines réelles viennent d’une configuration locale
ignorée par Git ; le navigateur ne reçoit jamais ces chemins, les commandes,
les PID ou les sorties système.

Le contrôleur construit lui-même des arguments `subprocess` sans shell, impose
les ports 8501 et 8502, vérifie la santé Streamlit et refuse tout arrêt d’un
processus qu’il n’a pas lancé. Un port occupé par un service non détenu n’est
jamais libéré automatiquement.

Les endpoints de démarrage et d’arrêt restent sur le serveur Admin loopback et
exigent les contrôles Host, Origin et un jeton CSRF en mémoire. La fermeture de
l’Admin nettoie les processus qu’il détient.

Le guide Exchange est un affichage de session sans persistance. Hub n’accède ni
aux téléchargements, ni à SQLite, ni aux projets AI Studio.

Les modifications réalisées avec l’Admin sont enregistrées dans les fichiers du projet local. Les fichiers destinés au site public peuvent ensuite être versionnés avec Git et publiés sur GitHub.

Le flux réel est :

```text
ADMIN LOCAL
    ↓
JSON ACTIF / MÉDIA LOCAL
    ↓
MOTEUR DE DONNÉES
    ↓
SITE LOCAL
    ↓
COMMIT ET PUSH MANUELS
    ↓
GITHUB PAGES
    ↓
SITE PUBLIC
```

L’Admin ne crée aucun commit, ne fait aucun push et ne déclenche aucun
déploiement.

## Tests permanents

La suite `tests/test_project.py` contrôle les JSON, les consommateurs,
l’Admin sur une copie temporaire, les pages, les assets, JavaScript, les
protections du Bloc 3 et l’absence de secret. Le test Deno
`tests/test_data_engine.js` vérifie le rendu du profil et
`tests/test_service_worker.js` vérifie dynamiquement l’isolation des caches.

Le point d’entrée unique `./scripts/validate.sh`, lancé depuis la racine,
orchestre ces tests, les contrôles de syntaxe et Git, ainsi qu’une comparaison
SHA-256 avant/après de `data/` et `assets/images/`. Les serveurs HTTP des tests
écoutent uniquement sur `127.0.0.1`, utilisent des ports temporaires et sont
arrêtés même en cas d’échec. La commande valide localement sans publier.

## Sauvegardes

Les sauvegardes automatiques de l’Admin sont stockées dans `backups/admin/`.

Les sauvegardes techniques du développement sont également placées dans `backups/`.

Le dossier `backups/` est ignoré par Git.

## Hébergement

Le site public est compatible avec GitHub Pages et ne nécessite pas de serveur Python en production.

Les périmètres sont distincts :

1. le site public statique comprend les pages et ressources nécessaires ;
2. `run_dev.sh` fournit uniquement le serveur public local de contrôle ;
3. `run_admin.sh` et `admin/` constituent l’Admin strictement local ;
4. le dépôt de développement contient en plus tests, scripts et documentation ;
5. GitHub Pages construit le périmètre public en appliquant `_config.yml`.

Le choix de la branche et du dossier source reste une configuration distante
GitHub à confirmer lors de chaque publication. Aucun fichier local ne peut à
lui seul modifier cette sélection distante.

L’interface Admin reste volontairement locale.

## PWA

Le Service Worker est désactivé sur `localhost` pendant le développement.

Il est activé automatiquement sur le site public.

Le cache actif porte le numéro `v1.2.0`. Grâce au préfixe `chest0-hub-`, son
activation supprime uniquement les anciens caches Chest0 Hub et conserve ceux
des autres applications. Les JSON dormants ne font pas partie de l’app shell.
