from pathlib import Path
import json
import os
import shutil
import sys
from datetime import datetime


CONFIRMATION_FLAG = (
    "--confirm-historical-project-rewrite"
)

CONFIRMATION_ENVIRONMENT = (
    "CHEST0_ALLOW_HISTORICAL_FINALIZE"
)


if (
    __name__ != "__main__"
    or sys.argv[1:] != [CONFIRMATION_FLAG]
    or os.environ.get(
        CONFIRMATION_ENVIRONMENT
    ) != "YES"
):

    print(
        "Script historique archivé : exécution bloquée. "
        "Il réécrit massivement le projet et ne doit pas "
        "être lancé comme une commande courante."
    )

    raise SystemExit(2)


PROJECT = Path(__file__).resolve().parent.parent
BACKUP = PROJECT / "backups" / "pre_sprint1_final"


def save_backup(relative_path: str) -> None:
    source = PROJECT / relative_path

    if not source.exists():
        return

    destination = BACKUP / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)

    print(f"Sauvegardé : {relative_path}")


def write_text(relative_path: str, content: str) -> None:
    path = PROJECT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")

    print(f"Créé / mis à jour : {relative_path}")


def write_json(relative_path: str, data) -> None:
    path = PROJECT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8"
    )

    print(f"Créé / mis à jour : {relative_path}")


print()
print("==============================================")
print(" Chest0 Hub — Finalisation du Sprint 1")
print("==============================================")
print()


# -------------------------------------------------
# 1. SAUVEGARDE
# -------------------------------------------------

BACKUP.mkdir(parents=True, exist_ok=True)

for file_name in [
    "index.html",
    "assets/js/app.js",
    "manifest.webmanifest",
    "sw.js",
    "README.md",
    "CHANGELOG.md",
    ".gitignore",
]:
    save_backup(file_name)


# -------------------------------------------------
# 2. DONNÉES
# -------------------------------------------------

write_json(
    "data/profile.json",
    {
        "brand": "Chest0",
        "name": "Chest0 JM.S.",
        "siteName": "Chest0 Hub",
        "tagline": "L'univers de Chest0 JM.S.",
        "description": (
            "Livres, bien-être, contenus, réseaux sociaux "
            "et projets numériques réunis au même endroit."
        ),
        "copyright": "Chest0 JM.S."
    }
)


write_json(
    "data/links.json",
    [
        {
            "id": "books",
            "title": "Mes livres",
            "description": "Découvrir mes ouvrages sur Amazon",
            "icon": "📚",
            "url": "#"
        },
        {
            "id": "blog",
            "title": "Mon blog",
            "description": "Articles et contenus autour du bien-être",
            "icon": "🌐",
            "url": "#"
        },
        {
            "id": "tiktok",
            "title": "TikTok",
            "description": "Mes contenus courts",
            "icon": "▶",
            "url": "#"
        },
        {
            "id": "social",
            "title": "Réseaux sociaux",
            "description": "Instagram, Facebook et X",
            "icon": "◎",
            "url": "#"
        }
    ]
)


write_json(
    "data/projects.json",
    [
        {
            "name": "Chest0 AI Studio",
            "status": "Projet",
            "description": (
                "Studio personnel consacré aux technologies "
                "d'intelligence artificielle."
            ),
            "url": "#"
        },
        {
            "name": "Chest0 Quiz Studio",
            "status": "Projet",
            "description": (
                "Création automatisée de quiz destinés "
                "aux réseaux sociaux."
            ),
            "url": "#"
        }
    ]
)


for file_name in [
    "data/books.json",
    "data/products.json",
    "data/social.json",
]:
    write_json(file_name, [])


# -------------------------------------------------
# 3. LOGO SVG / FAVICON
# -------------------------------------------------

write_text(
    "assets/icons/chest0-mark.svg",
    """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="120" fill="#09090d"/>
    <circle
        cx="256"
        cy="256"
        r="172"
        fill="none"
        stroke="#d7b56d"
        stroke-width="22"
    />
    <path
        d="M332 174
           C305 145 270 132 233 138
           C174 147 136 198 141 258
           C146 319 193 367 254 373
           C292 377 329 365 356 341"
        fill="none"
        stroke="#f5f5f7"
        stroke-width="36"
        stroke-linecap="round"
    />
    <circle cx="352" cy="341" r="18" fill="#d7b56d"/>
</svg>
"""
)


# -------------------------------------------------
# 4. INDEX.HTML
# -------------------------------------------------

