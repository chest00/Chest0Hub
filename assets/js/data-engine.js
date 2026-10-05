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
     * ========================================================
     * PROFIL COMMUN
     * ========================================================
     */

    async renderProfile() {

        try {

            const profile =
                await this.loadJson(
                    "profile.json"
                );


            if (
                !profile ||
                typeof profile !== "object" ||
                Array.isArray(profile)
            ) {

                throw new Error(
                    "profile.json doit contenir un objet."
                );
            }


            document
                .querySelectorAll(
                    "[data-profile]"
                )
                .forEach(
                    (element) => {

                        const key =
                            element.dataset.profile;


                        const value =
                            profile[key];


                        if (
                            typeof value === "string" &&
                            value.trim()
                        ) {

                            element.textContent =
                                value;
                        }
                    }
                );


            document
                .querySelectorAll(
                    "[data-profile-link]"
                )
                .forEach(
                    (link) => {

                        const key =
                            link.dataset.profileLink;


                        const value =
                            profile[key];


                        if (
                            key === "email" &&
                            typeof value === "string" &&
                            value.trim()
                        ) {

                            link.href =
                                `mailto:${value.trim()}`;
                        }
                    }
                );


            document
                .querySelectorAll(
                    "[data-profile-image]"
                )
                .forEach(
                    (image) => {

                        const key =
                            image.dataset.profileImage;


                        const value =
                            profile[key];


                        if (
                            typeof value === "string" &&
                            value.startsWith("assets/")
                        ) {

                            image.src =
                                `${this.getRootPath()}${value}`;
                        }
                    }
                );


        } catch (error) {

            console.error(
                "Chest0 Hub — profil :",
                error
            );
        }
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


                    card.dataset.contentId =
                        String(item.id || "");


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


                    const description =
                        document.createElement(
                            "p"
                        );


                    description.className =
                        "social-description";


                    description.textContent =
                        item.description ||
                        "";


                    card.append(
                        icon,
                        name,
                        username,
                        description
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

    async renderProjects(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        try {
            // The browser never reads config/ or an Admin endpoint.
            const catalogue = await this.loadJson("public/ecosystem.json");
            const items = this.publicProjects(catalogue);
            let editorial = [];
            try { editorial = this.enabledItems(await this.loadJson("projects.json")); }
            catch (_) { /* Historical descriptions are optional, never authority for visibility. */ }
            container.replaceChildren();
            for (const item of items) {
                const article = document.createElement("article");
                article.className = "project-card";
                article.dataset.contentId = item.project_id;
                const status = document.createElement("span");
                status.className = "project-status";
                status.textContent = {stable:"Projet stable", developpement:"En développement", prevu:"Projet envisagé"}[item.state];
                const title = document.createElement("h2");
                title.textContent = item.name;
                const role = document.createElement("p");
                role.className = "project-role";
                role.textContent = item.category;
                const description = document.createElement("p");
                description.textContent = item.description;
                article.append(status, title, role, description);
                if (item.platforms.length) {
                    const platforms = document.createElement("p");
                    platforms.className = "project-platforms";
                    platforms.textContent = `Plateformes : ${item.platforms.join(" · ")}`;
                    article.appendChild(platforms);
                }
                if (item.commercial_status === "commercialisation_prevue") {
                    const notice = document.createElement("p");
                    notice.textContent = "Commercialisation envisagée. Aucun achat ni téléchargement proposé à ce stade.";
                    article.appendChild(notice);
                }
                for (const url of item.public_links) {
                    const link = this.createExternalLink(url);
                    link.className = "project-link";
                    link.textContent = `Site officiel — ${item.short_name}`;
                    article.appendChild(link);
                }
                const old = editorial.find(row => row.id === item.project_id);
                if (old && typeof old.description === "string" && old.description !== item.description) {
                    const details = document.createElement("details");
                    details.className = "project-history";
                    const summary = document.createElement("summary");
                    summary.textContent = "Présentation historique";
                    const note = document.createElement("p");
                    note.textContent = "Texte antérieur conservé. Les indications actuelles figurent ci-dessus.";
                    const text = document.createElement("p");
                    text.textContent = old.description;
                    details.append(summary, note, text);
                    article.appendChild(details);
                }
                container.appendChild(article);
            }
            if (!items.length) container.textContent = "Aucun projet public présenté pour le moment.";
        } catch (_) {
            container.textContent = "La présentation des projets est momentanément indisponible. Réessayez plus tard.";
        }
    },

    publicProjects(data) {
        const keys = ["project_id","name","short_name","description","category","type","platforms","commercial_status","public_links","state"];
        if (!data || data.schema_version !== 1 || !Array.isArray(data.projects) || data.projects.length > 64 ||
            Object.keys(data).sort().join() !== "projects,schema_version") throw new Error("Catalogue invalide");
        const ids = new Set();
        for (const row of data.projects) {
            if (!row || Object.keys(row).sort().join() !== [...keys].sort().join()) throw new Error("Champs invalides");
            for (const key of ["name","short_name","description","category","type"]) {
                if (typeof row[key] !== "string" || !row[key].trim() || row[key].length > 500) throw new Error("Texte invalide");
            }
            if (typeof row.project_id !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(row.project_id) ||
                row.project_id.length > 64 || ids.has(row.project_id) || row.project_id === "chest0-cloud") throw new Error("Identité invalide");
            ids.add(row.project_id);
            if (!["stable","developpement","prevu"].includes(row.state) ||
                !["application","produit","infrastructure","hub","service"].includes(row.type) ||
                !["non_commercial","gratuit","commercialisation_prevue","commercialise"].includes(row.commercial_status)) throw new Error("État invalide");
            if (!Array.isArray(row.platforms) || row.platforms.length > 16 || row.platforms.some(p => typeof p !== "string" || p.length > 100)) throw new Error("Plateformes invalides");
            if (!Array.isArray(row.public_links) || row.public_links.length > 8) throw new Error("Liens invalides");
            for (const link of row.public_links) {
                const url = new URL(link);
                if (typeof link !== "string" || link.length > 500 || url.protocol !== "https:" ||
                    url.username || url.password || url.search || url.hash || link.includes("\\") ||
                    !url.hostname.includes(".")) throw new Error("URL invalide");
            }
        }
        return data.projects;
    },

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


                    article.dataset.contentId =
                        String(item.id || "");


                    if (item.featured === true) {

                        article.classList.add(
                            "is-featured"
                        );
                    }


                    /*
                     * Image du produit.
                     * PRODUCT_IMAGE_PUBLIC_V110
                     */

                    if (
                        typeof item.image === "string" &&
                        item.image.trim()
                    ) {

                        article.classList.add(
                            "has-image"
                        );


                        const image =
                            document.createElement(
                                "img"
                            );


                        image.className =
                            "product-image";


                        image.src =
                            `${this.getRootPath()}${item.image}`;

                        const productImageDimensions = {
                            "assets/images/products/image-principale-hero-d60f3b0b.png": [1448, 1086],
                            "assets/images/products/template-gumroad-bedc3ce6.png": [445, 634],
                        };

                        const dimensions = productImageDimensions[item.image];

                        if (dimensions) {
                            image.width = dimensions[0];
                            image.height = dimensions[1];
                        }


                        image.alt =
                            `Image du produit ${item.name || ""}`;


                        article.appendChild(
                            image
                        );
                    }


                    const content =
                        document.createElement(
                            "div"
                        );


                    content.className =
                        "product-content";


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


                    content.append(
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


            document
                .querySelectorAll(
                    "[data-books-author]"
                )
                .forEach(
                    (element) => {

                        element.textContent =
                            data.author ||
                            "";
                    }
                );


            document
                .querySelectorAll(
                    "[data-books-author-link]"
                )
                .forEach(
                    (link) => {

                        if (
                            this.isValidUrl(
                                data.amazonAuthorPage
                            )
                        ) {

                            link.href =
                                data.amazonAuthorPage;
                        }
                    }
                );


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


                    article.dataset.contentId =
                        String(item.id || "");


                    /*
                     * Couverture du livre.
                     */

                    if (
                        typeof item.cover === "string" &&
                        item.cover.trim()
                    ) {

                        // BOOK_CARD_ADAPTIVE_V110
                        article.classList.add(
                            "has-cover"
                        );


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


            document
                .querySelectorAll(
                    "[data-blog]"
                )
                .forEach(
                    (element) => {

                        const value =
                            data[element.dataset.blog];


                        if (
                            typeof value === "string" &&
                            value.trim()
                        ) {

                            element.textContent =
                                value;
                        }
                    }
                );


            document
                .querySelectorAll(
                    "[data-blog-link]"
                )
                .forEach(
                    (link) => {

                        if (
                            this.isValidUrl(
                                data.url
                            )
                        ) {

                            link.href =
                                data.url;
                        }
                    }
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


                    card.dataset.contentId =
                        String(article.id || "");


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

/* Phase 4 - partage natif et copie de lien, sans service tiers. */
function initChest0Share() {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") return;
  const host=document.querySelector("main");
  if (!host || document.querySelector("[data-chest0-share]")) return;
  const box=document.createElement("section");
  box.className="share-panel"; box.setAttribute("data-chest0-share","");
  const title=document.createElement("h2"); title.textContent="Partager cette page";
  const text=document.createElement("p"); text.textContent="Partagez cette page ou copiez son adresse.";
  const button=document.createElement("button"); button.type="button"; button.className="primary-cta share-button";
  button.textContent=navigator.share ? "Partager" : "Copier le lien";
  const feedback=document.createElement("span"); feedback.className="share-feedback"; feedback.setAttribute("aria-live","polite");
  button.addEventListener("click",async()=>{const url=document.querySelector('link[rel="canonical"]')?.href||location.href;
    try{if(navigator.share){await navigator.share({title:document.title,url});feedback.textContent="Page partagée.";}
    else if(navigator.clipboard){await navigator.clipboard.writeText(url);feedback.textContent="Lien copié.";}
    else feedback.textContent=url;}catch(error){if(error&&error.name!=="AbortError")feedback.textContent="Partage indisponible.";}});
  box.append(title,text,button,feedback); host.appendChild(box);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",initChest0Share,{once:true}); else initChest0Share();
