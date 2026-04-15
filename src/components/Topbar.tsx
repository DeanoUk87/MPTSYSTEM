"use client";
import { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [user, setUser] = useState<{ name?: string; roles?: string[] } | null>(null);

  useEffect(() => {
    let attempts = 0;
    function tryFetch() {
      fetch("/api/me").then((r) => r.ok ? r.json() : null).then(data => {
        if (data?.name) setUser(data);
        else if (attempts++ < 4) setTimeout(tryFetch, 1500);
      }).catch(() => { if (attempts++ < 4) setTimeout(tryFetch, 1500); });
    }
    tryFetch();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.roles?.[0] ?? ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
