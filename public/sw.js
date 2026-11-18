/* Network-first shell: online visits always use the current deployment. */
const CACHE_VERSION = "katalyst-shell-v3";
const CACHE_PREFIX = "katalyst-shell-";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const MAX_STATIC_ENTRIES = 80;
const STATIC_URLS = [
  "/offline.html",
  "/brand/katalyst.png",
  "/icons/katalyst-favicon.png",
  "/icons/katalyst-icon-192.png",
  "/icons/katalyst-icon-512.png",
  "/icons/katalyst-icon-maskable-512.png",
  "/icons/katalyst-apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.all(STATIC_URLS.map(async (url) => {
      try { await cache.add(url); } catch { /* Keep install available when one optional asset is offline. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== STATIC_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isCacheableAsset(request, url) {
  return request.destination === "script" || request.destination === "style" || request.destination === "font" ||
    url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/") || url.pathname === "/icon.png" || /\.(?:woff2?|ttf|otf|css|js|mjs)$/.test(url.pathname);
}

async function cacheAssetResponse(request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  const cache = await caches.open(STATIC_CACHE);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  if (keys.length > MAX_STATIC_ENTRIES) {
    await Promise.all(keys.slice(0, keys.length - MAX_STATIC_ENTRIES).map((key) => cache.delete(key)));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    if (new URL(request.url).origin === self.location.origin && new URL(request.url).pathname.startsWith("/api/")) {
      event.respondWith(fetch(request).catch(() => Response.json({ error: "KATALYST is offline. Reconnect and try again." }, { status: 503, headers: { "Cache-Control": "no-store" } })));
    }
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(async () => {
      const offline = await caches.match("/offline.html");
      return offline || new Response("KATALYST is offline. Reconnect and try again.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request, { cache: "no-store" }).catch(() => Response.json({ error: "KATALYST is offline. Reconnect and try again." }, { status: 503, headers: { "Cache-Control": "no-store" } })));
    return;
  }

  if (!isCacheableAsset(request, url)) return;
  event.respondWith(fetch(request, { cache: "no-cache" })
    .then((response) => cacheAssetResponse(request, response))
    .catch(async () => {
      const cached = await caches.match(request);
      return cached || new Response("This resource is unavailable offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
});
