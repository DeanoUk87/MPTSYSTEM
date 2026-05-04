"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Loader2, LogOut, CheckCircle2, ArrowLeft, MapPin, Paperclip, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";

// --- Types ---
interface ViaAddress {
  id: string; name?: string; postcode?: string;
  viaType?: string; address1?: string; area?: string; notes?: string;
  signedBy?: string; podRelationship?: string; podDate?: string; podTime?: string; deliveredTemp?: string;
}

interface StorageUnit { id: string; unitNumber: string; unitType?: string; imei?: string; }

interface Booking {
  id: string; jobRef?: string;
  collectionDate?: string; collectionTime?: string;
  collectionName?: string; collectionPostcode?: string;
  deliveryTime?: string; deliveryName?: string; deliveryPostcode?: string;
  deliveryNotes?: string;
  purchaseOrder?: string; jobNotes?: string;
  jobStatus: number; podSignature?: string; podDataVerify: boolean;
  podDate?: string; podTime?: string; podRelationship?: string; deliveredTemperature?: string;
  podUpload?: string;
  hideTrackingTemperature: boolean; hideTrackingMap: boolean;
  driver?: { name: string };
  secondMan?: { name: string };
  chillUnit?: StorageUnit; ambientUnit?: StorageUnit;
  viaAddresses?: ViaAddress[];
}

// --- Helpers ---
const ORDERS_SEP = "---ORDERS---";
function parseOrders(notes?: string): { ref: string; types: string[] }[] {
  if (!notes) return [];
  const idx = notes.indexOf(ORDERS_SEP);
  if (idx < 0) return [];
  try {
    const raw = JSON.parse(notes.slice(idx + ORDERS_SEP.length));
    return Array.isArray(raw) ? raw.map((o: any) => ({
      ref: o.ref || "",
      types: Array.isArray(o.types) ? o.types : o.type ? [o.type] : [],
    })) : [];
  } catch { return []; }
}

