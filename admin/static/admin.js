"use strict";


const SECTION_CONFIG = [

    {
        id: "profile",
        title: "Profil",
        file: "profile.json",
        type: "object"
    },

    {
        id: "social",
        title: "Réseaux sociaux",
        file: "social.json",
        type: "list"
    },

    {
        id: "products",
        title: "Produits",
        file: "products.json",
        type: "list"
    },

    {
        id: "books",
        title: "Livres",
        file: "books.json",
        type: "books"
    },

    {
        id: "projects",
        title: "Projets",
        file: "projects.json",
        type: "list"
    },

    {
        id: "blog",
        title: "Blog",
        file: "blog.json",
        type: "blog"
    }

];


const LABELS = {

    brand: "Marque",
    authorName: "Nom d’auteur",
    siteName: "Nom du site",
    tagline: "Slogan",
    description: "Description",
    email: "Adresse e-mail",
    copyright: "Copyright",
    logo: "Chemin du logo",
    avatar: "Chemin de l’avatar",

    id: "Identifiant technique",
    name: "Nom",
    username: "Nom du compte",
    url: "URL",
    enabled: "Afficher",
    featured: "Mettre en avant",
    image: "Image",
    platform: "Plateforme",
    status: "Statut",

    author: "Auteur",
    amazonAuthorPage: "Page auteur Amazon",
    title: "Titre",
    cover: "Couverture",
    amazonUrl: "URL Amazon",

    articles: "Articles",
    items: "Éléments"

};


let allData = {};
let activeSectionId = "profile";


document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    await loadStatus();

    const loaded =
        await loadData();


    if (!loaded) {
        return;
    }


    renderTabs();

    renderActiveSection();
}


async function loadStatus() {

    const badge =
        document.getElementById(
            "server-status"
        );


    try {

        const response =
            await fetch(
                "/api/status",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        setText(
            "status-application",
            data.application
        );


        setText(
            "status-version",
            data.version
        );


        setText(
            "status-server",
            "En ligne — local uniquement"
        );


        if (badge) {

            badge.textContent =
                "Serveur local actif";


            badge.classList.add(
                "is-online"
            );
        }


    } catch (error) {

        console.error(
            "Chest0 Hub Admin — statut :",
            error
        );


        setText(
            "status-server",
            "Indisponible"
        );


        if (badge) {

            badge.textContent =
                "Serveur indisponible";
        }
    }
}


async function loadData() {

    try {

        const response =
            await fetch(
                "/api/data",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        allData =
            await response.json();


        return true;


    } catch (error) {

        console.error(
            "Chest0 Hub Admin — données :",
            error
        );


        showNotification(
            "Impossible de charger les données.",
            "error"
        );


        return false;
    }
}


function renderTabs() {

    const container =
        document.getElementById(
            "admin-tabs"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    SECTION_CONFIG.forEach(
        (section) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "tab-button";


            if (
                section.id ===
                activeSectionId
            ) {

                button.classList.add(
                    "is-active"
                );
            }


            button.textContent =
                section.title;


            button.addEventListener(
                "click",
                () => {

                    activeSectionId =
                        section.id;


                    renderTabs();

                    renderActiveSection();
                }
            );


            container.appendChild(
                button
            );
        }
    );
}


function renderActiveSection() {

    const editor =
        document.getElementById(
            "editor"
        );


    if (!editor) {
        return;
    }


    const section =
        SECTION_CONFIG.find(
            (item) =>
                item.id === activeSectionId
        );


    if (!section) {
        return;
    }


    const data =
        cloneData(
            allData[section.file]
        );


    editor.innerHTML =
        "";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "editor-header";


    const titleBlock =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        section.title;


    const subtitle =
        document.createElement(
            "p"
        );


    subtitle.textContent =
        `Source : data/${section.file}`;


    titleBlock.append(
        title,
        subtitle
    );


    header.appendChild(
        titleBlock
    );


    editor.appendChild(
        header
    );


    const form =
        document.createElement(
            "form"
        );


    form.className =
        "admin-form";


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const payload =
                collectSectionData(
                    form,
                    section
                );


            if (
                payload === null
            ) {

                showNotification(
                    "Impossible de préparer les données.",
                    "error"
                );

                return;
            }


            await saveSection(
                section,
                payload
            );
        }
    );


    if (
        section.type === "object"
    ) {

        renderObjectFields(
            form,
            data
        );
    }


    if (
        section.type === "list"
    ) {

        renderListFields(
            form,
            data,
            section
        );
    }


    if (
        section.type === "books"
    ) {

        renderBooksFields(
            form,
            data
        );
    }


    if (
        section.type === "blog"
    ) {

        renderBlogFields(
            form,
            data
        );
    }


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "form-actions";


    const saveButton =
        document.createElement(
            "button"
        );


    saveButton.type =
        "submit";


    saveButton.className =
        "primary-button";


    saveButton.textContent =
        "Enregistrer";


    actions.appendChild(
        saveButton
    );


    form.appendChild(
        actions
    );


    editor.appendChild(
        form
    );
}


