# Audit performance et mobile — Chest0 Hub

Date : 2026-09-07

Commit audité : `5ee567359e22637583a8b675d80b40e2143f3abe`

Domaine : `https://chest0.fr`

## Résumé

- 7/7 pages publiques testées en production avec réponse HTTP 200.
- Contrôle statique mobile/accessibilité de base effectué sur les 7 pages.
- Inventaire local des ressources statiques effectué.
- Aucun changement fonctionnel du site n'est réalisé par ce sprint.

## Pages publiques

| URL | HTTP | Taille HTML reçue (octets) |
| --- | ---: | ---: |
| `/` | 200 | 10758 |
| `/pages/apropos.html` | 200 | 5266 |
| `/pages/blog.html` | 200 | 5068 |
| `/pages/contact.html` | 200 | 4606 |
| `/pages/livres.html` | 200 | 5335 |
| `/pages/produits.html` | 200 | 4601 |
| `/pages/projets.html` | 200 | 4626 |

Total HTML reçu : 40260 octets.

Plus grande page HTML reçue : 10758 octets.

## Structure mobile et accessibilité de base

- index.html: viewport=OK, lang=OK, images=7, alt manquant=0
- pages/apropos.html: viewport=OK, lang=OK, images=3, alt manquant=0
- pages/blog.html: viewport=OK, lang=OK, images=2, alt manquant=0
- pages/contact.html: viewport=OK, lang=OK, images=2, alt manquant=0
- pages/livres.html: viewport=OK, lang=OK, images=2, alt manquant=0
- pages/produits.html: viewport=OK, lang=OK, images=2, alt manquant=0
- pages/projets.html: viewport=OK, lang=OK, images=2, alt manquant=0

## Ressources statiques locales

Total ressources recensées : 27 fichiers, 2168574 octets.

Les 15 plus volumineuses :
- `assets/images/products/image-principale-hero-d60f3b0b.png` — 1711377 octets
- `assets/images/products/template-gumroad-bedc3ce6.png` — 222260 octets
- `assets/images/avatar/img-1248-3cd365c1.jpeg` — 72842 octets
- `admin/static/admin.js` — 49836 octets
- `assets/js/data-engine.js` — 29576 octets
- `assets/css/style.css` — 23379 octets
- `admin/static/admin.css` — 14573 octets
- `assets/images/books/digital-book-227d2acd.jpeg` — 8152 octets
- `assets/images/books/digital-book-detox-7415db45.jpeg` — 7990 octets
- `assets/images/books/digital-book-anti-stress-bf228c18.jpeg` — 7395 octets
- `assets/js/app.js` — 7362 octets
- `sw.js` — 3971 octets
- `tests/test_data_engine.js` — 2940 octets
- `tests/test_service_worker.js` — 2488 octets
- `assets/icons/chest0-mark.svg` — 609 octets

## Lighthouse / Core Web Vitals

Non exécuté : aucun Lighthouse/Chrome automatisable garanti par ce sprint.

Les métriques de terrain Core Web Vitals peuvent être indisponibles ou peu représentatives pour un site récent ou à faible trafic. Ce rapport ne les invente pas.

## Conclusion technique

Cet audit constitue un état des lieux non destructif. Toute optimisation ultérieure devra être justifiée par une anomalie mesurée ou un gain concret, et non par une modification arbitraire.
## Lighthouse mobile — 7 pages publiques

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
| --- | ---: | ---: | ---: | ---: |
| Accueil | 98 | 100 | 100 | 100 |
| À propos | 100 | 100 | 100 | 100 |
| Blog | 92 | 100 | 100 | 100 |
| Contact | 99 | 100 | 100 | 100 |
| Livres | 95 | 100 | 100 | 100 |
| Produits | 84 | 100 | 100 | 100 |
| Projets | 91 | 98 | 100 | 100 |

Scores minimums observés : Performance **84**, Accessibilité **98**, Bonnes pratiques **100**, SEO **100**.

Les scores Lighthouse sont des mesures de laboratoire et peuvent varier légèrement entre deux exécutions.

### Points techniques sous 90 % détectés

- `speed-index` — Speed Index
- `unminified-javascript` — Minify JavaScript
- `cache-insight` — Use efficient cache lifetimes
- `network-dependency-tree-insight` — Network dependency tree
- `render-blocking-insight` — Render-blocking requests
- `image-delivery-insight` — Improve image delivery
- `cumulative-layout-shift` — Cumulative Layout Shift
- `layout-shifts` — Avoid large layout shifts
- `cls-culprits-insight` — Layout shift culprits
- `unsized-images` — Image elements do not have explicit `width` and `height`
- `heading-order` — Heading elements are not in a sequentially-descending order
## Diagnostic ciblé des performances

