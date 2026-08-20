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

La V1.1.0 ajoute une interface d’administration locale dans `admin/`.

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

Les modifications réalisées avec l’Admin sont enregistrées dans les fichiers du projet local. Les fichiers destinés au site public peuvent ensuite être versionnés avec Git et publiés sur GitHub.

## Sauvegardes

Les sauvegardes automatiques de l’Admin sont stockées dans `backups/admin/`.

Les sauvegardes techniques du développement sont également placées dans `backups/`.

Le dossier `backups/` est ignoré par Git.

## Hébergement

Le site public est compatible avec GitHub Pages et ne nécessite pas de serveur Python en production.

L’interface Admin reste volontairement locale.

## PWA

Le Service Worker est désactivé sur `localhost` pendant le développement.

Il est activé automatiquement sur le site public.