write_text(
    "index.html",
    """
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="description"
        content="Chest0 Hub — Livres, contenus, réseaux sociaux et projets de Chest0 JM.S."
    >

    <meta
        name="theme-color"
        content="#09090d"
    >

    <title>Chest0 Hub — Chest0 JM.S.</title>

    <link
        rel="icon"
        href="assets/icons/chest0-mark.svg"
        type="image/svg+xml"
    >

    <link
        rel="manifest"
        href="manifest.webmanifest"
    >

    <link
        rel="stylesheet"
        href="assets/css/style.css"
    >
</head>

<body>

    <header class="hero">
        <div class="hero-content">

            <div class="brand">
                Chest0
            </div>

            <h1 id="site-title">
                Chest0 Hub
            </h1>

            <p
                id="site-tagline"
                class="subtitle"
            >
                Chargement...
            </p>

            <p
                id="site-description"
                class="description"
            >
            </p>

        </div>
    </header>


    <main class="container">

        <section class="section">

            <p class="section-label">
                Découvrir
            </p>

            <h2>
                Mon univers
            </h2>

            <div
                id="primary-links"
                class="link-grid"
            >
            </div>

        </section>


        <section class="section">

            <p class="section-label">
                Créations
            </p>

            <h2>
                Mes projets
            </h2>

            <div
                id="projects-grid"
                class="projects"
            >
            </div>

        </section>

    </main>


    <footer>

        <p>
            ©
            <span id="current-year"></span>
            <span id="copyright-name">
                Chest0 JM.S.
            </span>
        </p>

        <p class="footer-note">
            Chest0 Hub
        </p>

    </footer>


    <script
        src="assets/js/app.js"
        defer
    ></script>

</body>

</html>
"""
)


# -------------------------------------------------
# 5. JAVASCRIPT
# -------------------------------------------------

write_text(
    "assets/js/app.js",
    """
"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


async function initializeApplication() {

    updateCurrentYear();

    try {

        const [profile, links, projects] =
            await Promise.all([
                loadJson("data/profile.json"),
                loadJson("data/links.json"),
                loadJson("data/projects.json")
            ]);

        renderProfile(profile);
        renderLinks(links);
        renderProjects(projects);

    } catch (error) {

        console.error(
            "Chest0 Hub : erreur de chargement.",
            error
        );

        displayLoadingError();
    }

    registerServiceWorker();
}


async function loadJson(path) {

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `Impossible de charger ${path} (${response.status})`
        );
    }

    return response.json();
}


function renderProfile(profile) {

    setText("site-title", profile.siteName);
    setText("site-tagline", profile.tagline);
    setText("site-description", profile.description);
    setText("copyright-name", profile.copyright);
}


function renderLinks(links) {

    const container =
        document.getElementById("primary-links");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    links.forEach((link) => {

        const anchor =
            document.createElement("a");

        anchor.className = "hub-card";
        anchor.href = link.url || "#";

        anchor.setAttribute(
            "aria-label",
            link.title
        );

        if (link.url && link.url !== "#") {
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
        }


        const icon =
            document.createElement("span");

        icon.className = "card-icon";
        icon.textContent = link.icon || "•";


        const content =
            document.createElement("span");

        content.className = "card-content";


        const title =
            document.createElement("strong");

        title.textContent = link.title;


        const description =
            document.createElement("small");

        description.textContent =
            link.description;


        content.append(
            title,
            description
        );

        anchor.append(
            icon,
            content
        );

        container.appendChild(anchor);
    });
}


function renderProjects(projects) {

    const container =
        document.getElementById("projects-grid");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    projects.forEach((project) => {

        const article =
            document.createElement("article");

        article.className = "project-card";


        const status =
            document.createElement("span");

        status.className = "project-status";
        status.textContent = project.status;


        const title =
            document.createElement("h3");

        title.textContent = project.name;


        const description =
            document.createElement("p");

        description.textContent =
            project.description;


        article.append(
            status,
            title,
            description
        );

        container.appendChild(article);
    });
}


function updateCurrentYear() {

    setText(
        "current-year",
        new Date().getFullYear()
    );
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (
        element &&
        value !== undefined
    ) {
        element.textContent =
            String(value);
    }
}


function displayLoadingError() {

    setText(
        "site-tagline",
        "Impossible de charger les données."
    );

    setText(
        "site-description",
        "Recharge la page ou vérifie que le serveur Chest0 Hub est démarré."
    );
}


function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    const localDevelopment =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";

    if (localDevelopment) {
        return;
    }

    window.addEventListener(
        "load",
        async () => {

            try {

                await navigator.serviceWorker.register(
                    "./sw.js"
                );

                console.log(
                    "Chest0 Hub : mode PWA actif."
                );

            } catch (error) {

                console.error(
                    "Chest0 Hub : Service Worker indisponible.",
                    error
                );
            }
        }
    );
}
"""
)


# -------------------------------------------------
# 6. MANIFESTE PWA
# -------------------------------------------------

write_text(
    "manifest.webmanifest",
    """
{
    "name": "Chest0 Hub",
    "short_name": "Chest0",
    "description": "L'univers numérique de Chest0 JM.S.",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "background_color": "#09090d",
    "theme_color": "#09090d",
    "lang": "fr",
    "icons": [
        {
            "src": "assets/icons/chest0-mark.svg",
            "sizes": "any",
            "type": "image/svg+xml",
            "purpose": "any"
        }
    ]
}
"""
)


# -------------------------------------------------
# 7. SERVICE WORKER
# -------------------------------------------------

