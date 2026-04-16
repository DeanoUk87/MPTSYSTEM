"use client";
import { useState, useEffect } from "react";

let cached: { perms: Set<string>; roles: string[] } | null = null;
const listeners: Array<() => void> = [];

function notify() { listeners.forEach(fn => fn()); }

export function usePermissions() {
  const [state, setState] = useState<{ perms: Set<string>; roles: string[] } | null>(cached);

  useEffect(() => {
    if (cached) { setState(cached); return; }

    fetch("/api/me")
      .then(r => r.json())
      .then(d => {
        const perms = new Set<string>((d?.permissions ?? []) as string[]);
        const roles: string[] = d?.roles ?? [];
        cached = { perms, roles };
        notify();
      })
      .catch(() => {
        cached = { perms: new Set(), roles: [] };
        notify();
      });

    const fn = () => setState(cached);
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }, []);

  const isAdmin = state?.roles.includes("admin") ?? false;
  const has = (perm: string) => isAdmin || (state?.perms.has(perm) ?? false);
  const loaded = state !== null;

  return { has, isAdmin, loaded };
}
