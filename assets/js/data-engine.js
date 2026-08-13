"use strict";


/*
 * ============================================================
 * CHEST0 HUB — DATA ENGINE
 * Version Sprint 4
 * ============================================================
 *
 * Ce moteur charge les fichiers JSON du dossier data/
 * et génère automatiquement certains contenus du site.
 *
 * Il fonctionne :
 *
 * - depuis index.html ;
 * - depuis les pages du dossier pages/ ;
 * - sur localhost ;
 * - sur GitHub Pages.
 *
 * ============================================================
 */


const Chest0Data = {


    /*
     * --------------------------------------------------------
     * CHEMIN RACINE
     * --------------------------------------------------------
     *
     * Depuis index.html :
     * ./data/...
     *
     * Depuis pages/livres.html :
     * ../data/...
     */

    getRootPath() {

        const insidePagesFolder =
            window.location.pathname.includes(
                "/pages/"
            );


        return insidePagesFolder
            ? "../"
            : "./";
    },


    /*
     * --------------------------------------------------------
     * CHARGEMENT D'UN FICHIER JSON
     * --------------------------------------------------------
     */

    async loadJson(fileName) {

        const url =
            `${this.getRootPath()}data/${fileName}`;


        const response =
            await fetch(
                url,
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Impossible de charger ${url} — HTTP ${response.status}`
            );

        }


        return response.json();
    },


    /*
     * --------------------------------------------------------
     * FILTRAGE DES CONTENUS ACTIVÉS
     * --------------------------------------------------------
     *
     * "enabled": false
     *
     * permet de masquer un contenu sans le supprimer.
     */

    enabledItems(items) {

        if (!Array.isArray(items)) {
            return [];
        }


        return items.filter(
            (item) =>
                item.enabled !== false
        );
    },


    /*
     * --------------------------------------------------------
     * VALIDATION SIMPLE DES URL
     * --------------------------------------------------------
     */

    isValidUrl(url) {

        if (
            typeof url !== "string" ||
            !url.trim()
        ) {

            return false;
        }


        return (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("mailto:")
        );
    },


    /*
     * --------------------------------------------------------
     * CRÉATION D'UN LIEN
     * --------------------------------------------------------
     */

    createExternalLink(url) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";
        }


        return link;
    },


    /*
     * --------------------------------------------------------
     * CRÉATION D'UNE ICÔNE SVG
     * --------------------------------------------------------
     */

    createIcon(
        iconName,
        className
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            `${this.getRootPath()}assets/icons/${iconName}.svg`;


        image.alt =
            "";


        image.className =
            className;


        image.setAttribute(
            "aria-hidden",
            "true"
        );


        return image;
    },


    /*
     * --------------------------------------------------------
     * ASSOCIATION RÉSEAU → ICÔNE
     * --------------------------------------------------------
     */

    socialIconName(item) {

        const id =
            String(
                item.id || ""
            ).toLowerCase();


        if (
            id.includes("tiktok")
        ) {

            return "tiktok";
        }


        if (
            id.includes("youtube")
        ) {

            return "youtube";
        }


        if (
            id.includes("instagram")
        ) {

            return "instagram";
        }


        if (
            id.includes("facebook")
        ) {

            return "facebook";
        }


        if (
            id === "x" ||
            id.includes("twitter")
        ) {

            return "x";
        }


        return "blog";
    },


    /*
     * ========================================================
     * RÉSEAUX SOCIAUX
     * ========================================================
     */

    async renderSocial(
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {
            return;
        }


        try {

            const data =
                await this.loadJson(
                    "social.json"
                );


            const items =
                this.enabledItems(
                    data
                );


            container.innerHTML =
                "";


            items.forEach(
                (item) => {

                    if (
                        !this.isValidUrl(
                            item.url
                        )
                    ) {

                        return;
                    }


                    const card =
                        this.createExternalLink(
                            item.url
                        );


                    card.className =
                        "social-card";


                    const icon =
                        this.createIcon(
                            this.socialIconName(
                                item
                            ),
                            "social-platform-icon"
                        );


                    const name =
                        document.createElement(
                            "strong"
                        );


                    name.textContent =
                        item.name ||
                        "Réseau";


                    const username =
                        document.createElement(
                            "span"
                        );


                    username.textContent =
                        item.username ||
                        "";


                    card.append(
                        icon,
                        name,
                        username
                    );


                    container.appendChild(
                        card
                    );
                }
            );


        } catch (error) {

            console.error(
                "Chest0 Hub — réseaux sociaux :",
                error
            );
        }
    },


    /*
     * ========================================================
     * PROJETS
     * ========================================================
     */

    async renderProjects(
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {
            return;
        }


        try {

            const data =
                await this.loadJson(
                    "projects.json"
                );


            const items =
                this.enabledItems(
                    data
                );


            container.innerHTML =
                "";


            items.forEach(
                (item) => {

                    const article =
                        document.createElement(
                            "article"
                        );


                    article.className =
                        "project-card";


                    const status =
                        document.createElement(
                            "span"
                        );


                    status.className =
                        "project-status";


                    status.textContent =
                        item.status ||
                        "Projet";


                    const title =
                        document.createElement(
                            "h3"
                        );


                    title.textContent =
                        item.name ||
                        "Projet Chest0";


                    const description =
                        document.createElement(
                            "p"
                        );


                    description.textContent =
                        item.description ||
                        "";


                    article.append(
                        status,
                        title,
                        description
                    );


                    if (
                        this.isValidUrl(
                            item.url
                        )
                    ) {

                        const link =
                            this.createExternalLink(
                                item.url
                            );


                        link.className =
                            "project-link";


                        link.textContent =
                            "Découvrir";


                        article.appendChild(
                            link
                        );
                    }


                    container.appendChild(
                        article
                    );
                }
            );


        } catch (error) {

            console.error(
                "Chest0 Hub — projets :",
                error
            );
        }
    },


    /*
     * ========================================================
     * PRODUITS
     * ========================================================
     */

    async renderProducts(
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {
            return;
        }


        try {

            const data =
                await this.loadJson(
                    "products.json"
                );


            const items =
                this.enabledItems(
                    data
                );


            container.innerHTML =
                "";


            items.forEach(
                (item) => {

                    const article =
                        document.createElement(
                            "article"
                        );


                    article.className =
                        "product-card";


                    const platform =
                        document.createElement(
                            "span"
                        );


                    platform.className =
                        "product-platform";


                    platform.textContent =
                        item.platform ||
                        "Produit";


                    const title =
                        document.createElement(
                            "h2"
                        );


                    title.textContent =
                        item.name ||
                        "Produit Chest0";


                    const description =
                        document.createElement(
                            "p"
                        );


                    description.textContent =
                        item.description ||
                        "";


                    article.append(
                        platform,
                        title,
                        description
                    );


                    if (
                        this.isValidUrl(
                            item.url
                        )
                    ) {

                        const link =
                            this.createExternalLink(
                                item.url
                            );


                        link.className =
                            "product-button";


                        link.textContent =
                            "Découvrir";


                        article.appendChild(
                            link
                        );
                    }


                    container.appendChild(
                        article
                    );
                }
            );


        } catch (error) {

            console.error(
                "Chest0 Hub — produits :",
                error
            );
        }
    },


    /*
     * ========================================================
     * LIVRES
     * ========================================================
     */

    async renderBooks(
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {
            return;
        }


        try {

            const data =
                await this.loadJson(
                    "books.json"
                );


            const items =
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : [];


            container.innerHTML =
                "";


            /*
             * Aucun livre individuel n'est encore renseigné.
             */

            if (!items.length) {

                const emptyState =
                    document.createElement(
                        "div"
                    );


                emptyState.className =
                    "empty-state";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    "Bibliothèque en préparation";


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    "Les fiches individuelles de mes ouvrages seront ajoutées progressivement.";


                emptyState.append(
                    title,
                    description
                );


                container.appendChild(
                    emptyState
                );


                return;
            }


            items.forEach(
                (item) => {

                    if (
                        item.enabled === false
                    ) {

                        return;
                    }


                    const article =
                        document.createElement(
                            "article"
                        );


                    article.className =
                        "book-card";


                    /*
                     * Couverture du livre.
                     */

                    if (
                        typeof item.cover === "string" &&
                        item.cover.trim()
                    ) {

                        const image =
                            document.createElement(
                                "img"
                            );


                        image.className =
                            "book-cover";


                        image.src =
                            `${this.getRootPath()}${item.cover}`;


                        image.alt =
                            `Couverture du livre ${item.title || ""}`;


                        article.appendChild(
                            image
                        );
                    }


                    const content =
                        document.createElement(
                            "div"
                        );


                    content.className =
                        "book-content";


                    const title =
                        document.createElement(
                            "h2"
                        );


                    title.textContent =
                        item.title ||
                        "Livre Chest0 JM.S.";


                    const description =
                        document.createElement(
                            "p"
                        );


                    description.textContent =
                        item.description ||
                        "";


                    content.append(
                        title,
                        description
                    );


                    if (
                        this.isValidUrl(
                            item.amazonUrl
                        )
                    ) {

                        const link =
                            this.createExternalLink(
                                item.amazonUrl
                            );


                        link.className =
                            "product-button";


                        link.textContent =
                            "Voir sur Amazon";


                        content.appendChild(
                            link
                        );
                    }


                    article.appendChild(
                        content
                    );


                    container.appendChild(
                        article
                    );
                }
            );


        } catch (error) {

            console.error(
                "Chest0 Hub — livres :",
                error
            );
        }
    },


    /*
     * ========================================================
     * BLOG
     * ========================================================
     */

    async renderBlog(
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {
            return;
        }


        try {

            const data =
                await this.loadJson(
                    "blog.json"
                );


            container.innerHTML =
                "";


            const articles =
                Array.isArray(
                    data.articles
                )
                    ? data.articles.filter(
                        (article) =>
                            article.enabled !== false
                    )
                    : [];


            /*
             * Aucun article sélectionné.
             */

            if (!articles.length) {

                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    "Articles à découvrir";


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    "Une sélection d’articles du blog sera ajoutée progressivement.";


                container.append(
                    title,
                    description
                );


                return;
            }


            /*
             * Articles provenant de blog.json.
             */

            const grid =
                document.createElement(
                    "div"
                );


            grid.className =
                "blog-articles-grid";


            articles.forEach(
                (article) => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "blog-article-card";


                    const title =
                        document.createElement(
                            "h2"
                        );


                    title.textContent =
                        article.title ||
                        "Article";


                    const description =
                        document.createElement(
                            "p"
                        );


                    description.textContent =
                        article.description ||
                        "";


                    card.append(
                        title,
                        description
                    );


                    if (
                        this.isValidUrl(
                            article.url
                        )
                    ) {

                        const link =
                            this.createExternalLink(
                                article.url
                            );


                        link.className =
                            "product-button";


                        link.textContent =
                            "Lire l’article";


                        card.appendChild(
                            link
                        );
                    }


                    grid.appendChild(
                        card
                    );
                }
            );


            container.appendChild(
                grid
            );


        } catch (error) {

            console.error(
                "Chest0 Hub — blog :",
                error
            );


            container.innerHTML =
                "";


            const message =
                document.createElement(
                    "p"
                );


            message.textContent =
                "Impossible de charger les articles pour le moment.";


            container.appendChild(
                message
            );
        }
    }

};


window.Chest0Data =
    Chest0Data;