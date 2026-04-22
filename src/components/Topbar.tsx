"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, User, Thermometer, CalendarClock, X } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

interface TempAlert {
  id: string;
  unitNumber: string;
  unitType: string | null;
  temperature: string;
  currentDriver?: { name: string } | null;
}

interface TomorrowJob {
  id: string;
  jobRef?: string;
  collectionTime?: string;
  customer?: { name: string };
  collectionName?: string;
  deliveryName?: string;
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.35].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.35, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.28);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.28);
    });
  } catch { /* AudioContext not available */ }
}

function isTempOutOfRange(temperature: string | null | undefined, unitType: string | null | undefined): boolean {
  if (temperature == null) return false;
  const t = parseFloat(temperature);
  const type = (unitType || "chill").toLowerCase();
  if (type === "chill") return t < 2 || t > 8;
  if (type === "ambient") return t < 15 || t > 25;
  if (type === "frozen") return t < -25 || t > -18;
  return false;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [user, setUser] = useState<{ name?: string; roles?: string[] } | null>(null);
  const [tempAlerts, setTempAlerts] = useState<TempAlert[]>([]);
  const [tomorrowJobs, setTomorrowJobs] = useState<TomorrowJob[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevTempIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

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

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const [tempRes, jobsRes] = await Promise.allSettled([
          fetch("/api/storage/temperature"),
          fetch(`/api/bookings?dateFrom=${tomorrow}&dateTo=${tomorrow}`),
        ]);

        if (tempRes.status === "fulfilled" && tempRes.value.ok) {
          const data = await tempRes.value.json();
          const out: TempAlert[] = (Array.isArray(data) ? data : []).filter((u: any) =>
            isTempOutOfRange(u.temperature, u.unitType)
          );
          const hasNew = out.some((u) => !prevTempIds.current.has(u.id));
          if (hasNew && !initialLoad.current) playAlertSound();
          prevTempIds.current = new Set(out.map((u) => u.id));
          setTempAlerts(out);
        }

        if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
          const data = await jobsRes.value.json();
          const noDriver = (Array.isArray(data) ? data : []).filter((b: any) =>
            !b.driver && !b.secondMan && !b.cxDriver &&
            b.bookingType?.name?.toLowerCase() !== "quote"
          );
          setTomorrowJobs(noDriver);
        }
      } catch { /* silent */ } finally {
        initialLoad.current = false;
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const total = tempAlerts.length + tomorrowJobs.length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Notifications"
          >
            <Bell className={`w-4 h-4 ${total > 0 ? "text-rose-500" : "text-slate-600"}`} />
            {total > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {total === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">All clear — no alerts</div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {tempAlerts.map(a => {
                    const t = parseFloat(a.temperature).toFixed(1);
                    const type = (a.unitType || "chill").toLowerCase();
                    const range = type === "chill" ? "2–8°C" : type === "frozen" ? "-25 to -18°C" : "15–25°C";
                    return (
                      <div key={`temp-${a.id}`} className="px-4 py-3 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {a.unitNumber} <span className="text-slate-400 font-normal text-xs">({a.unitType ?? "chill"})</span>
                          </p>
                          <p className="text-xs text-rose-600 font-semibold">{t}°C — outside {range}</p>
                          {a.currentDriver && <p className="text-xs text-slate-400 mt-0.5">Driver: {a.currentDriver.name}</p>}
                        </div>
                      </div>
                    );
                  })}

                  {tomorrowJobs.map(b => (
                    <Link
                      key={`job-${b.id}`}
                      href={`/admin/bookings/${b.id}/edit`}
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          No driver — {b.jobRef ?? "No ref"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Tomorrow{b.collectionTime ? ` at ${b.collectionTime}` : ""}{b.customer?.name ? ` · ${b.customer.name}` : ""}
                        </p>
                        {(b.collectionName || b.deliveryName) && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{b.collectionName} → {b.deliveryName}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile link */}
        <Link href="/admin/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
        </Link>
      </div>
    </header>
  );
}
