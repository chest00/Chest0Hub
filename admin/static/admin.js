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
    logo: "Logo",
    avatar: "Avatar",

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


// ADMIN_FIELD_HELP_MARKER_V110

const FIELD_HELP = {

    brand: {
        placeholder: "Chest0",
        help: "Nom court de ta marque affiché dans l’administration et sur le site."
    },

    authorName: {
        placeholder: "Chest0 JM.S.",
        help: "Nom ou pseudonyme d’auteur présenté aux visiteurs."
    },

    siteName: {
        placeholder: "Chest0 Hub",
        help: "Nom principal de ton site."
    },

    tagline: {
        placeholder: "L’univers de Chest0 JM.S.",
        help: "Phrase courte qui résume l’identité ou la vocation du site."
    },

    description: {
        placeholder: "Présente brièvement ce contenu...",
        help: "Texte descriptif affiché aux visiteurs. Reste clair, concis et informatif."
    },

    email: {
        placeholder: "contact@exemple.fr",
        help: "Adresse e-mail de contact. Utilise une adresse complète et valide."
    },

    copyright: {
        placeholder: "© 2026 Chest0 JM.S.",
        help: "Mention de droits d’auteur affichée sur le site."
    },

    id: {
        placeholder: "exemple-identifiant",
        help: "Identifiant technique interne unique. Utilise de préférence des lettres minuscules, des chiffres et des tirets, sans espace."
    },

    name: {
        placeholder: "Nom du contenu",
        help: "Nom public affiché aux visiteurs."
    },

    username: {
        placeholder: "@nomducompte",
        help: "Nom du compte ou identifiant utilisé sur la plateforme."
    },

    url: {
        placeholder: "https://exemple.com/...",
        help: "Adresse complète vers laquelle le visiteur sera dirigé."
    },

    enabled: {
        help: "Active cette option pour afficher cet élément sur le site public."
    },

    featured: {
        help: "Active cette option pour mettre cet élément davantage en avant."
    },

    platform: {
        placeholder: "Gumroad",
        help: "Nom de la plateforme ou du service associé à ce contenu."
    },

    status: {
        placeholder: "Projet",
        help: "État actuel du projet, par exemple : Projet, En cours ou Disponible."
    },

    author: {
        placeholder: "Chest0 JM.S.",
        help: "Nom ou pseudonyme de l’auteur."
    },

    amazonAuthorPage: {
        placeholder: "https://www.amazon.fr/...",
        help: "Adresse complète de ta page auteur Amazon."
    },

    title: {
        placeholder: "Titre du contenu",
        help: "Titre public du livre, de l’article ou du contenu."
    },

    amazonUrl: {
        placeholder: "https://www.amazon.fr/...",
        help: "Adresse complète de la page Amazon du livre."
    }

};


function getFieldHelp(
    key
) {

    return FIELD_HELP[key] || null;
}


function appendFieldHelp(
    wrapper,
    key
) {

    const config =
        getFieldHelp(
            key
        );


    if (
        !config ||
        !config.help
    ) {
        return;
    }


    const help =
        document.createElement(
            "small"
        );


    help.className =
        "field-help";


    help.textContent =
        config.help;


    wrapper.appendChild(
        help
    );
}


let allData = {};
let activeSectionId = "profile";
let csrfToken = "";
let ecosystemTimer = null;


document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    await loadStatus();

    await loadEcosystem();

    ecosystemTimer = window.setInterval(
        loadEcosystem,
        3000
    );

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

        csrfToken = data.csrfToken || "";


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



// UNSAVED_CHANGES_MARKER_V110
// PROGRAMMATIC_DIRTY_MARKER_V110

let hasUnsavedChanges =
    false;


function markUnsavedChanges() {

    hasUnsavedChanges =
        true;
}


function clearUnsavedChanges() {

    hasUnsavedChanges =
        false;
}


