importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.2/workbox-sw.js');

const HTML_CACHE = "html";
const JS_CACHE = "javascript";
const STYLE_CACHE = "stylesheets";
const IMAGE_CACHE = "images";
const MANIFEST_CACHE = "manifest";
const RELEASE_CACHE = "release";

workbox.setConfig({
    debug: false
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

workbox.routing.registerRoute(
    ({ event }) => event.request.destination === 'document',
    new workbox.strategies.NetworkFirst({
        cacheName: HTML_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 10,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ event }) => event.request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: JS_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 15,
                maxAgeSeconds: 31536000,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ event }) => event.request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: STYLE_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 15,
                maxAgeSeconds: 31536000,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ event }) => event.request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: IMAGE_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 15,
                maxAgeSeconds: 31536000,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ event }) => event.request.destination === 'manifest',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: MANIFEST_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 15,
                maxAgeSeconds: 31536000,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ url }) => url.href === 'https://api.github.com/repos/rdlf0/minesweeper/releases/latest',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: RELEASE_CACHE,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 15,
                maxAgeSeconds: 31536000,
            }),
        ],
    })
);
