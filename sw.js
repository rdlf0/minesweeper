/**
 * Hand-written service worker. Deliberately no Workbox and no `importScripts` from a
 * CDN: the project takes no third-party dependencies (see CONTRIBUTING.md), and pulling
 * the library at runtime also made worker start-up depend on an external host being up.
 *
 * Two strategies cover everything the app asks for:
 *   - network-first for things that must be current when the network allows (the
 *     document, and the config the app cannot boot without);
 *   - stale-while-revalidate for static assets, which are served from cache instantly
 *     and refreshed in the background.
 *
 * Note the consequence of stale-while-revalidate: a new deploy lands in the cache on the
 * load that discovers it, so it is the *next* load that runs the new code.
 */

const HTML_CACHE = "html";
const JS_CACHE = "javascript";
const STYLE_CACHE = "stylesheets";
const IMAGE_CACHE = "images";
const MANIFEST_CACHE = "manifest";
const CONFIG_CACHE = "config";
const RELEASE_CACHE = "release";

const KNOWN_CACHES = [
    HTML_CACHE,
    JS_CACHE,
    STYLE_CACHE,
    IMAGE_CACHE,
    MANIFEST_CACHE,
    CONFIG_CACHE,
    RELEASE_CACHE,
];

/** How long a network-first request waits before the cached copy is served instead. */
const NETWORK_TIMEOUT_SECONDS = 3;

const RELEASES_URL = "https://api.github.com/repos/rdlf0/minesweeper/releases/latest";

/* Nothing is precached, so there is nothing to wait for — and waiting is precisely the
   problem. A worker that sits in `waiting` only activates once every client closes, and
   a reload does not close a client, so in an installed PWA a deploy could go unnoticed
   indefinitely. Activating straight away is what makes pull-to-refresh able to deliver a
   new version at all. */
self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        // Drops caches this file no longer knows about, so a renamed cache can't linger.
        const names = await caches.keys();
        await Promise.all(
            names
                .filter(name => !KNOWN_CACHES.includes(name))
                .map(name => caches.delete(name)),
        );

        // Take over the already-open page too, rather than only future navigations.
        await self.clients.claim();
    })());
});

const ROUTES = [
    {
        match: (request) => request.destination === "document",
        handle: (event) => networkFirst(event, HTML_CACHE),
    },
    {
        // `main.ts` cannot construct Game without this one, and a bare `fetch()` has an
        // empty `destination` — so it has to be matched by path rather than by type.
        // Missing that is what used to leave the app dead offline with everything else
        // sitting in the cache.
        match: (request) => isSameOrigin(request) && pathOf(request).endsWith("/config.json"),
        handle: (event) => networkFirst(event, CONFIG_CACHE),
    },
    {
        match: (request) => request.destination === "script",
        handle: (event) => staleWhileRevalidate(event, JS_CACHE),
    },
    {
        match: (request) => request.destination === "style",
        handle: (event) => staleWhileRevalidate(event, STYLE_CACHE),
    },
    {
        match: (request) => request.destination === "image",
        handle: (event) => staleWhileRevalidate(event, IMAGE_CACHE),
    },
    {
        match: (request) => request.destination === "manifest",
        handle: (event) => staleWhileRevalidate(event, MANIFEST_CACHE),
    },
    {
        match: (request) => request.url === RELEASES_URL,
        handle: (event) => staleWhileRevalidate(event, RELEASE_CACHE),
    },
];

self.addEventListener("fetch", (event) => {
    // Only GET is cacheable — and the win-score POST must reach the network untouched.
    if (event.request.method !== "GET") {
        return;
    }

    const route = ROUTES.find(candidate => candidate.match(event.request));
    if (route !== undefined) {
        event.respondWith(route.handle(event));
    }
});

/** Cached copy immediately, refreshed in the background for next time. */
async function staleWhileRevalidate(event, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(event.request);
    const network = fetchAndCache(event, cache);

    if (cached === undefined) {
        return network;
    }

    // The refresh outlives the response, so the worker has to be held open for it — and
    // its rejection handled here, or an offline load reports an unhandled rejection.
    event.waitUntil(network.catch(() => { /* the cached copy already answered */ }));

    return cached;
}

/** Network when it answers in time, cache when it doesn't. */
async function networkFirst(event, cacheName) {
    const cache = await caches.open(cacheName);
    const network = fetchAndCache(event, cache);

    // Raced rather than aborted: a slow response still populates the cache once it lands.
    event.waitUntil(network.catch(() => { /* handled by the fallback below */ }));

    try {
        return await Promise.race([network, rejectAfter(NETWORK_TIMEOUT_SECONDS)]);
    } catch {
        const cached = await cache.match(event.request);
        if (cached !== undefined) {
            return cached;
        }

        throw new Error(`Offline with nothing cached for ${event.request.url}`);
    }
}

async function fetchAndCache(event, cache) {
    const response = await fetch(event.request);

    // Errors and redirects are not worth serving back later.
    if (response.ok) {
        event.waitUntil(cache.put(event.request, response.clone()));
    }

    return response;
}

function rejectAfter(seconds) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Network timed out")), seconds * 1000);
    });
}

function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}

function pathOf(request) {
    return new URL(request.url).pathname;
}
