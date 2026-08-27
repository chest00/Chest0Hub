# Journal des versions — Chest0 Hub

## En développement — Écosystème local

- Panneau Admin de lancement et d’état pour Quiz Studio et AI Studio.
- Ports locaux fixes 8501 et 8502 et contrôle de santé Streamlit.
- Registre allowlisté, processus détenus et arrêt sécurisé sans shell.
- Protection CSRF des actions Admin mutables.
- Guide non persistant du parcours Chest0 Quiz Exchange 1.0.
- Aucun accès Hub aux paquets, bases ou projets des applications.

---

## Version 1.2.0 — Fiabilité et assainissement structurel

### Amélioré

- Données dynamiques publiques fiabilisées et cohérentes avec l’Admin.
- Validation des structures JSON, URL, identifiants et chemins médias renforcée.
- Tests permanents du site public, de l’Admin, de la PWA et des références.
- Commande unique de certification locale : `./scripts/validate.sh`.
- Périmètre GitHub Pages limité aux ressources publiques nécessaires.

### Sécurité et fiabilité

- Serveurs public et Admin limités à `127.0.0.1`.
- Contrôles Admin contre les Host et Origin anormaux et les traversées de chemins.
- Isolation des caches PWA au moyen du préfixe `chest0-hub-`.
- Script historique protégé contre une exécution accidentelle.
- Cache PWA incrémenté pour la V1.2.0.

---

## Version 1.1.0 — Administration et médias

### Ajouté

- Interface locale Chest0 Hub Admin.
- Gestion du Profil.
- Gestion des Réseaux sociaux.
- Gestion des Produits.
- Gestion des Livres.
- Gestion des Projets.
- Gestion du Blog.
- Import d’images depuis Finder.
- Gestion de l’avatar du profil.
- Gestion des couvertures de livres.
- Gestion des images produits.
- Aperçu des images avant enregistrement.
- Conservation de l’aperçu après enregistrement.
- Génération automatique des chemins des médias.
- Remplacement des médias existants.
- Retrait sécurisé des images sans suppression du fichier physique.
- Sauvegardes automatiques des fichiers JSON.
- Aides contextuelles dans les formulaires Admin.
- Hiérarchie et organisation améliorées des formulaires.
- Protection contre les modifications non enregistrées.
- Détection des ajouts, suppressions et retraits de médias non enregistrés.
- Interface Admin responsive.

### Amélioré

- Affichage public des couvertures de livres.
- Cartes Livres adaptatives avec ou sans couverture.
- Utilisation optimale de la largeur disponible pour les livres sans couverture.
- Affichage public des images produits.
- Affichage adaptatif des produits sur desktop, formats intermédiaires et mobile.
- Navigation Admin responsive sans défilement horizontal.
- Présentation et lisibilité générales des formulaires Admin.

### Sécurité et fiabilité

- Validation des fichiers JSON.
- Contrôle de la compilation Python de l’Admin.
- Vérification des chemins locaux.
- Conservation des fichiers médias lors du retrait d’une image.
- Confirmation avant retrait d’un média.
- Confirmation avant abandon de modifications non enregistrées.
- Sauvegardes techniques avant les modifications sensibles.

---


## Version 0.2.0 — Sprint 2

### Ajouté

- Architecture multi-pages.
- Page d'accueil enrichie.
- Page Livres.
- Page Blog.
- Page Produits.
- Page Projets.
- Page À propos.
- Page Contact.
- Navigation générale.
- Responsive desktop, tablette et smartphone.
- Page auteur Amazon.
- Boutique Gumroad.
- TikTok.
- YouTube.
- Instagram.
- Facebook Fit Frenzy.
- Facebook Created by FitFrenzy.
- X.
- Adresse e-mail publique de contact.
- Structure pour futur avatar Chest0.
- Structure pour futures couvertures de livres.
- Structure pour futures images produits.
- Données `settings.json`.
- Données `navigation.json`.
- Données `blog.json`.
- Cache PWA adapté à l'architecture multi-pages.
- Métadonnées SEO de base.
- Métadonnées Open Graph de base.

### Architecture

Chest0 Hub utilise désormais une structure multi-pages évolutive.

Les données évolutives sont conservées dans le dossier `data/`.

Les futurs livres, produits et projets pourront être ajoutés sans refonte globale de l'application.

---

## Version 0.1.0 — Sprint 1

### Ajouté

- Fondations Chest0 Hub.
- HTML.
- CSS.
- JavaScript.
- Première PWA.
- Logo Chest0.
- Git.
- GitHub.
- GitHub Pages.
- Publication publique initiale.
