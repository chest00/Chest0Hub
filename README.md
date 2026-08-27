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
actuellement le site, ne sont pas présentés dans l’Admin et sont exclus de la
publication GitHub Pages.

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

## Chest0 Hub Admin — V1.2.0

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

### Écosystème local

L’Admin comprend un panneau local permettant de contrôler Chest0 Quiz Studio
et Chest0 AI Studio. Les chemins propres à la machine sont définis dans
`config/ecosystem.local.json`, créé à partir de
`config/ecosystem.example.json` et ignoré par Git.

- Hub Admin : `127.0.0.1:8090` ;
- Quiz Studio : `127.0.0.1:8501` ;
- AI Studio : `127.0.0.1:8502`.

Le panneau affiche disponibilité, version, HEAD abrégé et état technique. Il
peut lancer et arrêter uniquement les processus qu’il possède. Les commandes
sont allowlistées côté serveur et les actions sont protégées par CSRF.

Le guide Quiz Exchange reste informatif : Hub ne recherche, ne lit, ne copie et
ne valide aucun JSON. La sélection du fichier, Kokoro, la confirmation et la
promotion restent entièrement dans AI Studio.

Depuis la V1.1.0, l’Admin comprend également :

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

Depuis la racine du dépôt, la campagne qualité complète se lance avec une
commande unique :

```bash
./scripts/validate.sh
```

Prérequis : macOS, Bash, Python 3, Deno, Git et les outils système `find`,
`sort`, `xargs` et `shasum`. Le script signale explicitement tout outil absent.

La campagne contrôle les syntaxes, les neuf JSON, les six sources actives et
les trois sources dormantes documentées, les sept pages et leurs ressources,
l’Admin local, la PWA, les protections de sécurité des Blocs 3 et 4, les
secrets évidents, Git et l’intégrité des données/médias. Les écritures Admin
sont testées exclusivement sur une copie temporaire et les serveurs de test
sont arrêtés automatiquement.

Un succès se termine par `PASS — certification locale complète`. En cas de
`FAIL` ou d’échec d’un test, lire l’étape et le message immédiatement au-dessus,
corriger la cause, puis relancer la même commande. Cette commande ne crée aucun
commit, ne pousse rien et ne déclenche aucun déploiement GitHub.

## Périmètres et publication

- Le **site public** contient les sept pages, les ressources nécessaires, les
  six JSON actifs, le manifest et le Service Worker.
- Le **serveur public local** (`./run_dev.sh`) sert le dépôt de travail sur
  `127.0.0.1:8080` pour permettre les vérifications avant publication.
- L’**Admin local** (`./run_admin.sh`) écoute uniquement sur
  `127.0.0.1:8090` et n’est jamais requis par le site public.
- Le **dépôt de développement** contient aussi les tests, scripts,
  documentation, données dormantes et outils locaux.
- La **publication GitHub Pages** est construite depuis la branche configurée
  sur GitHub. `_config.yml` exclut les éléments internes lorsque la racine du
  dépôt est utilisée comme source.

Une publication reste une action manuelle distincte : valider, committer,
pousser, puis vérifier le build GitHub Pages. La version active préparée dans
le dépôt est V1.2.0 ; sa publication et la création du tag restent des étapes
séparées, réalisées uniquement après approbation du candidat certifié.
