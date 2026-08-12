"use strict";


const CACHE_VERSION =
    "chest0-hub-v0.1.0";


const APP_SHELL = [
    "./",
    "./index.html",
    "./assets/css/style.css",
    "./assets/js/app.js",
    "./assets/icons/chest0-mark.svg",
    "./manifest.webmanifest",
    "./data/profile.json",
    "./data/links.json",
    "./data/projects.json",
    "./data/books.json",
    "./data/products.json",
    "./data/social.json"
];


self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(
            caches
                .open(CACHE_VERSION)
                .then(
                    (cache) =>
                        cache.addAll(APP_SHELL)
                )
        );

        self.skipWaiting();
    }
);


self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(
            caches
                .keys()
                .then((cacheNames) => {

                    return Promise.all(
                        cacheNames
                            .filter(
                                (cacheName) =>
                                    cacheName !== CACHE_VERSION
                            )
                            .map(
                                (cacheName) =>
                                    caches.delete(cacheName)
                            )
                    );
                })
        );

        self.clients.claim();
    }
);


self.addEventListener(
    "fetch",
    (event) => {

        if (event.request.method !== "GET") {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {

                    const copy =
                        networkResponse.clone();

                    caches
                        .open(CACHE_VERSION)
                        .then((cache) => {
                            cache.put(
                                event.request,
                                copy
                            );
                        });

                    return networkResponse;
                })
                .catch(async () => {

                    const cachedResponse =
                        await caches.match(
                            event.request
                        );

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    if (
                        event.request.mode === "navigate"
                    ) {
                        return caches.match(
                            "./index.html"
                        );
                    }

                    throw new Error(
                        "Ressource indisponible hors ligne."
                    );
                })
        );
    }
);
