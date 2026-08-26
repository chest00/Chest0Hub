"use strict";


Deno.test(
    "le Service Worker ne supprime que les caches Chest0 Hub obsolètes",
    async () => {

        const handlers = {};
        const deletedCaches = [];


        Object.defineProperty(
            globalThis,
            "self",
            {
                value: {
                    addEventListener: (
                        name,
                        callback
                    ) => {
                        handlers[name] = callback;
                    },
                    skipWaiting: () => {},
                    clients: {
                        claim: () => {}
                    },
                    location: {
                        origin:
                            "https://chest00.github.io"
                    }
                },
                configurable: true
            }
        );


        Object.defineProperty(
            globalThis,
            "caches",
            {
                value: {
                    keys: async () => [
                        "other-app-v7",
                        "chest0-hub-v0.9.0",
                        "chest0-hub-v1.0.0",
                        "chest0-hub-v1.2.0"
                    ],
                    delete: async (name) => {
                        deletedCaches.push(name);
                        return true;
                    },
                    open: async () => ({
                        addAll: async () => {},
                        put: async () => {}
                    }),
                    match: async () => undefined
                },
                configurable: true
            }
        );


        const source =
            await Deno.readTextFile(
                new URL(
                    "../sw.js",
                    import.meta.url
                )
            );


        eval(source);


        let activation;


        handlers.activate(
            {
                waitUntil: (promise) => {
                    activation = promise;
                }
            }
        );


        await activation;


        if (
            JSON.stringify(deletedCaches) !==
            JSON.stringify(
                [
                    "chest0-hub-v0.9.0",
                    "chest0-hub-v1.0.0"
                ]
            )
        ) {

            throw new Error(
                "Le nettoyage des caches dépasse "
                + "le périmètre Chest0 Hub."
            );
        }
    }
);
