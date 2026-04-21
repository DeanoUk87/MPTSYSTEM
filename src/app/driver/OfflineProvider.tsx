"use client";
import { useEffect } from "react";
import { replayEntry, getPendingSubmissions } from "@/lib/offline-queue";

// Registers the service worker and handles offline queue replay for iOS fallback.
// Runs silently in the background — no visible UI.
export default function DriverOfflineProvider() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});

      // Listen for sync success messages from SW (Android Background Sync)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_SUCCESS") {
          window.dispatchEvent(new CustomEvent("pod-sync-success", { detail: event.data }));
        }
      });
    }

    async function tryReplayQueue() {
      if (!navigator.onLine) return;
      try {
        const pending = await getPendingSubmissions();
        let synced = 0;
        for (const entry of pending) {
          const ok = await replayEntry(entry);
          if (ok) synced++;
        }
        if (synced > 0) {
          window.dispatchEvent(new CustomEvent("pod-sync-success", { detail: { count: synced } }));
        }
      } catch {
        // Silent — will retry on next trigger
      }
    }

    // iOS fallback: retry when coming back online or tab becomes visible
    window.addEventListener("online", tryReplayQueue);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tryReplayQueue();
    });

    // Run once on mount to catch any stale entries
    tryReplayQueue();

    return () => {
      window.removeEventListener("online", tryReplayQueue);
    };
  }, []);

  return null;
}