function renderObjectFields(
    form,
    data
) {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "fields-grid";


    Object.entries(data).forEach(
        ([key, value]) => {

            grid.appendChild(
                createField(
                    key,
                    value
                )
            );
        }
    );


    form.appendChild(
        grid
    );
}


function renderListFields(
    form,
    data,
    section
) {

    const list =
        Array.isArray(data)
            ? data
            : [];


    const listContainer =
        document.createElement(
            "div"
        );


    listContainer.className =
        "items-list";


    list.forEach(
        (item, index) => {

            listContainer.appendChild(
                createItemCard(
                    item,
                    index,
                    section
                )
            );
        }
    );


    form.appendChild(
        listContainer
    );


    const addButton =
        document.createElement(
            "button"
        );


    addButton.type =
        "button";


    addButton.className =
        "secondary-button";


    addButton.textContent =
        `+ Ajouter — ${section.title}`;


    addButton.addEventListener(
        "click",
        () => {

            const newItem =
                getDefaultItem(
                    section.id
                );


            listContainer.appendChild(
                createItemCard(
                    newItem,
                    listContainer.children.length,
                    section
                )
            );
        }
    );


    form.appendChild(
        addButton
    );
}


function renderBooksFields(
    form,
    data
) {

    const object =
        (
            data &&
            typeof data === "object" &&
            !Array.isArray(data)
        )
            ? data
            : {
                author: "",
                amazonAuthorPage: "",
                items: []
            };


    const general =
        document.createElement(
            "div"
        );


    general.className =
        "fields-grid";


    general.append(
        createField(
            "author",
            object.author || ""
        ),
        createField(
            "amazonAuthorPage",
            object.amazonAuthorPage || ""
        )
    );


    form.appendChild(
        general
    );


    const heading =
        createSubheading(
            "Livres individuels"
        );


    form.appendChild(
        heading
    );


    const listContainer =
        document.createElement(
            "div"
        );


    listContainer.className =
        "items-list";


    const items =
        Array.isArray(
            object.items
        )
            ? object.items
            : [];


    items.forEach(
        (item, index) => {

            listContainer.appendChild(
                createItemCard(
                    item,
                    index,
                    {
                        id: "books",
                        title: "Livres"
                    }
                )
            );
        }
    );


    form.appendChild(
        listContainer
    );


    const addButton =
        document.createElement(
            "button"
        );


    addButton.type =
        "button";


    addButton.className =
        "secondary-button";


    addButton.textContent =
        "+ Ajouter un livre";


    addButton.addEventListener(
        "click",
        () => {

            listContainer.appendChild(
                createItemCard(
                    getDefaultItem(
                        "books"
                    ),
                    listContainer.children.length,
                    {
                        id: "books",
                        title: "Livres"
                    }
                )
            );
        }
    );


    form.appendChild(
        addButton
    );
}


