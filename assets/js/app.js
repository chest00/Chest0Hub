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