function confirmDiscardUnsavedChanges() {

    if (!hasUnsavedChanges) {
        return true;
    }


    return window.confirm(
        "Des modifications ne sont pas enregistrées. "
        + "Si tu continues, elles seront perdues. "
        + "Veux-tu abandonner ces modifications ?"
    );
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

                    if (
                        section.id ===
                        activeSectionId
                    ) {
                        return;
                    }


                    if (
                        !confirmDiscardUnsavedChanges()
                    ) {
                        return;
                    }


                    clearUnsavedChanges();


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
        "input",
        () => {

            markUnsavedChanges();
        }
    );


    form.addEventListener(
        "change",
        () => {

            markUnsavedChanges();
        }
    );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            try {

                await uploadPendingMedia(
                    form
                );

            } catch (error) {

                console.error(
                    "Chest0 Hub Admin — média :",
                    error
                );

                showNotification(
                    `Échec de l’image : ${error.message}`,
                    "error"
                );

                return;
            }


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


            markUnsavedChanges();
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


            markUnsavedChanges();
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


            markUnsavedChanges();
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


                markUnsavedChanges();
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

    const isMedia =
        isMediaField(
            key
        );


    const wrapper =
        document.createElement(
            isMedia
                ? "div"
                : "label"
        );


    wrapper.className =
        "field";


    wrapper.dataset.key =
        key;


    // ADMIN_FIELD_LAYOUT_MARKER_V110

    if (
        [
            "description",
            "url",
            "amazonUrl",
            "amazonAuthorPage"
        ].includes(
            key
        )
    ) {

        wrapper.classList.add(
            "field-wide"
        );
    }


    if (
        key === "id"
    ) {

        wrapper.classList.add(
            "technical-field"
        );
    }


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


    if (isMedia) {

        createMediaControl(
            wrapper,
            key,
            value ?? ""
        );


        return wrapper;
    }


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


        if (
            key === "email"
        ) {

            input.type =
                "email";


        } else if (
            [
                "url",
                "amazonUrl",
                "amazonAuthorPage"
            ].includes(
                key
            )
        ) {

            input.type =
                "url";


        } else {

            input.type =
                "text";
        }


        input.value =
            value ?? "";
    }


    input.dataset.key =
        key;


    if (
        input.type === "url"
    ) {

        input.autocomplete =
            "url";

        input.spellcheck =
            false;
    }


    if (
        input.type === "email"
    ) {

        input.autocomplete =
            "email";

        input.spellcheck =
            false;
    }


    if (
        key === "id"
    ) {

        input.autocomplete =
            "off";

        input.spellcheck =
            false;
    }


    const fieldHelp =
        getFieldHelp(
            key
        );


    if (
        fieldHelp &&
        fieldHelp.placeholder &&
        input.type !== "checkbox"
    ) {

        input.placeholder =
            fieldHelp.placeholder;
    }


    wrapper.appendChild(
        input
    );


    appendFieldHelp(
        wrapper,
        key
    );


    return wrapper;
}





// MEDIA_INTERFACE_MARKER_V110


const MEDIA_FIELD_CONFIG = {

    avatar: {
        kind: "avatar",
        buttonLabel: "Choisir un avatar",
        maximumSize: 5 * 1024 * 1024,
        maximumLabel: "5 Mo"
    },

    logo: {
        kind: "logo",
        buttonLabel: "Choisir un logo",
        maximumSize: 5 * 1024 * 1024,
        maximumLabel: "5 Mo"
    },

    image: {
        kind: "product",
        buttonLabel: "Choisir une image",
        maximumSize: 8 * 1024 * 1024,
        maximumLabel: "8 Mo"
    },

    cover: {
        kind: "book",
        buttonLabel: "Choisir une couverture",
        maximumSize: 8 * 1024 * 1024,
        maximumLabel: "8 Mo"
    }

};


const MEDIA_ACCEPTED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];


function isMediaField(
    key
) {

    return (
        Object.prototype.hasOwnProperty.call(
            MEDIA_FIELD_CONFIG,
            key
        )
    );
}


