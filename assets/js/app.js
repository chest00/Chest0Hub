"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initializeChest0Hub
);


function initializeChest0Hub() {

    updateCurrentYear();

    initializeMobileMenu();

    initializeRevealAnimations();

    initializeDynamicContent();

    registerServiceWorker();
}


/*
 * ============================================================
 * CONTENUS DYNAMIQUES
 * ============================================================
 */

function initializeDynamicContent() {

    if (
        typeof window.Chest0Data === "undefined"
    ) {

        console.error(
            "Chest0 Hub : moteur de données indisponible."
        );

        /*
         * Important :
         * même si le moteur de données est indisponible,
         * le reste de l'interface doit continuer à fonctionner.
         */

        return;
    }


    window.Chest0Data.renderProfile();


    /*
     * Page d'accueil :
     * réseaux sociaux.
     */

    window.Chest0Data.renderSocial(
        "social-grid"
    );


    /*
     * Page d'accueil :
     * projets.
     */

    window.Chest0Data.renderProjects(
        "home-projects-grid"
    );


    /*
     * Page Produits.
     */

    window.Chest0Data.renderProducts(
        "products-grid"
    );


    /*
     * Page Projets.
     */

    window.Chest0Data.renderProjects(
        "projects-page-grid"
    );


    /*
     * Page Livres.
     */

    window.Chest0Data.renderBooks(
        "books-grid"
    );

    window.Chest0Data.renderBlog(
        "blog-content"
    );
}


/*
 * ============================================================
 * ANNÉE AUTOMATIQUE
 * ============================================================
 */

function updateCurrentYear() {

    const yearElements =
        document.querySelectorAll(
            "#current-year"
        );


    const currentYear =
        new Date().getFullYear();


    yearElements.forEach(
        (element) => {

            element.textContent =
                String(currentYear);

        }
    );
}


/*
 * ============================================================
 * MENU MOBILE
 * ============================================================
 */

function initializeMobileMenu() {

    const button =
        document.querySelector(
            ".mobile-menu-button"
        );


    const menu =
        document.querySelector(
            ".mobile-menu"
        );


    const overlay =
        document.querySelector(
            ".mobile-menu-overlay"
        );


    const closeButton =
        document.querySelector(
            ".mobile-menu-close"
        );


    /*
     * Une page peut ne pas contenir le menu mobile.
     * Dans ce cas, aucune erreur ne doit être générée.
     */

    if (
        !button ||
        !menu ||
        !overlay ||
        !closeButton
    ) {

        return;
    }


    function openMenu() {

        menu.classList.add(
            "is-open"
        );


        overlay.classList.add(
            "is-open"
        );


        document.body.classList.add(
            "menu-open"
        );


        button.setAttribute(
            "aria-expanded",
            "true"
        );


        closeButton.focus();
    }


    function closeMenu() {

        menu.classList.remove(
            "is-open"
        );


        overlay.classList.remove(
            "is-open"
        );


        document.body.classList.remove(
            "menu-open"
        );


        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    button.addEventListener(
        "click",
        openMenu
    );


    closeButton.addEventListener(
        "click",
        closeMenu
    );


    overlay.addEventListener(
        "click",
        closeMenu
    );


    menu
        .querySelectorAll("a")
        .forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    closeMenu
                );

            }
        );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                menu.classList.contains(
                    "is-open"
                )
            ) {

                closeMenu();

                button.focus();
            }
        }
    );
}


/*
 * ============================================================
 * ANIMATIONS D'APPARITION
 * ============================================================
 */

function initializeRevealAnimations() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {

        return;
    }


    /*
     * Si IntersectionObserver n'est pas disponible,
     * on affiche directement tous les éléments.
     */

    if (
        !("IntersectionObserver" in window)
    ) {

        elements.forEach(
            (element) => {

                element.classList.add(
                    "is-visible"
                );

            }
        );


        return;
    }


    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add(
                                    "is-visible"
                                );


                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        (element) => {

            observer.observe(
                element
            );

        }
    );
}


/*
 * ============================================================
 * SERVICE WORKER / PWA
 * ============================================================
 */

function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {

        return;
    }


    const isLocalDevelopment =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";


    /*
     * Pendant le développement local,
     * nous ne réenregistrons pas le Service Worker.
     *
     * Cela limite les problèmes de cache pendant les tests.
     */

    if (isLocalDevelopment) {

        return;
    }


    window.addEventListener(
        "load",
        async () => {

            try {

                await navigator
                    .serviceWorker
                    .register(
                        getServiceWorkerPath()
                    );


                console.log(
                    "Chest0 Hub : PWA active."
                );

            } catch (error) {

                console.error(
                    "Chest0 Hub : impossible d'activer la PWA.",
                    error
                );
            }
        }
    );
}


function getServiceWorkerPath() {

    const insidePagesFolder =
        location.pathname.includes(
            "/pages/"
        );


    if (insidePagesFolder) {

        return "../sw.js";
    }


    return "./sw.js";
}
