"use strict";


Deno.test(
    "profile.json met à jour le texte, le contact et les images publics",
    async () => {

        const profile = {
            brand: "Marque test",
            email: "test@example.com",
            logo: "assets/icons/test.svg",
            avatar: "assets/images/avatar/test.jpg"
        };

        const textElement = {
            dataset: {
                profile: "brand"
            },
            textContent: "Ancienne marque"
        };

        const linkElement = {
            dataset: {
                profileLink: "email"
            },
            href: "mailto:old@example.com"
        };

        const imageElement = {
            dataset: {
                profileImage: "avatar"
            },
            src: "old.jpg"
        };

        const documentMock = {
            querySelectorAll: (selector) => {
                if (selector === "[data-profile]") {
                    return [textElement];
                }

                if (selector === "[data-profile-link]") {
                    return [linkElement];
                }

                if (selector === "[data-profile-image]") {
                    return [imageElement];
                }

                return [];
            }
        };

        const windowMock = {
            location: {
                pathname: "/Chest0Hub/pages/contact.html"
            }
        };

        Object.defineProperty(
            globalThis,
            "document",
            {
                value: documentMock,
                configurable: true
            }
        );

        Object.defineProperty(
            globalThis,
            "window",
            {
                value: windowMock,
                configurable: true
            }
        );

        Object.defineProperty(
            globalThis,
            "fetch",
            {
                value: async () => ({
                    ok: true,
                    json: async () => profile
                }),
                configurable: true
            }
        );

        const source =
            await Deno.readTextFile(
                new URL(
                    "../assets/js/data-engine.js",
                    import.meta.url
                )
            );

        eval(source);

        await windowMock.Chest0Data.renderProfile();

        if (textElement.textContent !== "Marque test") {
            throw new Error(
                "Le texte public ne suit pas profile.json."
            );
        }

        if (linkElement.href !== "mailto:test@example.com") {
            throw new Error(
                "Le lien de contact ne suit pas profile.json."
            );
        }

        if (
            imageElement.src !==
            "../assets/images/avatar/test.jpg"
        ) {
            throw new Error(
                "L’image publique ne suit pas profile.json."
            );
        }
    }
);