function renderBlogFields(
    form,
    data
) {

    const object =
        (
            data &&
            typeof data === "object" &&
            !Array.isArray(data)
        )
            ? data
            : {
                name: "",
                platform: "",
                url: "",
                description: "",
                articles: []
            };


    const general =
        document.createElement(
            "div"
        );


    general.className =
        "fields-grid";


    [
        "name",
        "platform",
        "url",
        "description"
    ].forEach(
        (key) => {

            general.appendChild(
                createField(
                    key,
                    object[key] || ""
                )
            );
        }
    );


    form.appendChild(
        general
    );


    form.appendChild(
        createSubheading(
            "Articles"
        )
    );


    const listContainer =
        document.createElement(
            "div"
        );


    listContainer.className =
        "items-list";


    const articles =
        Array.isArray(
            object.articles
        )
            ? object.articles
            : [];


    articles.forEach(
        (item, index) => {

            listContainer.appendChild(
                createItemCard(
                    item,
                    index,
                    {
                        id: "articles",
                        title: "Articles"
                    }
                )
            );
        }
    );


    form.appendChild(
        listContainer
    );


    const addButton =
        document.createElement(
            "button"
        );


    addButton.type =
        "button";


    addButton.className =
        "secondary-button";


    addButton.textContent =
        "+ Ajouter un article";


    addButton.addEventListener(
        "click",
        () => {

            listContainer.appendChild(
                createItemCard(
                    getDefaultItem(
                        "articles"
                    ),
                    listContainer.children.length,
                    {
                        id: "articles",
                        title: "Articles"
                    }
                )
            );
        }
    );


    form.appendChild(
        addButton
    );
}


function createItemCard(
    item,
    index,
    section
) {

    const card =
        document.createElement(
            "fieldset"
        );


    card.className =
        "item-card";


    card.dataset.section =
        section.id;


    const legend =
        document.createElement(
            "legend"
        );


    legend.textContent =
        getItemTitle(
            item,
            index,
            section
        );


    card.appendChild(
        legend
    );


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "fields-grid";


    Object.entries(item).forEach(
        ([key, value]) => {

            grid.appendChild(
                createField(
                    key,
                    value
                )
            );
        }
    );


    card.appendChild(
        grid
    );


    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.className =
        "danger-button";


    removeButton.textContent =
        "Supprimer cet élément";


    removeButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Supprimer cet élément du formulaire ?"
                );


            if (confirmed) {
                card.remove();
            }
        }
    );


    card.appendChild(
        removeButton
    );


    return card;
}


function createField(
    key,
    value
) {

    const wrapper =
        document.createElement(
            "label"
        );


    wrapper.className =
        "field";


    wrapper.dataset.key =
        key;


    const labelText =
        document.createElement(
            "span"
        );


    labelText.className =
        "field-label";


    labelText.textContent =
        LABELS[key] || key;


    wrapper.appendChild(
        labelText
    );


    let input;


    if (
        typeof value === "boolean"
    ) {

        input =
            document.createElement(
                "input"
            );


        input.type =
            "checkbox";


        input.checked =
            value;


        wrapper.classList.add(
            "checkbox-field"
        );


    } else if (
        key === "description"
    ) {

        input =
            document.createElement(
                "textarea"
            );


        input.rows =
            4;


        input.value =
            value ?? "";


    } else {

        input =
            document.createElement(
                "input"
            );


        input.type =
            (
                key === "email"
                    ? "email"
                    : "text"
            );


        input.value =
            value ?? "";
    }


    input.dataset.key =
        key;


    wrapper.appendChild(
        input
    );


    return wrapper;
}


function collectSectionData(
    form,
    section
) {

    if (
        section.type === "object"
    ) {

        return collectFields(
            form
        );
    }


    if (
        section.type === "list"
    ) {

        return collectItemCards(
            form
        );
    }


    if (
        section.type === "books"
    ) {

        const result = {
            author: getFieldValue(
                form,
                "author"
            ),
            amazonAuthorPage:
                getFieldValue(
                    form,
                    "amazonAuthorPage"
                ),
            items:
                collectItemCards(
                    form
                )
        };


        return result;
    }


    if (
        section.type === "blog"
    ) {

        return {
            name:
                getFieldValue(
                    form,
                    "name"
                ),
            platform:
                getFieldValue(
                    form,
                    "platform"
                ),
            url:
                getFieldValue(
                    form,
                    "url"
                ),
            description:
                getFieldValue(
                    form,
                    "description"
                ),
            articles:
                collectItemCards(
                    form
                )
        };
    }


    return null;
}