function createMediaControl(
    wrapper,
    key,
    value
) {

    const config =
        MEDIA_FIELD_CONFIG[key];


    wrapper.classList.add(
        "media-field"
    );


    const pathInput =
        document.createElement(
            "input"
        );


    pathInput.type =
        "text";


    pathInput.readOnly =
        true;


    pathInput.value =
        value;


    pathInput.dataset.key =
        key;


    pathInput.className =
        "media-path-input";


    pathInput.placeholder =
        "Aucune image sélectionnée";


    wrapper.appendChild(
        pathInput
    );


    const preview =
        document.createElement(
            "div"
        );


    preview.className =
        "media-preview";


    wrapper.appendChild(
        preview
    );


    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "media-controls";


    const selectButton =
        document.createElement(
            "button"
        );


    selectButton.type =
        "button";


    selectButton.className =
        "secondary-button media-select-button";


    selectButton.textContent =
        config.buttonLabel;


    // MEDIA_REMOVE_MARKER_V110

    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.className =
        "secondary-button media-remove-button";


    removeButton.textContent =
        "Retirer l’image";


    /*
     * Le logo est un élément structurel du site.
     * Il peut être remplacé, mais son retrait direct
     * est volontairement désactivé.
     */

    const canRemoveMedia =
        config.kind !== "logo";


    const fileInput =
        document.createElement(
            "input"
        );


    fileInput.type =
        "file";


    fileInput.accept =
        ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";


    fileInput.className =
        "media-file-input";


    fileInput.hidden =
        true;


    controls.appendChild(
        selectButton
    );


    if (
        canRemoveMedia
    ) {

        controls.appendChild(
            removeButton
        );
    }


    controls.appendChild(
        fileInput
    );


    wrapper.appendChild(
        controls
    );


    const help =
        document.createElement(
            "small"
        );


    help.className =
        "media-help";


    help.textContent =
        `Formats : PNG, JPG, JPEG, WEBP — maximum ${config.maximumLabel}.`;


    wrapper.appendChild(
        help
    );


    const status =
        document.createElement(
            "small"
        );


    status.className =
        "media-status";


    wrapper.appendChild(
        status
    );


    setMediaPreview(
        preview,
        value,
        status
    );


    selectButton.addEventListener(
        "click",
        () => {

            fileInput.click();
        }
    );


    if (
        canRemoveMedia
    ) {

        removeButton.addEventListener(
            "click",
            () => {

                const currentPath =
                    pathInput.value.trim();


                const hasPendingMedia =
                    Boolean(
                        wrapper._pendingMediaFile
                    );


                if (
                    !currentPath &&
                    !hasPendingMedia
                ) {

                    status.textContent =
                        "Aucune image à retirer.";


                    status.className =
                        "media-status";


                    return;
                }


                const confirmed =
                    window.confirm(
                        "Retirer cette image de la fiche ? "
                        + "Le fichier original sera conservé dans le projet. "
                        + "La modification ne sera définitive qu’après "
                        + "avoir cliqué sur Enregistrer."
                    );


                if (!confirmed) {

                    return;
                }


                if (
                    wrapper._mediaObjectUrl
                ) {

                    URL.revokeObjectURL(
                        wrapper._mediaObjectUrl
                    );


                    wrapper._mediaObjectUrl =
                        null;
                }


                wrapper._pendingMediaFile =
                    null;


                wrapper._mediaKind =
                    config.kind;


                fileInput.value =
                    "";


                pathInput.value =
                    "";


                markUnsavedChanges();


                setMediaPreview(
                    preview,
                    "",
                    status
                );


                status.textContent =
                    "Image retirée de la fiche. "
                    + "Clique sur Enregistrer pour confirmer.";


                status.className =
                    "media-status pending";
            }
        );
    }


    fileInput.addEventListener(
        "change",
        () => {

            const file =
                fileInput.files?.[0];


            if (!file) {

                return;
            }


            const currentPath =
                pathInput.value.trim();


            if (currentPath) {

                const confirmed =
                    window.confirm(
                        "Une image est déjà associée à ce champ. "
                        + "Veux-tu sélectionner une nouvelle image ? "
                        + "L’ancienne restera inchangée tant que "
                        + "tu ne cliques pas sur Enregistrer."
                    );


                if (!confirmed) {

                    fileInput.value =
                        "";

                    return;
                }
            }


            try {

                validateMediaFile(
                    file,
                    config
                );

            } catch (error) {

                fileInput.value =
                    "";


                status.textContent =
                    error.message;


                status.className =
                    "media-status error";


                return;
            }


            if (
                wrapper._mediaObjectUrl
            ) {

                URL.revokeObjectURL(
                    wrapper._mediaObjectUrl
                );
            }


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            wrapper._mediaObjectUrl =
                objectUrl;


            wrapper._pendingMediaFile =
                file;


            wrapper._mediaKind =
                config.kind;


            displayMediaPreview(
                preview,
                objectUrl,
                status,
                "Nouvelle image sélectionnée"
            );


            status.textContent =
                "Image prête. Clique sur Enregistrer pour l’importer.";


            status.className =
                "media-status pending";
        }
    );
}


