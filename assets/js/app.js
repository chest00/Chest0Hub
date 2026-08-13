"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initializeChest0Hub
);


function initializeChest0Hub() {

    updateCurrentYear();

    initializeMobileMenu();

    initializeRevealAnimations();

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


    if (
        !button ||
        !menu ||
        !overlay ||
        !closeButton
    ) {
        return;
    }


    const openMenu = () => {

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
    };


    const closeMenu = () => {

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
    };


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
        .forEach((link) => {

            link.addEventListener(
                "click",
                closeMenu
            );

        });


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


function initializeRevealAnimations() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {
        return;
    }


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


function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {
        return;
    }


    const isLocalDevelopment =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";


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


    return insidePagesFolder
        ? "../sw.js"
        : "./sw.js";
}