function collectFields(
    container
) {

    const result = {};


    container
        .querySelectorAll(
            ":scope > .fields-grid > .field"
        )
        .forEach(
            (field) => {

                const input =
                    field.querySelector(
                        "[data-key]"
                    );


                if (!input) {
                    return;
                }


                result[
                    input.dataset.key
                ] = readInputValue(
                    input
                );
            }
        );


    return result;
}


function collectItemCards(
    form
) {

    const cards =
        form.querySelectorAll(
            ".items-list > .item-card"
        );


    return Array.from(
        cards
    ).map(
        (card) => {

            const item = {};


            card
                .querySelectorAll(
                    ".fields-grid > .field"
                )
                .forEach(
                    (field) => {

                        const input =
                            field.querySelector(
                                "[data-key]"
                            );


                        if (!input) {
                            return;
                        }


                        item[
                            input.dataset.key
                        ] = readInputValue(
                            input
                        );
                    }
                );


            return item;
        }
    );
}


function readInputValue(
    input
) {

    if (
        input.type === "checkbox"
    ) {

        return input.checked;
    }


    return input.value.trim();
}


function getFieldValue(
    form,
    key
) {

    const input =
        form.querySelector(
            `.field [data-key="${key}"]`
        );


    if (!input) {
        return "";
    }


    return readInputValue(
        input
    );
}


async function saveSection(
    section,
    payload
) {

    try {

        const response =
            await fetch(
                `/api/save/${section.file}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.ok
        ) {

            throw new Error(
                result.error ||
                `HTTP ${response.status}`
            );
        }


        allData[
            section.file
        ] = cloneData(
            payload
        );


        showNotification(
            `Enregistré. Sauvegarde : ${result.backup}`,
            "success"
        );


        renderActiveSection();


    } catch (error) {

        console.error(
            "Chest0 Hub Admin — enregistrement :",
            error
        );


        showNotification(
            `Échec : ${error.message}`,
            "error"
        );
    }
}


function getDefaultItem(
    sectionId
) {

    const defaults = {

        social: {
            id: "",
            name: "",
            username: "",
            url: "",
            description: "",
            enabled: true
        },

        products: {
            id: "",
            name: "",
            platform: "",
            description: "",
            url: "",
            image: "",
            featured: false,
            enabled: true
        },

        projects: {
            id: "",
            name: "",
            status: "Projet",
            description: "",
            url: "",
            enabled: true
        },

        books: {
            id: "",
            title: "",
            description: "",
            amazonUrl: "",
            cover: "",
            enabled: true
        },

        articles: {
            id: "",
            title: "",
            description: "",
            url: "",
            enabled: true
        }

    };


    return cloneData(
        defaults[sectionId] || {}
    );
}


function getItemTitle(
    item,
    index,
    section
) {

    return (
        item.title ||
        item.name ||
        item.username ||
        `${section.title} ${index + 1}`
    );
}


function createSubheading(
    text
) {

    const heading =
        document.createElement(
            "h3"
        );


    heading.className =
        "editor-subheading";


    heading.textContent =
        text;


    return heading;
}


function cloneData(
    value
) {

    return JSON.parse(
        JSON.stringify(
            value
        )
    );
}


function showNotification(
    message,
    type
) {

    const notification =
        document.getElementById(
            "notification"
        );


    if (!notification) {
        return;
    }


    notification.textContent =
        message;


    notification.className =
        `notification is-visible ${type}`;


    window.setTimeout(
        () => {

            notification.classList.remove(
                "is-visible"
            );

        },
        5000
    );
}


function setText(
    id,
    value
) {

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