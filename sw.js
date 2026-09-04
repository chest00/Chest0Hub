"use strict";


const CACHE_PREFIX =
    "chest0-hub-";


const CACHE_VERSION =
    `${CACHE_PREFIX}v1.3.0`;


const APP_SHELL = [

    "./",
    "./index.html",

    "./pages/livres.html",
    "./pages/blog.html",
    "./pages/produits.html",
    "./pages/projets.html",
    "./pages/apropos.html",
    "./pages/contact.html",

    "./assets/css/style.css",

    "./assets/js/app.js",
    "./assets/js/data-engine.js",

    "./assets/icons/chest0-mark.svg",
    "./assets/icons/menu.svg",
    "./assets/icons/close.svg",
    "./assets/icons/amazon.svg",
    "./assets/icons/blog.svg",
    "./assets/icons/gumroad.svg",
    "./assets/icons/tiktok.svg",
    "./assets/icons/youtube.svg",
    "./assets/icons/instagram.svg",
    "./assets/icons/facebook.svg",
    "./assets/icons/x.svg",
    "./assets/icons/mail.svg",

    "./404.html",
    "./manifest.webmanifest",

    "./data/profile.json",
    "./data/social.json",
    "./data/books.json",
    "./data/products.json",
    "./data/projects.json",
    "./data/blog.json"
];


self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(
            caches
                .open(
                    CACHE_VERSION
                )
                .then(
                    (cache) =>
                        cache.addAll(
                            APP_SHELL
                        )
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
                .then(
                    (cacheNames) => {

                        return Promise.all(
                            cacheNames
                                .filter(
                                    (cacheName) =>
                                        cacheName.startsWith(
                                            CACHE_PREFIX
                                        ) &&
                                        cacheName !== CACHE_VERSION
                                )
                                .map(
                                    (cacheName) =>
                                        caches.delete(
                                            cacheName
                                        )
                                )
                        );
                    }
                )
        );

        self.clients.claim();
    }
);


self.addEventListener(
    "fetch",
    (event) => {

        const request =
            event.request;

        if (
            request.method !== "GET"
        ) {
            return;
        }


        const requestUrl =
            new URL(
                request.url
            );


        if (
            requestUrl.origin !==
            self.location.origin
        ) {
            return;
        }


        event.respondWith(
            networkFirst(
                request
            )
        );
    }
);


async function networkFirst(
    request
) {

    try {

        const networkResponse =
            await fetch(
                request
            );


        if (
            networkResponse.ok
        ) {

            const cache =
                await caches.open(
                    CACHE_VERSION
                );


            await cache.put(
                request,
                networkResponse.clone()
            );
        }


        return networkResponse;


    } catch (error) {

        const cachedResponse =
            await caches.match(
                request
            );


        if (cachedResponse) {
            return cachedResponse;
        }


        if (
            request.mode === "navigate"
        ) {

            const fallback =
                await caches.match(
                    "./index.html"
                );


            if (fallback) {
                return fallback;
            }
        }


        throw error;
    }
}
