"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initializeChest0Hub
);


function initializeChest0Hub() {

    updateCurrentYear();

    enableSmoothInternalNavigation();

    registerServiceWorker();
}


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


function enableSmoothInternalNavigation() {

    const internalLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    internalLinks.forEach(
        (link) => {

            link.addEventListener(
                "click",
                (event) => {

                    const targetId =
                        link.getAttribute("href");


                    if (
                        !targetId ||
                        targetId === "#"
                    ) {
                        return;
                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        }
    );
}


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
     * le Service Worker n'est pas enregistré.
     *
     * Cela évite que le navigateur conserve
     * d'anciennes versions de nos fichiers.
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