function validateMediaFile(
    file,
    config
) {

    if (
        !MEDIA_ACCEPTED_TYPES.includes(
            file.type
        )
    ) {

        throw new Error(
            "Format non autorisé. "
            + "Choisis une image PNG, JPG, JPEG ou WEBP."
        );
    }


    if (
        file.size <= 0
    ) {

        throw new Error(
            "Le fichier sélectionné est vide."
        );
    }


    if (
        file.size >
        config.maximumSize
    ) {

        throw new Error(
            `L’image dépasse la taille maximale de ${config.maximumLabel}.`
        );
    }
}


function setMediaPreview(
    preview,
    path,
    status
) {

    preview.innerHTML =
        "";


    if (
        !path ||
        typeof path !== "string"
    ) {

        const placeholder =
            document.createElement(
                "span"
            );


        placeholder.className =
            "media-placeholder";


        placeholder.textContent =
            "Aucune image";


        preview.appendChild(
            placeholder
        );


        status.textContent =
            "";


        return;
    }


    const previewUrl =
        getProjectAssetPreviewUrl(
            path
        );


    if (!previewUrl) {

        const placeholder =
            document.createElement(
                "span"
            );


        placeholder.className =
            "media-placeholder";


        placeholder.textContent =
            "Chemin non prévisualisable";


        preview.appendChild(
            placeholder
        );


        return;
    }


    displayMediaPreview(
        preview,
        previewUrl,
        status,
        "Image actuelle"
    );
}


function getProjectAssetPreviewUrl(
    path
) {

    const cleanPath =
        String(path)
            .trim()
            .replace(
                /^\/+/,
                ""
            );


    if (
        !cleanPath.startsWith(
            "assets/"
        )
    ) {

        return null;
    }


    return (
        "/project-assets/"
        + cleanPath.slice(
            "assets/".length
        )
    );
}


function displayMediaPreview(
    preview,
    source,
    status,
    altText
) {

    preview.innerHTML =
        "";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        source;


    image.alt =
        altText;


    image.className =
        "media-preview-image";


    image.addEventListener(
        "error",
        () => {

            image.remove();


            const placeholder =
                document.createElement(
                    "span"
                );


            placeholder.className =
                "media-placeholder media-missing";


            placeholder.textContent =
                "Image introuvable";


            preview.appendChild(
                placeholder
            );


            if (status) {

                status.textContent =
                    "Le chemin enregistré ne correspond pas à une image disponible.";


                status.className =
                    "media-status error";
            }
        },
        {
            once: true
        }
    );


    preview.appendChild(
        image
    );
}


async function uploadPendingMedia(
    form
) {

    const mediaFields =
        Array.from(
            form.querySelectorAll(
                ".media-field"
            )
        );


    for (
        const field
        of mediaFields
    ) {

        const file =
            field._pendingMediaFile;


        if (!file) {

            continue;
        }


        const kind =
            field._mediaKind;


        const pathInput =
            field.querySelector(
                ".media-path-input"
            );


        const status =
            field.querySelector(
                ".media-status"
            );


        const preview =
            field.querySelector(
                ".media-preview"
            );


        if (
            !kind ||
            !pathInput
        ) {

            throw new Error(
                "Configuration média incomplète."
            );
        }


        if (status) {

            status.textContent =
                "Import de l’image en cours…";


            status.className =
                "media-status pending";
        }


        const result =
            await uploadMediaFile(
                file,
                kind
            );


        pathInput.value =
            result.path;


        field._pendingMediaFile =
            null;


        if (
            field._mediaObjectUrl
        ) {

            URL.revokeObjectURL(
                field._mediaObjectUrl
            );


            field._mediaObjectUrl =
                null;
        }


        if (
            preview &&
            result.previewUrl
        ) {

            displayMediaPreview(
                preview,
                result.previewUrl,
                status,
                "Image importée"
            );
        }


        if (status) {

            status.textContent =
                "Image importée. Le chemin sera enregistré avec la rubrique.";


            status.className =
                "media-status success";
        }
    }
}