write_text(
    "sw.js",
    """
"use strict";


const CACHE_VERSION =
    "chest0-hub-v0.1.0";


const APP_SHELL = [
    "./",
    "./index.html",
    "./assets/css/style.css",
    "./assets/js/app.js",
    "./assets/icons/chest0-mark.svg",
    "./manifest.webmanifest",
    "./data/profile.json",
    "./data/links.json",
    "./data/projects.json",
    "./data/books.json",
    "./data/products.json",
    "./data/social.json"
];


self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(
            caches
                .open(CACHE_VERSION)
                .then(
                    (cache) =>
                        cache.addAll(APP_SHELL)
                )
        );

        self.skipWaiting();
    }
);


self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(
            caches
                .keys()
                .then((cacheNames) => {

                    return Promise.all(
                        cacheNames
                            .filter(
                                (cacheName) =>
                                    cacheName !== CACHE_VERSION
                            )
                            .map(
                                (cacheName) =>
                                    caches.delete(cacheName)
                            )
                    );
                })
        );

        self.clients.claim();
    }
);


self.addEventListener(
    "fetch",
    (event) => {

        if (event.request.method !== "GET") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {

                    const copy =
                        networkResponse.clone();

                    caches
                        .open(CACHE_VERSION)
                        .then((cache) => {
                            cache.put(
                                event.request,
                                copy
                            );
                        });

                    return networkResponse;
                })
                .catch(async () => {

                    const cachedResponse =
                        await caches.match(
                            event.request
                        );

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    if (
                        event.request.mode === "navigate"
                    ) {
                        return caches.match(
                            "./index.html"
                        );
                    }

                    throw new Error(
                        "Ressource indisponible hors ligne."
                    );
                })
        );
    }
);
"""
)


# -------------------------------------------------
# 8. DOCUMENTATION
# -------------------------------------------------

write_text(
    "docs/ARCHITECTURE.md",
    """
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
"""
)


write_text(
    "docs/BRAND.md",
    """
# Identité visuelle — Chest0

## Marque principale

Chest0

## Déclinaisons

- Chest0 Hub
- Chest0 AI Studio
- Chest0 Quiz Studio

## Palette

- Noir profond : `#09090D`
- Anthracite : `#101017`
- Blanc cassé : `#F5F5F7`
- Or Chest0 : `#D7B56D`
- Or clair : `#F0D69B`

## Direction artistique

- sombre ;
- premium ;
- moderne ;
- sobre ;
- cohérente entre les applications Chest0.

## Logo

Source vectorielle officielle :

`assets/icons/chest0-mark.svg`
"""
)


# -------------------------------------------------
# 9. README
# -------------------------------------------------

write_text(
    "README.md",
    """
# Chest0 Hub

Chest0 Hub est le portail numérique de Chest0 JM.S.

## Objectif

Centraliser :

- les livres ;
- le blog ;
- les réseaux sociaux ;
- les vidéos ;
- les produits ;
- les applications ;
- les projets ;
- les moyens de contact.

## Technologies

- HTML5 ;
- CSS3 ;
- JavaScript ;
- JSON ;
- Progressive Web App ;
- Git ;
- GitHub Pages.

## Dépendances

Aucune dépendance JavaScript obligatoire.

Node.js et npm ne sont pas nécessaires.

## Coût d'exploitation

Objectif : 0 €.

## Développement local

Depuis le dossier du projet, lancer :

./run_dev.sh

Ensuite, ouvrir Brave ou Safari.

Dans la barre d'adresse du navigateur, saisir :

http://localhost:8080

Cette adresse ne doit pas être saisie dans le Terminal.

## Documentation

Architecture :

docs/ARCHITECTURE.md

Identité graphique :

docs/BRAND.md

## État

Version 0.1.0 — Sprint 1.
"""
)


# -------------------------------------------------
# 10. CHANGELOG
# -------------------------------------------------

today = datetime.now().strftime("%d/%m/%Y")


write_text(
    "CHANGELOG.md",
    f"""
# Journal des versions — Chest0 Hub

## Version 0.1.0 — Sprint 1

Date : {today}

### Ajouté

- Structure initiale du projet.
- Page d'accueil responsive.
- Design sombre premium.
- Architecture de données JSON.
- Chargement dynamique des contenus.
- Structure PWA.
- Manifest Web App.
- Service Worker.
- Cache hors ligne.
- Désactivation du Service Worker en développement local.
- Logo vectoriel Chest0.
- Favicon vectoriel.
- Documentation de l'architecture.
- Charte graphique.
- Script de lancement local.

### Architecture

- HTML pour la structure.
- CSS pour le design.
- JavaScript pour la logique.
- JSON pour les contenus.

### Objectif

Permettre les futures évolutions sans refonte complète du projet.
"""
)


# -------------------------------------------------
# 11. GITIGNORE
# -------------------------------------------------

write_text(
    ".gitignore",
    """
.DS_Store
.vscode/
*.log
temp/
tmp/
backups/
__pycache__/
"""
)


print()
print("==============================================")
print(" FINALISATION TERMINÉE")
print("==============================================")
print()
print("Les fichiers du Sprint 1 ont été générés.")
print()
