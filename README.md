# Chest0 Hub

Chest0 Hub est le portail numérique officiel de Chest0 JM.S.

## Objectif

Centraliser dans un espace unique :

- les livres Amazon ;
- le blog ;
- TikTok ;
- YouTube ;
- Instagram ;
- Facebook ;
- X ;
- la boutique Gumroad ;
- les projets numériques ;
- les moyens de contact.

## Site public

https://chest00.github.io/Chest0Hub/

## Technologies

- HTML5 ;
- CSS3 ;
- JavaScript ;
- JSON ;
- Progressive Web App ;
- Git ;
- GitHub ;
- GitHub Pages.

## Coût d'hébergement

0 €.

## Architecture

### Pages

- `index.html` : accueil ;
- `pages/livres.html` : livres ;
- `pages/blog.html` : blog ;
- `pages/produits.html` : produits ;
- `pages/projets.html` : projets ;
- `pages/apropos.html` : présentation ;
- `pages/contact.html` : contact.

### Données

Les contenus évolutifs sont stockés dans `data/`.

- `profile.json`
- `settings.json`
- `navigation.json`
- `links.json`
- `social.json`
- `books.json`
- `products.json`
- `projects.json`
- `blog.json`

Les six sources actives et administrables sont :

- `profile.json` ;
- `social.json` ;
- `books.json` ;
- `products.json` ;
- `projects.json` ;
- `blog.json`.

Une modification enregistrée dans l’Admin agit sur le rendu public
correspondant après rechargement du site local. Elle ne devient publique
qu’après validation, commit, push et déploiement GitHub Pages.

Les fichiers `links.json`, `navigation.json` et `settings.json` sont
conservés comme données historiques ou réservées. Ils ne pilotent pas
actuellement le site et ne sont pas présentés dans l’Admin.

### Ressources

Le dossier `assets/` contient :

- CSS ;
- JavaScript ;
- icônes ;
- images ;
- futurs avatars ;
- futures couvertures de livres ;
- futures images produits.

## Développement local

### 1. Ouvrir le Terminal dans VS Code

Puis saisir :

```bash
cd ~/Applications/Chest0Hub
./run_dev.sh
```

Puis ouvrir dans Brave :

```text
http://localhost:8080
```

Pour arrêter le serveur :

```text
Control + C
```

## Chest0 Hub Admin — V1.1.0

Chest0 Hub Admin est une interface locale permettant de gérer les contenus du site sans modifier manuellement les fichiers JSON.

### Lancer l’Admin

Dans le Terminal :

```bash
cd ~/Applications/Chest0Hub
./run_admin.sh
```

Puis ouvrir dans Brave :

```text
http://127.0.0.1:8090
```

Pour arrêter le serveur :

```text
Control + C
```

### Fonctions principales

L’Admin permet de gérer :

- le Profil ;
- les Réseaux sociaux ;
- les Produits ;
- les Livres ;
- les Projets ;
- le Blog.

La V1.1.0 ajoute également :

- l’import d’images depuis Finder ;
- l’aperçu avant enregistrement ;
- le remplacement des images ;
- le retrait sécurisé d’une image ;
- la gestion de l’avatar ;
- la gestion des couvertures de livres ;
- la gestion des images produits ;
- les aides contextuelles dans les formulaires ;
- une interface Admin responsive ;
- la protection contre les modifications non enregistrées ;
- des sauvegardes automatiques des fichiers JSON.

### Médias

Les médias importés sont stockés dans :

```text
assets/images/
```

avec notamment :

```text
assets/images/avatar/
assets/images/books/
assets/images/products/
```

Lorsqu’une image est retirée d’une fiche, sa référence est supprimée du JSON après enregistrement, mais le fichier physique est conservé afin d’éviter toute suppression accidentelle.

### Sauvegardes

Les sauvegardes automatiques créées par l’Admin sont stockées dans :

```text
backups/admin/
```

Le dossier `backups/` est ignoré par Git.

## Documentation

Documentation complémentaire :

- `docs/ARCHITECTURE.md` ;
- `docs/BRAND.md` ;
- `CHANGELOG.md`.

## Validation technique

Les contrôles permanents sont lancés avec :

```bash
python3 -B -m unittest discover -s tests -p 'test_*.py' -v
deno test --no-config \
  --allow-read=sw.js,assets/js/data-engine.js \
  tests/test_data_engine.js tests/test_service_worker.js
```

Les écritures Admin testées utilisent exclusivement une copie temporaire.