async function uploadMediaFile(
    file,
    kind
) {

    const parameters =
        new URLSearchParams(
            {
                kind,
                filename:
                    file.name
            }
        );


    const response =
        await fetch(
            `/api/media/upload?${parameters.toString()}`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        file.type,
                    "X-CSRF-Token":
                        csrfToken
                },
                body:
                    file
            }
        );


    let result;


    try {

        result =
            await response.json();

    } catch (error) {

        throw new Error(
            "Réponse invalide du serveur."
        );
    }


    if (
        !response.ok ||
        !result.ok
    ) {

        throw new Error(
            result.error ||
            `Erreur HTTP ${response.status}`
        );
    }


    return result;
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
                            "application/json",
                        "X-CSRF-Token":
                            csrfToken
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


        clearUnsavedChanges();


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


async function loadEcosystem() {
    const container = document.getElementById("ecosystem-applications");
    if (!container) {
        return;
    }
    try {
        const response = await fetch("/api/ecosystem/status", {cache: "no-store"});
        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        renderEcosystem(result.applications);
    } catch (error) {
        container.replaceChildren();
        const message = document.createElement("p");
        message.className = "ecosystem-error";
        message.textContent = "État des applications indisponible.";
        container.appendChild(message);
    }
}


function renderEcosystem(applications) {
    const container = document.getElementById("ecosystem-applications");
    container.replaceChildren();
    applications.forEach((application) => {
        const card = document.createElement("article");
        card.className = "ecosystem-card";
        const heading = document.createElement("h3");
        heading.textContent = application.label;
        const state = document.createElement("span");
        state.className = `ecosystem-state state-${application.state}`;
        state.textContent = application.state.replaceAll("_", " ");
        const details = document.createElement("p");
        details.className = "ecosystem-details";
        details.textContent = `Version ${application.version} · HEAD ${application.head || "indéterminé"} · port ${application.port}`;
        const explanation = document.createElement("p");
        explanation.className = "ecosystem-message";
        explanation.textContent = application.message;
        const actions = document.createElement("div");
        actions.className = "ecosystem-actions";

        const start = ecosystemButton("Lancer", () => ecosystemAction("start", application.id));
        start.disabled = !["arrêté", "erreur"].includes(application.state);
        const open = ecosystemButton("Ouvrir", () => window.open(application.url, "_blank", "noopener"));
        open.disabled = !["opérationnel", "déjà_actif"].includes(application.state);
        const stop = ecosystemButton("Arrêter", () => ecosystemAction("stop", application.id));
        stop.disabled = !application.owned;
        actions.append(start, open, stop);
        const actionHelp = document.createElement("p");
        actionHelp.className = "ecosystem-action-help";
        actionHelp.textContent = "Lancer démarre l’application en arrière-plan · Ouvrir l’affiche dans le navigateur · Arrêter ferme uniquement le processus lancé par Hub.";
        card.append(heading, state, details, explanation, actions, actionHelp);
        container.appendChild(card);
    });
}


function ecosystemButton(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
}


async function ecosystemAction(action, applicationId) {
    try {
        const response = await fetch(`/api/ecosystem/${action}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify({applicationId})
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        showNotification(action === "start" ? "Application lancée." : "Application arrêtée.", "success");
        await loadEcosystem();
    } catch (error) {
        showNotification(`Écosystème : ${error.message}`, "error");
        await loadEcosystem();
    }
}


window.addEventListener(
    "beforeunload",
    (event) => {

        if (!hasUnsavedChanges) {
            return;
        }


        event.preventDefault();

        event.returnValue =
            "";
    }
);
