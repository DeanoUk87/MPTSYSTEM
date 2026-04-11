"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { MapPin, X, Trash2 } from "lucide-react";

export default function MapRoutingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function initMap() {
    if (!mapRef.current || googleMapRef.current) return;
    googleMapRef.current = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 54.5, lng: -3.5 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
    });
    setMapReady(true);
  }

  async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: postcode + ", UK" }, (results: any, status: string) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    });
  }

  async function addPostcodes() {
    // Split only on newlines and commas — NOT spaces, so "SW1A 1AA" stays intact
    const lines = input.split(/[\n,]+/).map(p => p.trim().toUpperCase()).filter(p => p.length >= 3);
    if (!lines.length) return;
    setLoading(true);
    setStatusMsg(null);
    const added: string[] = [];
    for (const pc of lines) {
      if (postcodes.includes(pc)) continue;
      const coords = await geocodePostcode(pc);
      if (coords && googleMapRef.current) {
        const marker = new (window as any).google.maps.Marker({
          position: coords,
          map: googleMapRef.current,
          title: pc,
          label: { text: pc, fontSize: "11px", fontWeight: "bold" },
        });
        markersRef.current.push(marker);
        added.push(pc);
      }
    }
    if (added.length) {
      setPostcodes(p => [...p, ...added]);
      // Fit map to all markers
      const bounds = new (window as any).google.maps.LatLngBounds();
      markersRef.current.forEach(m => bounds.extend(m.getPosition()));
      googleMapRef.current.fitBounds(bounds);
      setStatusMsg(`Added ${added.length} postcode${added.length !== 1 ? "s" : ""}`);
    } else if (lines.length > 0) {
      setStatusMsg("No postcodes could be plotted — check the format (e.g. SW1A 1AA)");
    }
    setInput("");
    setLoading(false);
  }

  function clearMap() {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    setPostcodes([]);
  }

  function removeOne(pc: string) {
    const idx = postcodes.indexOf(pc);
    if (idx !== -1) {
      markersRef.current[idx]?.setMap(null);
      markersRef.current.splice(idx, 1);
      setPostcodes(p => p.filter(x => x !== pc));
    }
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Map Routing</h1>
            <p className="text-sm text-slate-500">Add postcodes to plot on the map</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste postcodes (one per line, comma, or space separated)"
                rows={2}
                className="w-80 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addPostcodes(); } }}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={addPostcodes}
                  disabled={loading || !input.trim() || !mapReady}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {loading ? "Adding..." : "Add Postcodes"}
                </button>
                {statusMsg && (
                  <p className={`text-xs px-1 ${statusMsg.startsWith("No") ? "text-rose-600" : "text-emerald-600"}`}>{statusMsg}</p>
                )}
              </div>
            </div>
            {postcodes.length > 0 && (
              <button
                onClick={clearMap}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors self-end"
              >
                <Trash2 className="w-4 h-4" /> Clear Map
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div ref={mapRef} className="flex-1" />

          {/* Postcode list panel */}
          {postcodes.length > 0 && (
            <div className="w-52 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{postcodes.length} Postcode{postcodes.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {postcodes.map(pc => (
                  <div key={pc} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-sm font-mono font-semibold text-slate-700">{pc}</span>
                    <button onClick={() => removeOne(pc)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