function typeChipCls(type?: string) {
  const t = (type ?? "").toLowerCase();
  if (t.startsWith("chill")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (t.startsWith("amb"))   return "bg-green-100 text-green-700 border-green-200";
  if (t === "pump")          return "bg-orange-100 text-orange-700 border-orange-200";
  if (t === "stores")        return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function tempColorCls(c: number) {
  if (c < 0)  return "bg-blue-800 text-white";
  if (c < 5)  return "bg-blue-500 text-white";
  if (c < 15) return "bg-emerald-500 text-white";
  return "bg-orange-500 text-white";
}

function viasAllPodded(b: Booking) {
  return !b.viaAddresses?.length || b.viaAddresses.every(v => !!v.signedBy);
}

function statusInfo(b: Booking) {
  const vp = viasAllPodded(b);
  if (b.podSignature && b.podDataVerify && vp)
    return { label: "Completed",        cls: "bg-blue-500 text-white",    rowCls: "bg-blue-50 border-l-4 border-l-blue-400",       green: true  };
  if (b.podSignature && vp)
    return { label: "POD Received",     cls: "bg-emerald-500 text-white", rowCls: "bg-emerald-50 border-l-4 border-l-emerald-400", green: false };
  if (b.driver || b.secondMan)
    return { label: "Driver Allocated", cls: "bg-amber-400 text-white",   rowCls: "bg-amber-50 border-l-4 border-l-amber-400",     green: false };
  return   { label: "Booked",           cls: "bg-rose-500 text-white",    rowCls: "bg-rose-50 border-l-4 border-l-rose-400",      green: false };
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// --- Live tracking hook ---
interface TrackData { lat: number; lng: number; temperature?: number; timestamp?: string; }
declare global { interface Window { google?: any; } }

// Convert a UTC timestamp string from the GPS API ("2026-04-20 13:35:38" or ISO) to Europe/London display time
function utcToLondon(utcStr?: string): string {
  if (!utcStr) return "";
  try {
    const d = new Date(utcStr.includes("T") ? utcStr : utcStr.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return utcStr;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
  } catch { return utcStr; }
}

function useTracking(imei?: string | null) {
  const [data, setData] = useState<TrackData | null>(null);
  useEffect(() => {
    if (!imei) return;
    let alive = true;
    const poll = () =>
      fetch(`/api/tracking/${imei}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (alive && d?.lat) setData(d); })
        .catch(() => {});
    // Poll immediately, then again after 5 s (first-load fast retry), then every 30 s
    poll();
    const quick = setTimeout(poll, 5_000);
    const id = setInterval(poll, 30_000);
    return () => { alive = false; clearTimeout(quick); clearInterval(id); };
  }, [imei]);
  return data;
}

// --- Map component ---
function LiveMap({ chillImei, ambImei, chillData, ambData, showTempLegend, chillUnit, ambUnit, sharedTimestamp, hideTemperature }: {
  chillImei?: string | null; ambImei?: string | null;
  chillData: TrackData | null; ambData: TrackData | null;
  showTempLegend: boolean;
  chillUnit?: StorageUnit | null; ambUnit?: StorageUnit | null;
  sharedTimestamp?: string;
  hideTemperature?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const map    = useRef<any>(null);
  const cM     = useRef<any>(null);
  const aM     = useRef<any>(null);
  const iW     = useRef<any>(null); // shared InfoWindow
  // Store latest data in refs so init() can read current values without stale closures
  const lChill = useRef(chillData);
  const lAmb   = useRef(ambData);
  const lChillUnit = useRef(chillUnit);
  const lAmbUnit   = useRef(ambUnit);
  const lSharedTs  = useRef(sharedTimestamp);
  const lHideTemp  = useRef(hideTemperature);
  useEffect(() => { lChill.current = chillData; }, [chillData]);
  useEffect(() => { lAmb.current   = ambData;   }, [ambData]);
  useEffect(() => { lChillUnit.current = chillUnit; }, [chillUnit]);
  useEffect(() => { lAmbUnit.current   = ambUnit;   }, [ambUnit]);
  useEffect(() => { lSharedTs.current  = sharedTimestamp; }, [sharedTimestamp]);
  useEffect(() => { lHideTemp.current  = hideTemperature; }, [hideTemperature]);

  function buildInfoContent(unit: StorageUnit | null | undefined, track: TrackData | null): string {
    const typeLabel = unit?.unitType
      ? unit.unitType.charAt(0).toUpperCase() + unit.unitType.slice(1).toLowerCase()
      : "Unit";
    const unitNum = unit?.unitNumber ?? "";
    const tempLine = !lHideTemp.current && track?.temperature !== undefined && track.temperature !== null
      ? `<div style="margin:4px 0">🌡 <b>Temperature:</b> ${Number(track.temperature).toFixed(1)} °C</div>`
      : "";
    // Use the shared (most recent) timestamp across both units — both are on the same vehicle
    const tsSource = lSharedTs.current ?? track?.timestamp;
    const updated = tsSource ? utcToLondon(tsSource) : "";
    const updLine = updated ? `<div style="margin:4px 0;color:#6b7280;font-size:11px">Updated: ${updated}</div>` : "";
    return `<div style="font-size:13px;line-height:1.5;padding:2px 4px">
  <div style="font-weight:700;margin-bottom:4px">${typeLabel} (${unitNum})</div>
  ${tempLine}${updLine}
</div>`;
  }

  function ensureInfoWindow() {
    if (!iW.current) iW.current = new window.google.maps.InfoWindow();
    return iW.current;
  }

  function placeMarkers() {
    if (!map.current) return;
    const cd = lChill.current;
    const ad = lAmb.current;
    if (cd) {
      const pos = { lat: cd.lat, lng: cd.lng };
      if (cM.current) { cM.current.setPosition(pos); map.current.panTo(pos); }
      else {
        cM.current = new window.google.maps.Marker({
          position: pos, map: map.current, title: "Chill Unit",
          icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });
        cM.current.addListener("click", () => {
          if (lHideTemp.current) return;
          const iw = ensureInfoWindow();
          iw.setContent(buildInfoContent(lChillUnit.current, lChill.current));
          iw.open(map.current, cM.current);
        });
        map.current.panTo(pos);
        map.current.setZoom(13);
      }
    }
    if (ad) {
      const pos = { lat: ad.lat, lng: ad.lng };
      if (aM.current) { aM.current.setPosition(pos); }
      else {
        aM.current = new window.google.maps.Marker({
          position: pos, map: map.current, title: "Ambient Unit",
          icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        });
        aM.current.addListener("click", () => {
          if (lHideTemp.current) return;
          const iw = ensureInfoWindow();
          iw.setContent(buildInfoContent(lAmbUnit.current, lAmb.current));
          iw.open(map.current, aM.current);
        });
        if (!lChill.current) { map.current.panTo(pos); map.current.setZoom(13); }
      }
    }
  }

  function init() {
    if (!divRef.current || !window.google?.maps || map.current) return;
    map.current = new window.google.maps.Map(divRef.current, {
      center: { lat: 52.5, lng: -1.5 }, zoom: 7,
    });
    placeMarkers();
  }

  useEffect(() => {
    if (!MAPS_API_KEY) return;
    if (window.google?.maps) { init(); return; }
    // Inject Maps script once if not already present
    if (!document.getElementById("gmap-script")) {
      const s = document.createElement("script");
      s.id = "gmap-script";
      s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
      s.async = true;
      document.head.appendChild(s);
    }
    const t = setInterval(() => { if (!window.google?.maps) return; clearInterval(t); init(); }, 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!map.current || !chillData) return;
    const pos = { lat: chillData.lat, lng: chillData.lng };
    if (cM.current) { cM.current.setPosition(pos); map.current.panTo(pos); }
    else {
      cM.current = new window.google.maps.Marker({
        position: pos, map: map.current, title: "Chill Unit",
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      });
      cM.current.addListener("click", () => {
        const iw = ensureInfoWindow();
        iw.setContent(buildInfoContent(lChillUnit.current, lChill.current));
        iw.open(map.current, cM.current);
      });
      map.current.panTo(pos);
      map.current.setZoom(13);
    }
  }, [chillData]);

  useEffect(() => {
    if (!map.current || !ambData) return;
    const pos = { lat: ambData.lat, lng: ambData.lng };
    if (aM.current) aM.current.setPosition(pos);
    else {
      aM.current = new window.google.maps.Marker({
        position: pos, map: map.current, title: "Ambient Unit",
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
      aM.current.addListener("click", () => {
        const iw = ensureInfoWindow();
        iw.setContent(buildInfoContent(lAmbUnit.current, lAmb.current));
        iw.open(map.current, aM.current);
      });
    }
  }, [ambData]);

  return (
    <>
      <div ref={divRef} className="w-full h-52 rounded-xl border border-slate-200 bg-slate-100" />
    </>
  );
}

// --- Temp Box ---
function TempBox({ unit, trackData, sharedTimestamp }: { unit: StorageUnit; trackData: TrackData | null; sharedTimestamp?: string }) {
  const isAmb = unit.unitType?.toLowerCase().startsWith("amb") ?? false;
  const ambStyle = { background: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%)", border: "2px solid #f59e0b", boxShadow: "0 2px 8px rgba(245,158,11,.18)" };
  const chillStyle = { background: "linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)", border: "2px solid #3b82f6", boxShadow: "0 2px 8px rgba(59,130,246,.18)" };
  // Use the shared (most recent) timestamp across both units — both are on the same vehicle
  const updatedStr = (sharedTimestamp ?? trackData?.timestamp) ? utcToLondon((sharedTimestamp ?? trackData?.timestamp)!) : null;
  return (
    <div className="flex-1 rounded-xl p-3 text-center" style={isAmb ? ambStyle : chillStyle}>
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: isAmb ? "#92400e" : "#1e3a8a" }}>
        {isAmb ? "🌡" : "❄️"} {unit.unitType || unit.unitNumber}
      </p>
      {trackData?.temperature !== undefined
        ? <p className="text-3xl font-extrabold leading-none" style={{ color: isAmb ? "#b45309" : "#1d4ed8" }}>{Number(trackData.temperature).toFixed(1)}°C</p>
        : <p className="flex items-center justify-center mt-1"><Loader2 className="w-4 h-4 animate-spin" style={{ color: isAmb ? "#b45309" : "#1d4ed8" }} /></p>}
      <p className="text-xs mt-1 opacity-70" style={{ color: isAmb ? "#a16207" : "#1e40af" }}>{unit.unitNumber}</p>
      {updatedStr && <p className="text-[10px] mt-1 opacity-60" style={{ color: isAmb ? "#a16207" : "#1e40af" }}>Updated: {updatedStr}</p>}
    </div>
  );
}


function DetailView({ booking: b, onBack, onLogout }: { booking: Booking; onBack: () => void; onLogout: () => void }) {
  const st   = statusInfo(b);
  const vias = b.viaAddresses ?? [];

  const chillTrack = useTracking(b.chillUnit?.imei);
  const ambTrack   = useTracking(b.ambientUnit?.imei);

  // Both units travel on the same vehicle — use the most recent GPS timestamp for both
  const latestTimestamp = (() => {
    const ct = chillTrack?.timestamp;
    const at = ambTrack?.timestamp;
    if (!ct && !at) return undefined;
    if (!ct) return at;
    if (!at) return ct;
    try { return new Date(ct) >= new Date(at) ? ct : at; } catch { return ct; }
  })();

  const hasUnits = !!(b.chillUnit?.imei || b.ambientUnit?.imei);
  const showMap  = !st.green && !b.hideTrackingMap  && hasUnits && !!MAPS_API_KEY;
  const showTemp = !st.green && !b.hideTrackingTemperature && hasUnits;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h1 className="text-xl font-bold">{b.jobRef || b.id.slice(-6).toUpperCase()}</h1>
            <p className="text-blue-200 text-xs">{fmt(b.collectionDate)} · {b.collectionTime || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold", st.cls)}>{st.label}</span>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: POD info */}
          <div className="lg:col-span-2 space-y-4">

            {/* Via stops */}
            {vias.map((v, i) => {
              const orders = parseOrders(v.notes);
              return (
                <div key={v.id} className={clsx("bg-white rounded-xl border p-4", v.signedBy ? "border-emerald-200" : "border-slate-200")}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={clsx("px-2 py-0.5 text-xs font-bold rounded-full border",
                      v.signedBy ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                      VIA {i + 1}
                    </span>
                    {v.postcode && <span className="font-mono text-sm text-slate-600">{v.postcode}</span>}
                    {v.signedBy && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                  </div>
                  {orders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-400 mb-1">Collected Orders</p>
                      <div className="flex flex-wrap gap-1.5">
                        {orders.map((o, oi) => (
                          o.types.length > 0 ? (
                            <span key={oi} className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", typeChipCls(o.types[0]))}>
                              {o.ref} · {o.types.join(" & ")}
                            </span>
                          ) : (
                            <span key={oi} className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", typeChipCls(""))}>{o.ref}</span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {v.signedBy && <div><p className="text-xs text-slate-400">Signed By</p><p className="font-medium text-slate-800">{v.signedBy}</p></div>}
                    {v.podRelationship && <div><p className="text-xs text-slate-400">Relationship</p><p className="font-medium text-slate-700">{v.podRelationship}</p></div>}
                    {v.podDate && <div><p className="text-xs text-slate-400">POD Date</p><p className="font-medium text-slate-700">{v.podDate}</p></div>}
                    {v.podTime && <div><p className="text-xs text-slate-400">Delivered Time</p><p className="font-medium text-slate-700">{v.podTime}</p></div>}
                    {v.deliveredTemp && <div><p className="text-xs text-slate-400">Delivered Temp</p><p className="font-medium text-slate-700">{v.deliveredTemp}</p></div>}
                    {!v.signedBy && <div className="col-span-2 sm:col-span-3 text-xs text-slate-400 italic">Awaiting POD…</div>}
                  </div>
                </div>
              );
            })}

            {/* Final delivery */}
            <div className={clsx("bg-white rounded-xl border p-4", b.podSignature ? "border-emerald-200" : "border-slate-200")}>
              <div className="flex items-center gap-2 mb-3">
                <span className={clsx("px-2 py-0.5 text-xs font-bold rounded-full border",
                  b.podSignature ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                  FINAL DEL
                </span>
                {b.deliveryPostcode && <span className="font-mono text-sm text-slate-600">{b.deliveryPostcode}</span>}
                {b.podSignature && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
              </div>
              {(() => { const orders = parseOrders(b.deliveryNotes); return orders.length > 0 ? (
                <div className="mb-3"><p className="text-xs text-slate-400 mb-1">Collected Orders</p>
                  <div className="flex flex-wrap gap-1.5">{orders.map((o, oi) => (
                    o.types.length > 0 ? (
                      <span key={oi} className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", typeChipCls(o.types[0]))}>{o.ref} · {o.types.join(" & ")}</span>
                    ) : (
                      <span key={oi} className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", typeChipCls(""))}>{o.ref}</span>
                    )
                  ))}</div></div>
              ) : null; })()}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {b.deliveryTime && <div><p className="text-xs text-slate-400">Rough ETA</p><p className="font-medium text-slate-700">{b.deliveryTime}</p></div>}
                {b.podSignature && <div><p className="text-xs text-slate-400">Signed By</p><p className="font-medium text-slate-800">{b.podSignature}</p></div>}
                {b.podRelationship && <div><p className="text-xs text-slate-400">Relationship</p><p className="font-medium text-slate-700">{b.podRelationship}</p></div>}
                {b.podSignature && b.podDate && <div><p className="text-xs text-slate-400">POD Date</p><p className="font-medium text-slate-700">{b.podDate}</p></div>}
                {b.podSignature && b.podTime && <div><p className="text-xs text-slate-400">Delivered Time</p><p className="font-medium text-slate-700">{b.podTime}</p></div>}
                {b.deliveredTemperature && <div><p className="text-xs text-slate-400">Delivered Temp</p><p className="font-medium text-slate-700">{b.deliveredTemperature}</p></div>}
                {!b.podSignature && <div className="col-span-2 sm:col-span-3 text-xs text-slate-400 italic">Awaiting POD sign-off…</div>}
              </div>
              {b.podUpload && (() => {
                const files = b.podUpload!.startsWith("[") ? (() => { try { return JSON.parse(b.podUpload!); } catch { return [b.podUpload!]; } })() : [b.podUpload!];
                return (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file: string, i: number) => {
                        const name = file.split("/").pop() || "file";
                        const isPdf = name.endsWith(".pdf");
                        return (
                          <a key={i} href={file} target="_blank" rel="noreferrer" title={name}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              isPdf ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            }`}>
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="max-w-[120px] truncate">{name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* RIGHT: Tracking */}
          <div className="space-y-4">
            {(hasUnits && !st.green && (showMap || showTemp)) && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Tracking</h3>
                </div>
                {showMap && (
                  <div>
                    <LiveMap
                      chillImei={b.chillUnit?.imei}
                      ambImei={b.ambientUnit?.imei}
                      chillData={chillTrack}
                      ambData={ambTrack}
                      showTempLegend={showTemp}
                      chillUnit={b.chillUnit}
                      ambUnit={b.ambientUnit}
                      sharedTimestamp={latestTimestamp}
                      hideTemperature={b.hideTrackingTemperature}
                    />
                  </div>
                )}
                {showTemp && (
                  <div>
                    <div className="flex gap-3">
                      {b.chillUnit?.imei && <TempBox unit={b.chillUnit} trackData={chillTrack} sharedTimestamp={latestTimestamp} />}
                      {b.ambientUnit?.imei && <TempBox unit={b.ambientUnit} trackData={ambTrack} sharedTimestamp={latestTimestamp} />}
                    </div>
                  </div>
                )}
              </div>
            )}
            {hasUnits && st.green && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-600">Job Complete</p>
                  <p className="text-xs text-slate-400 mt-1">Tracking no longer active</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("MP Transport");
  const [podManagerAccess, setPodManagerAccess] = useState(false);

  useEffect(() => {
    fetch("/api/branding")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setLogo(d.logo || null); setCompanyName(d.companyName || "MP Transport"); } })
      .catch(() => {});
    fetch("/api/portal/pod-access")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPodManagerAccess(d.podManagerAccess ?? false); })
      .catch(() => {});
  }, []);

  function selectBooking(b: Booking) {
    try { sessionStorage.setItem("portal_job", JSON.stringify({ id: b.id, date: b.collectionDate || today })); } catch {}
    setSelected(b);
  }

  function handleBack() {
    try { sessionStorage.removeItem("portal_job"); } catch {}
    setSelected(null);
    loadBookings();
  }

  function navigateDay(dir: 1 | -1) {
    const base = dateFrom || today;
    const d = new Date(base + "T00:00:00");
    d.setDate(d.getDate() + dir);
    const next = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setDateFrom(next);
    setDateTo(next);
    // Trigger load with new date
    setLoading(true);
    fetch(`/api/portal/bookings?dateFrom=${next}&dateTo=${next}`)
      .then(r => {
        if (r.status === 403) { setError("This account does not have customer portal access."); setLoading(false); return null; }
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then(d => { if (d) { setBookings(d); setLoading(false); } })
      .catch(() => { setError("Failed to load bookings"); setLoading(false); });
  }

  function loadBookings() {
    setLoading(true);
    fetch(`/api/portal/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then(r => {
        if (r.status === 403) { setError("This account does not have customer portal access."); setLoading(false); return null; }
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then(d => { if (d) { setBookings(d); setLoading(false); } })
      .catch(() => { setError("Failed to load bookings"); setLoading(false); });
  }

  useEffect(() => {
    // On refresh: if a stored job exists, fetch fresh data for that date and restore selection
    try {
      const raw = sessionStorage.getItem("portal_job");
      if (raw) {
        const { id, date } = JSON.parse(raw) as { id: string; date: string };
        const d = date || today;
        setLoading(true);
        fetch(`/api/portal/bookings?dateFrom=${d}&dateTo=${d}`)
          .then(r => {
            if (r.status === 403) { setError("This account does not have customer portal access."); setLoading(false); return null; }
            if (r.status === 401) { router.push("/login"); return null; }
            return r.json();
          })
          .then(list => {
            if (!list) return;
            setBookings(list);
            setDateFrom(d);
            setDateTo(d);
            setLoading(false);
            const fresh = list.find((b: Booking) => b.id === id);
            if (fresh) setSelected(fresh);
            else { sessionStorage.removeItem("portal_job"); loadBookings(); }
          })
          .catch(() => { setLoading(false); loadBookings(); });
        return;
      }
    } catch {}
    loadBookings();
  }, []);


  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  if (error) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm">
        <p className="text-slate-600">{error}</p>
      </div>
    </div>
  );

  if (selected) return <DetailView booking={selected} onBack={handleBack} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {logo
            ? <img src={logo} alt={companyName} className="h-10 w-auto object-contain" />
            : <span className="text-xl font-bold tracking-tight">{companyName}</span>}
          <div>
            <p className="text-sm font-bold tracking-tight leading-none">Customer Portal</p>
            <p className="text-blue-200 text-xs mt-0.5">View and track your bookings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portal/legacy"
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            History
          </Link>
          {podManagerAccess && (
            <Link href="/portal/pod-files"
              className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
              POD Files
            </Link>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Date navigation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigateDay(-1)} title="Previous day"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                onClick={e => { try { (e.target as any).showPicker?.(); } catch {} }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">to</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                onClick={e => { try { (e.target as any).showPicker?.(); } catch {} }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            </div>
            <button onClick={() => navigateDay(1)} title="Next day"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={loadBookings}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">View</button>
            <button onClick={() => { setDateFrom(today); setDateTo(today); setTimeout(loadBookings, 0); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors">Today</button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-14 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No bookings found for this date range</p>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Bookings</span>
              <span className="text-xs text-slate-400">{bookings.length} result{bookings.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Job Ref", "Date", "Time", "Collection", "Via 1", "Via 2", "Via 3", "Via 4", "Via 5", "Via 6", "Final Delivery", "ETA"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const st = statusInfo(b);
                    const via = b.viaAddresses ?? [];
                    return (
                      <tr key={b.id}
                        className={clsx("border-b border-slate-100 cursor-pointer transition-colors hover:brightness-95", st.rowCls)}
                        onClick={() => selectBooking(b)}>
                        <td className="px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">
                          {b.jobRef || b.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-700">{fmt(b.collectionDate)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-500">{b.collectionTime || "—"}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800 truncate max-w-[130px]">{b.collectionPostcode || "—"}</div>
                        </td>
                        {[0,1,2,3,4,5].map(i => (
                          <td key={i} className="px-3 py-3 font-mono text-slate-800">
                            {via[i]?.postcode ?? <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800">{b.deliveryPostcode || "—"}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-500">{b.deliveryTime || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {bookings.map(b => {
                const st = statusInfo(b);
                const via = b.viaAddresses ?? [];
                return (
                  <div key={b.id} className={clsx("p-4 cursor-pointer", st.rowCls)} onClick={() => selectBooking(b)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-700 font-semibold text-sm">{b.jobRef || b.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-slate-500">{fmt(b.collectionDate)} {b.collectionTime}</p>
                        <div className="mt-2 text-sm">
                          <div className="text-slate-700 font-medium">{b.collectionName || b.collectionPostcode || "—"}</div>
                          {via.length > 0 && <div className="text-slate-400 text-xs">{via.length} stop{via.length !== 1 ? "s" : ""}</div>}
                          <div className="text-slate-700 font-medium mt-0.5">{b.deliveryName || b.deliveryPostcode || "—"}</div>
                        </div>
                      </div>
                      <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


