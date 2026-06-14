// ─────────────────────────────────────────────────────────────────
// Service Worker — YB Platform
// Cache strategy:
//   images thumb → Cache API (permanent, device)
//   images full  → Cache API (on view)
//   videos thumb → Cache API (permanent)
//   videos full  → pre-cache on scroll, stream online
//   catalog JSON → IndexedDB sync
// Reset on reconnect: evict bottom 50% by views
// ─────────────────────────────────────────────────────────────────

var CACHE_NAME    = "yb-media-v1";
var CATALOG_CACHE = "yb-catalog-v1";
var MEDIA_BUDGET  = 100 * 1024 * 1024; // 100MB

// ── Install ───────────────────────────────────────────────────────
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(clients.claim());
});

// ── Fetch intercept ───────────────────────────────────────────────
self.addEventListener("fetch", function(e) {
  var url = e.request.url;

  // media (images + videos from R2/CDN)
  if (url.includes("/media/") || url.includes("/cdn-cgi/image/")) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // catalog API
  if (url.includes("/api/products")) {
    e.respondWith(networkFirst(e.request));
    return;
  }
});

// ── Cache First (images + videos) ────────────────────────────────
async function cacheFirst(request) {
  var cache  = await caches.open(CACHE_NAME);
  var cached = await cache.match(request);
  if (cached) return cached;

  try {
    var res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    // offline + not cached → placeholder
    return caches.match("/placeholder.jpg") || new Response("", { status: 503 });
  }
}

// ── Network First (catalog) ───────────────────────────────────────
async function networkFirst(request) {
  try {
    var res   = await fetch(request);
    var cache = await caches.open(CATALOG_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    var cached = await caches.match(request);
    return cached || new Response(JSON.stringify({
      ok: false, data: [], source: "offline",
      msg: { text: "Offline", type: "error" },
    }), { headers: { "Content-Type": "application/json" } });
  }
}

// ── Message from UI: pre-cache video ─────────────────────────────
self.addEventListener("message", async function(e) {
  var data = e.data;

  // pre-cache video on scroll
  if (data.type === "PRECACHE_VIDEO") {
    var cache = await caches.open(CACHE_NAME);
    var exists = await cache.match(data.url);
    if (!exists) {
      try {
        var res = await fetch(data.url);
        if (res.ok) await cache.put(data.url, res);
      } catch (_) {}
    }
  }

  // reconnect: evict bottom 50% by views
  if (data.type === "RECONNECT_EVICT") {
    await evictLowViews(data.viewMap);
  }

  // pre-cache thumb list
  if (data.type === "PRECACHE_THUMBS") {
    var cache2 = await caches.open(CACHE_NAME);
    for (var i = 0; i < (data.urls || []).length; i++) {
      var url = data.urls[i];
      var ex  = await cache2.match(url);
      if (!ex) {
        try {
          var r = await fetch(url);
          if (r.ok) await cache2.put(url, r);
        } catch (_) {}
      }
    }
  }
});

// ── Evict bottom 50% by views ─────────────────────────────────────
async function evictLowViews(viewMap) {
  if (!viewMap) return;
  var cache = await caches.open(CACHE_NAME);
  var keys  = await cache.keys();

  // sort by views
  var sorted = keys
    .map(function(req) {
      return { req: req, views: viewMap[req.url] || 0 };
    })
    .sort(function(a, b) { return b.views - a.views; });

  // evict bottom 50%
  var cutoff = Math.floor(sorted.length / 2);
  for (var i = cutoff; i < sorted.length; i++) {
    await cache.delete(sorted[i].req);
  }
}