Ce diagnostic cible les trois pages dont le score Performance était le plus faible lors de la campagne complète. Il ne modifie ni le site public ni les données administrables.

### Produits

- Performance : **84**
- Accessibilité : **100**
- Bonnes pratiques : **100**
- SEO : **100**

Mesures principales :
- First Contentful Paint : 0.8 s
- Largest Contentful Paint : 0.9 s
- Speed Index : 0.8 s
- Total Blocking Time : 0 ms
- Cumulative Layout Shift : 0.319

Points mesurés à examiner :
- `unminified-javascript` — Minify JavaScript — Est savings of 3 KiB ; gain potentiel ≈ 150 ms ; gain potentiel ≈ 3 Kio
- `unsized-images` — Image elements do not have explicit `width` and `height`
- `render-blocking-insight` — Render-blocking requests
- `network-dependency-tree-insight` — Network dependency tree
- `layout-shifts` — Avoid large layout shifts — 3 layout shifts found
- `image-delivery-insight` — Improve image delivery — Est savings of 1,876 KiB
- `cumulative-layout-shift` — Cumulative Layout Shift — 0.319
- `cls-culprits-insight` — Layout shift culprits
- `cache-insight` — Use efficient cache lifetimes — Est savings of 1,743 KiB

### Projets

- Performance : **91**
- Accessibilité : **98**
- Bonnes pratiques : **100**
- SEO : **100**

Mesures principales :
- First Contentful Paint : 0.8 s
- Largest Contentful Paint : 0.9 s
- Speed Index : 0.8 s
- Total Blocking Time : 0 ms
- Cumulative Layout Shift : 0.2

Points mesurés à examiner :
- `unminified-javascript` — Minify JavaScript — Est savings of 3 KiB ; gain potentiel ≈ 150 ms ; gain potentiel ≈ 3 Kio
- `render-blocking-insight` — Render-blocking requests
- `network-dependency-tree-insight` — Network dependency tree
- `layout-shifts` — Avoid large layout shifts — 2 layout shifts found
- `heading-order` — Heading elements are not in a sequentially-descending order
- `cumulative-layout-shift` — Cumulative Layout Shift — 0.2
- `cls-culprits-insight` — Layout shift culprits
- `cache-insight` — Use efficient cache lifetimes — Est savings of 10 KiB

### Blog

- Performance : **92**
- Accessibilité : **100**
- Bonnes pratiques : **100**
- SEO : **100**

Mesures principales :
- First Contentful Paint : 0.8 s
- Largest Contentful Paint : 0.9 s
- Speed Index : 0.8 s
- Total Blocking Time : 0 ms
- Cumulative Layout Shift : 0.179

Points mesurés à examiner :
- `unminified-javascript` — Minify JavaScript — Est savings of 3 KiB ; gain potentiel ≈ 150 ms ; gain potentiel ≈ 3 Kio
- `render-blocking-insight` — Render-blocking requests
- `network-dependency-tree-insight` — Network dependency tree
- `layout-shifts` — Avoid large layout shifts — 2 layout shifts found
- `cumulative-layout-shift` — Cumulative Layout Shift — 0.179
- `cls-culprits-insight` — Layout shift culprits
- `cache-insight` — Use efficient cache lifetimes — Est savings of 10 KiB


## Décision d'optimisation

Le diagnostic a identifié comme cause principale du score de la page Produits un CLS élevé et une livraison d'images perfectible. Les optimisations appliquées restent volontairement non destructives : dimensions intrinsèques ajoutées aux images HTML statiques lorsque déterminables, et correction sémantique minimale de l'ordre des titres de Projets si nécessaire.

Les médias administrables ne sont ni recompressés ni remplacés automatiquement afin de préserver la chaîne Admin → données → Git → GitHub. Les recommandations de cache dépendent de l'hébergement GitHub Pages et ne justifient pas une modification arbitraire du contenu. La minification JavaScript annoncée représente seulement quelques Kio et n'est pas appliquée au prix d'une dégradation de maintenabilité.

## Validation locale après optimisation

Lighthouse a été exécuté sur la version locale contenant les modifications, avant tout commit ou déploiement.

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accueil | 100 | 100 | 100 | 100 | 0.000 |
| À propos | 99 | 100 | 100 | 100 | 0.000 |
| Blog | 92 | 100 | 100 | 100 | 0.176 |
| Contact | 100 | 100 | 100 | 100 | 0.000 |
| Livres | 94 | 100 | 100 | 100 | 0.141 |
| Produits | 91 | 100 | 100 | 100 | 0.197 |
| Projets | 91 | 98 | 100 | 100 | 0.197 |
