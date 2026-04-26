// MPT Driver PWA Service Worker
const CACHE_NAME = "mpt-driver-v1";
const SYNC_TAG = "pod-submission";
const DB_NAME = "mpt-offline-queue";
const DB_STORE = "submissions";

// Assets to pre-cache for offline shell
const PRECACHE_URLS = [
  "/driver",
  "/driver/jobs",
  "/offline",
];

// ─── Install: cache shell ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first for API, cache-first for assets ─────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Let non-GET API calls pass through (they're handled by the queue on failure)
  if (request.method !== "GET") return;

  // Network-first for API and navigation
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache navigations for offline shell
          if (request.mode === "navigate" && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline")))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
      }
      return res;
    }))
  );
});

// ─── IndexedDB helpers ────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function getPendingSubmissions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteSubmission(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Background Sync: replay queued POD submissions ───────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueue());
  }
});

async function replayQueue() {
  const pending = await getPendingSubmissions();
  for (const entry of pending) {
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(entry.fields)) {
        fd.append(key, value);
      }
      // Re-attach photos — multi-photo (new format) takes priority, legacy single-photo as fallback
      if (entry.photos && entry.photos.length > 0) {
        for (const p of entry.photos) {
          const bytes = atob(p.base64);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const blob = new Blob([arr], { type: p.type });
          fd.append("photo", blob, p.name);
        }
      } else if (entry.photoBase64 && entry.photoName && entry.photoType) {
        // Legacy single-photo fallback
        const bytes = atob(entry.photoBase64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: entry.photoType });
        fd.append("photo", blob, entry.photoName);
      }
      const res = await fetch(entry.url, { method: "POST", body: fd });
      if (res.ok) {
        await deleteSubmission(entry.id);
        // Notify open clients of success
        const clients = await self.clients.matchAll();
        clients.forEach((c) => c.postMessage({ type: "SYNC_SUCCESS", entryId: entry.id, jobId: entry.jobId }));
      }
    } catch {
      // Will retry on next sync event
    }
  }
}

// ─── Message: manual retry trigger (for iOS fallback) ─────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "RETRY_QUEUE") {
    event.waitUntil(replayQueue());
  }
});
