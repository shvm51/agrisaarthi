/**
 * AgriSaarthi service worker — offline-aware PWA.
 *
 * Strategy:
 * - App shell / navigations: network-first, offline page fallback.
 * - Same-origin static assets: cache-first.
 * - Cross-origin API GETs (FastAPI): network-first with cache fallback,
 *   but NEVER cached when an Authorization header is present (no leaking
 *   private per-user data into the shared cache).
 */
const VERSION = "v1";
const STATIC_CACHE = `agrisaarthi-static-${VERSION}`;
const API_CACHE = `agrisaarthi-api-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/manifest.webmanifest"]))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("agrisaarthi-") && !k.includes(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin API: network-first, cache fallback (no auth'd responses cached).
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !request.headers.get("authorization")) {
            const copy = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (hit) =>
              hit ||
              new Response(JSON.stringify({ error: "offline" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }),
          ),
        ),
    );
    return;
  }

  // Navigations: network-first, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((hit) => hit || Response.error()),
      ),
    );
    return;
  }

  // Same-origin static: cache-first.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
