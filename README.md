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

https://chest0.fr/

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
- `pages/contact.html` : contact ;
- `outils/index.html` : catalogue des outils gratuits ;
- `outils/equilibre-quotidien/index.html` : Mon équilibre quotidien ;
- `outils/journal-sommeil/index.html` : Mon journal du sommeil ;
- `outils/pauses-actives/index.html` : Mon planning de pauses actives.

Ces onze pages publiques sont accessibles depuis l’accueil et référencées dans
`sitemap.xml`. La page technique `404.html` est exclue du sitemap.

### Outils gratuits et Blog/RSS

Les trois outils utilisent les ressources de `assets/css/` et `assets/js/`.
L’équilibre quotidien et le planning de pauses actives ne conservent pas les
saisies. Le journal du sommeil conserve jusqu’à sept journées uniquement dans
le LocalStorage du navigateur, avec une commande d’effacement. Aucun outil
n’envoie les réponses à Chest0. Ils proposent une auto-observation ou une aide
à l’organisation, sans diagnostic ni prescription médicale.

Les articles restent hébergés sur Blogger. `pages/blog.html` affiche le
catalogue de `data/blog.json` ; `feed.xml` diffuse les articles activés.
L’Admin régénère ce flux lors de l’enregistrement du catalogue Blog. À la
clôture V1, le catalogue et le RSS contiennent les mêmes cinq articles.
Le flux public est disponible sur https://chest0.fr/feed.xml.

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

## Chest0 Hub Admin — V1.3.0

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

## SEO et indexation

Le domaine public canonique de Chest0 Hub est :

```text
https://chest0.fr/
```

Le référencement technique repose sur :

- `sitemap.xml` : liste les onze pages publiques ;
- `robots.txt` : autorise l’exploration du site et référence le sitemap ;
- des URL canoniques en `https://chest0.fr/` ;
- des métadonnées SEO, Open Graph, Twitter et Schema.org sur les pages publiques ;
- Google Search Console pour le suivi de l’indexation Google ;
- Bing Webmaster Tools pour le suivi de l’indexation Bing ;
- IndexNow pour notifier les moteurs compatibles après une publication.

Le sitemap public est disponible à l’adresse :

```text
https://chest0.fr/sitemap.xml
```

La clé IndexNow est publiée à la racine du site. Le script
`scripts/indexnow.py` permet d’envoyer les URL publiées à IndexNow.

Exemple de contrôle sans envoi réseau :

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -B scripts/indexnow.py --dry-run https://chest0.fr/
```

Une notification IndexNow doit être effectuée uniquement après la publication
effective des modifications sur `https://chest0.fr/`. L’acceptation d’une
notification par IndexNow ne garantit pas son indexation par un moteur de
recherche.

## Validation technique

Depuis la racine du dépôt, la campagne qualité complète se lance avec une
commande unique :

```bash
./scripts/validate.sh
```

Prérequis : macOS, Bash, Python 3, Deno, Git et les outils système `find`,
`sort`, `xargs` et `shasum`. Le script signale explicitement tout outil absent.

La campagne contrôle les syntaxes, les neuf JSON, les six sources actives et
les trois sources dormantes documentées, les pages principales et leurs
ressources, les intégrations des trois outils,
l’Admin local, la PWA, les protections de sécurité des Blocs 3 et 4, les
secrets évidents, Git et l’intégrité des données/médias. Les écritures Admin
sont testées exclusivement sur une copie temporaire et les serveurs de test
sont arrêtés automatiquement.

Un succès se termine par `PASS — certification locale complète`. En cas de
`FAIL` ou d’échec d’un test, lire l’étape et le message immédiatement au-dessus,
corriger la cause, puis relancer la même commande. Cette commande ne crée aucun
commit, ne pousse rien et ne déclenche aucun déploiement GitHub.

## Périmètres et publication

- Le **site public** contient les onze pages, les ressources nécessaires, les
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

Une publication suit la séquence : valider, committer, pousser sur `origin/main`,
puis vérifier le build GitHub Pages et le site public. L’Admin ne publie pas.
Les fichiers internes sont exclus par `_config.yml`.

## Situation de Chest0 Hub V1

Le Sprint final 3/3 clôture Chest0 Hub V1 le 12 septembre 2026. Le tag stable
`v1.4.0` identifie cette livraison, après `v1.3.0` : elle comprend les trois
outils gratuits, le Blog/RSS et les consolidations déjà présentes dans le dépôt.
La certification complète comporte 37 tests Python et 6 tests JavaScript/Deno.

L’Admin conserve sa version de composant V1.3.0 et le cache conserve son
identifiant `chest0-hub-v1.3.0-pauses-actives` : cette clôture documentaire
ne change ni le code ni les ressources publiques et ne nécessite pas de
renouveler le cache. Le tag Git identifie la livraison globale.

Aucun sprint V1 ne reste à réaliser. Les nouveaux outils, la croissance SEO,
les backlinks et les améliorations facultatives relèvent de V2 ou de
l’exploitation continue. La référence historique à un avatar absent dans
`data/settings.json` reste une dette dormante : ce fichier n’est ni consommé
par le site ni publié. Les rapports datés de `docs/` décrivent leur état
historique ; le présent README et `docs/ARCHITECTURE.md` décrivent l’état actuel.
