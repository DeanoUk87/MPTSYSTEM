// Offline submission queue using IndexedDB
// Works on both Android (with Background Sync) and iOS (manual retry)

const DB_NAME = "mpt-offline-queue";
const DB_STORE = "submissions";
const DB_VERSION = 1;

export interface PhotoEntry {
  base64: string;
  name: string;
  type: string;
}

export interface QueueEntry {
  id: string;
  url: string;
  jobId: string;
  type: "deliver" | "via";
  fields: Record<string, string>;
  // Multi-photo (new)
  photos?: PhotoEntry[];
  // Legacy single-photo fields (kept for backward-compat with already-queued entries)
  photoBase64?: string;
  photoName?: string;
  photoType?: string;
  queuedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSubmission(entry: QueueEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSubmissions(): Promise<QueueEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingForJob(jobId: string): Promise<QueueEntry[]> {
  const all = await getPendingSubmissions();
  return all.filter((e) => e.jobId === jobId);
}

// Convert File to base64 for IndexedDB storage
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Convert an array of Files to PhotoEntry[] for IndexedDB storage
export async function filesToPhotoEntries(files: File[]): Promise<PhotoEntry[]> {
  return Promise.all(
    files.map(async (file) => ({
      base64: await fileToBase64(file),
      name: file.name,
      type: file.type,
    }))
  );
}

// Replay a single queued entry — returns true if successful
export async function replayEntry(entry: QueueEntry): Promise<boolean> {
  try {
    const fd = new FormData();
    for (const [key, value] of Object.entries(entry.fields)) {
      fd.append(key, value);
    }

    // Multi-photo (new format)
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
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Register for Background Sync (Android Chrome only)
export async function registerBackgroundSync(): Promise<void> {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register("pod-submission");
    } catch {
      // Background Sync not available — iOS fallback handles this
    }
  }
}
