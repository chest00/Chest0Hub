# Architecture — Chest0 Hub

## Principe

Chest0 Hub sépare :

- la structure HTML ;
- le design CSS ;
- la logique JavaScript ;
- les données JSON.

## Données

Les contenus sont stockés dans le dossier `data`.

### Fichiers principaux

- `profile.json` : identité générale ;
- `links.json` : liens principaux ;
- `projects.json` : projets ;
- `books.json` : livres ;
- `products.json` : produits ;
- `social.json` : réseaux sociaux.

## Objectif

Permettre les futures évolutions sans devoir réécrire toute la page HTML.

## Hébergement

Architecture compatible avec GitHub Pages.

## PWA

Le Service Worker est désactivé sur `localhost` pendant le développement.

Il sera activé automatiquement sur le site public.
