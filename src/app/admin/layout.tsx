"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { Thermometer, X } from "lucide-react";

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Two short beeps
    [0, 0.35].forEach((startOffset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.35, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + 0.28);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + 0.28);
    });
  } catch { /* AudioContext not available (e.g. SSR) */ }
}

function GlobalTempAlert() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const prevAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/storage/temperature");
        if (!res.ok) return;
        const data = await res.json();
        const out = data.filter((u: any) => {
          if (u.temperature == null) return false;
          const t = parseFloat(u.temperature);
          const type = (u.unitType || "chill").toLowerCase();
          if (type === "chill") return t < 2 || t > 8;
          if (type === "ambient") return t < 15 || t > 25;
          if (type === "frozen") return t < -25 || t > -18;
          return false;
        });
        // Play sound if any alert ID is new (not seen before and not dismissed)
        const hasNew = out.some((u: any) => !prevAlertIds.current.has(String(u.id)));
        if (hasNew) playAlertSound();
        prevAlertIds.current = new Set(out.map((u: any) => String(u.id)));
        setAlerts(out);
      } catch {}
    }
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {visible.map((a: any) => {
        const t = parseFloat(a.temperature).toFixed(1);
        const type = (a.unitType || "chill").toLowerCase();
        const range = type === "chill" ? "2–8°C" : type === "frozen" ? "-25 to -18°C" : "15–25°C";
        return (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3 bg-rose-600 text-white rounded-xl shadow-lg text-sm">
            <Thermometer className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-semibold">{a.unitNumber}</span>
              <span className="text-rose-200"> ({a.unitType})</span>
              {" — "}<span className="font-semibold">{t}°C</span>
              <span className="text-rose-200"> outside range {range}</span>
              {a.currentDriver && <span className="block text-xs text-rose-200 mt-0.5">Driver: {a.currentDriver.name}</span>}
            </div>
            <button onClick={() => setDismissed(p => new Set([...p, a.id]))} className="text-rose-200 hover:text-white mt-0.5 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mp_sidebar_collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function handleToggle(v: boolean) {
    setCollapsed(v);
    localStorage.setItem("mp_sidebar_collapsed", String(v));
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={`flex-1 min-w-0 min-h-screen flex flex-col transition-[margin] duration-200 ${collapsed ? "ml-16" : "ml-64"}`}>
        {children}
      </main>
      <GlobalTempAlert />
    </div>
  );
}

