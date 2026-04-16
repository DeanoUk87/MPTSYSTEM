"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Plus, ExternalLink, RefreshCw, Thermometer, MapPin, CheckCircle, Clock, Save } from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";
import Link from "next/link";

const inp = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors";
const inp2 = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono transition-colors";
const inpReq = "w-full px-3 py-2 border-2 border-rose-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50 transition-colors";
const panel = "bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden";
const costInp = "w-24 px-2 py-2 border border-slate-200 rounded-xl text-sm text-right text-red-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function SHead({ color: _color, icon, label }: { color: string; icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-slate-100 text-xs font-semibold uppercase tracking-wider bg-slate-700 border-b border-slate-600">
      <span className="text-sm">{icon}</span> {label}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
        checked ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
      }`}>
      {checked ? "✓ " : ""}{label}
    </button>
  );
}

// Cross-browser time picker — replaces <input type="time"> (Firefox renders it as plain text)
function TimePicker({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const parts = (value || "00:00").split(":");
  const hh = parseInt(parts[0]) || 0;
  const mm = parseInt(parts[1]) || 0;
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) { setOpen(false); setMode("hour"); }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const dropH = 320;
      const below = r.bottom + 4 + dropH < window.innerHeight;
      const topBelow = Math.min(r.bottom + 4, window.innerHeight - dropH - 8);
      const topAbove = Math.max(8, r.top - dropH - 4);
      setPos(below ? { top: topBelow, left: r.left } : { top: topAbove, left: r.left });
    }
    setOpen(p => !p);
    setMode("hour");
  };
  const set = (h: number, m: number) => onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  const R = 90;
  const CX = 110; const CY = 110;
  const selected = mode === "hour" ? hh : mm;
  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={toggle}
        className={(className ?? "") + " flex items-center gap-2 text-left"}>
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{value || "00:00"}</span>
      </button>
      {open && (
        <div ref={dropRef} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, width: 240 }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl p-3">
          {/* Digital display */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <button type="button" onClick={() => setMode("hour")}
              className={`text-2xl font-mono font-bold px-2 py-0.5 rounded-lg transition-colors ${
                mode === "hour" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-100"}`}>
              {String(hh).padStart(2, "0")}
            </button>
            <span className="text-2xl font-bold text-slate-300">:</span>
            <button type="button" onClick={() => setMode("minute")}
              className={`text-2xl font-mono font-bold px-2 py-0.5 rounded-lg transition-colors ${
                mode === "minute" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-100"}`}>
              {String(mm).padStart(2, "0")}
            </button>
          </div>
          {/* Clock face */}
          <div className="relative" style={{ width: 220, height: 220, margin: "0 auto" }}>
            <svg width={220} height={220}>
              <circle cx={CX} cy={CY} r={R + 8} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
              {(() => {
                if (mode === "hour") {
                  const angle = ((selected % 12) / 12) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const handR = selected < 12 ? R - 14 : R - 34;
                  return <>
                    <line x1={CX} y1={CY} x2={CX + Math.cos(rad) * handR} y2={CY + Math.sin(rad) * handR}
                      stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
                    <circle cx={CX} cy={CY} r={3} fill="#2563eb" />
                  </>;
                } else {
                  const angle = (selected / 60) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  return <>
                    <line x1={CX} y1={CY} x2={CX + Math.cos(rad) * (R - 14)} y2={CY + Math.sin(rad) * (R - 14)}
                      stroke="#2563eb" strokeWidth={2} strokeLinecap="round" />
                    <circle cx={CX} cy={CY} r={3} fill="#2563eb" />
                  </>;
                }
              })()}
            </svg>
            {mode === "hour" ? (
              <>
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = (i / 12) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = CX + Math.cos(rad) * (R - 14);
                  const y2 = CY + Math.sin(rad) * (R - 14);
                  return <button key={i} type="button" onClick={() => { set(i, mm); setMode("minute"); }}
                    className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      hh === i ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-slate-700"}`}
                    style={{ left: x, top: y2 }}>{i === 0 ? "00" : i}</button>;
                })}
                {Array.from({ length: 12 }, (_, i) => {
                  const h = i + 12;
                  const angle = (i / 12) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = CX + Math.cos(rad) * (R - 34);
                  const y2 = CY + Math.sin(rad) * (R - 34);
                  return <button key={h} type="button" onClick={() => { set(h, mm); setMode("minute"); }}
                    className={`absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center rounded-full text-[10px] font-medium transition-colors ${
                      hh === h ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-slate-400"}`}
                    style={{ left: x, top: y2 }}>{h}</button>;
                })}
              </>
            ) : (
              Array.from({ length: 60 }, (_, i) => {
                const angle = (i / 60) * 360 - 90;
                const rad = (angle * Math.PI) / 180;
                const x = CX + Math.cos(rad) * (R - 14);
                const y2 = CY + Math.sin(rad) * (R - 14);
                const show = i % 5 === 0;
                return <button key={i} type="button" onClick={() => { set(hh, i); setOpen(false); setMode("hour"); }}
                  className={`absolute flex items-center justify-center rounded-full transition-colors ${
                    show ? "w-7 h-7 -ml-3.5 -mt-3.5 text-xs font-medium" : "w-3 h-3 -ml-1.5 -mt-1.5"} ${
                    mm === i ? "bg-blue-600 text-white" : show ? "hover:bg-blue-50 text-slate-700" : "hover:bg-blue-100 bg-transparent"}`}
                  style={{ left: x, top: y2 }}>{show ? String(i).padStart(2, "0") : ""}</button>;
              })
            )}
          </div>
          {/* Direct input */}
          <div className="mt-2">
            <input type="text" placeholder="HH:MM" defaultValue={value || "00:00"}
              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value;
                  const mt = v.match(/^(\d{1,2}):(\d{2})$/);
                  if (mt) { set(Math.min(23, parseInt(mt[1])), Math.min(59, parseInt(mt[2]))); setOpen(false); setMode("hour"); }
                }
              }} />
          </div>
        </div>
      )}
    </div>
  );
}

function PostcodeSearch({ postcode, country, onChangePostcode, onChangeCountry, onApply, placeholder }: {
  postcode: string; country: string;
  onChangePostcode: (v: string) => void; onChangeCountry: (v: string) => void;
  onApply: (r: any) => void; placeholder?: string;
}) {
  const [searchVal, setSearchVal] = useState(""); // always starts blank — search only
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults([]); setSearched(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function search(v: string) {
    setSearchVal(v.toUpperCase());
    const pc = v.replace(/\s/g, "");
    if (pc.length < 5) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/postcode?postcode=${encodeURIComponent(pc)}`);
      const d = await res.json();
      setResults(d.results ?? []);
      setSearched(true);
    } catch { setResults([]); } finally { setLoading(false); }
  }

  function selectAddress(r: any) { onApply(r); onChangePostcode(r.postcode); setSearchVal(""); setResults([]); setSearched(false); }

  return (
    <div className="space-y-1.5">
      <div className="relative" ref={containerRef}>
        <input type="text" value={searchVal} onChange={e => search(e.target.value)}
          placeholder={placeholder || "Enter postcode to find address..."}
          className={inp + " pr-8 uppercase font-mono"} />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
        {results.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-52 overflow-y-auto">
            {results.map((r: any, i: number) => (
              <button key={i} type="button" onClick={() => selectAddress(r)}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
                {r.fallback ? (
                  <><span className="font-semibold text-slate-500 italic">Town only — enter address manually</span>
                    <span className="ml-2 text-blue-600 font-mono font-semibold">{r.postcode}</span>
                    <span className="text-slate-500"> · {r.label}</span></>
                ) : (
                  <><span className="font-semibold text-slate-800">{r.line1}</span>
                    {r.line2 && <span className="text-slate-500">, {r.line2}</span>}
                    <span className="text-slate-400">, {r.city} </span>
                    <span className="text-blue-600 font-mono font-semibold">{r.postcode}</span></>
                )}
              </button>
            ))}
          </div>
        )}
        {searched && results.length === 0 && !loading && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 px-3 py-2 text-xs text-slate-400">
            No addresses found for this postcode
          </div>
        )}
      </div>
      <input type="hidden" value={country} onChange={e => onChangeCountry(e.target.value)} />
    </div>
  );
}

function NameSearch({ value, onChange, onApply }: {
  value: string;
  onChange: (v: string) => void;
  onApply: (a: any) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const justSelected = useRef(false);
  const initialised = useRef(false);
  const nsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (nsContainerRef.current && !nsContainerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!initialised.current) { initialised.current = true; return; } // skip initial mount
    if (justSelected.current) { justSelected.current = false; return; }
    if (value.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/addresses?search=${encodeURIComponent(value)}`);
        if (res.ok) { setResults(await res.json()); setOpen(true); }
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  function select(a: any) { justSelected.current = true; onChange(a.name); onApply(a); setResults([]); setOpen(false); }

  return (
    <div className="relative" ref={nsContainerRef}>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="Business / Place Name" className={inp} />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-52 overflow-y-auto">
          {results.map((a: any, i: number) => (
            <button key={i} type="button" onMouseDown={() => select(a)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
              <span className="font-semibold text-slate-800">{a.name}</span>
              {a.address1 && <span className="text-slate-500">, {a.address1}</span>}
              {a.postcode && <span className="text-blue-600 font-mono ml-1">{a.postcode}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const [saving, setSaving] = useState(false);
  const [calcMiles, setCalcMiles] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ miles: number; duration: string } | null>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [subcons, setSubcons] = useState<any[]>([]);
  const [cxDrivers, setCxDrivers] = useState<any[]>([]);
  const [subconContacts, setSubconContacts] = useState<any[]>([]);
  const [cxContacts, setCxContacts] = useState<any[]>([]);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [allStorageUnits, setAllStorageUnits] = useState<any[]>([]);
  const [fuelSurcharges, setFuelSurcharges] = useState<any[]>([]);
  const [vehicleRates, setVehicleRates] = useState<any[]>([]);
  const [vehicleRatesMap, setVehicleRatesMap] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<any>(null);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [assigningUnit, setAssigningUnit] = useState<string | null>(null);

  const [f, setF] = useState<Record<string, any>>({});
  const [jt, setJt] = useState(0);

  const rateKey = jt === 0 ? "ratePerMile" : jt === 1 ? "ratePerMileWeekends" : "ratePerMileOutOfHours";
  const driverRateKey = jt === 0 ? "costPerMile" : jt === 1 ? "costPerMileWeekends" : "costPerMileOutOfHours";
  const jtLabel = ["Normal", "Weekend / BH", "Out of Hours"][jt] || "Normal";

  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const today = new Date().toISOString().slice(0, 10);

  // If Google Maps was already loaded (e.g. navigated back), init immediately
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google?.maps) initMap();
  }, []);

  // VIA state loaded from booking
  const [vias, setVias] = useState<any[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<{ref: string, type: string}[]>([]);

  // Load booking + reference data
  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/${id}`).then(r => r.json()),
      fetch("/api/vehicles").then(r => r.json()),
      fetch("/api/drivers?type=Driver").then(r => r.json()),
      fetch("/api/drivers?type=SubContractor").then(r => r.json()),
      fetch("/api/drivers?type=CXDriver").then(r => r.json()),
      fetch("/api/booking-types").then(r => r.json()),
      fetch("/api/storage").then(r => r.json()),
      fetch("/api/fuel-surcharges").then(r => r.json()),
    ]).then(([booking, v, d, sc, cx, bt, su, fs]) => {
      setJt(booking.weekend ?? 0);
      setCustomer(booking.customer ?? {});
      const drKey = (booking.weekend ?? 0) === 0 ? "costPerMile" : (booking.weekend ?? 0) === 1 ? "costPerMileWeekends" : "costPerMileOutOfHours";
      setVehicles(v);
      setDrivers(d.filter((dr: any) => dr[drKey] > 0));
      setSubcons(sc.filter((dr: any) => dr[drKey] > 0));
      setCxDrivers(cx.filter((dr: any) => dr[drKey] > 0));
      setBookingTypes(bt);
      setAllStorageUnits(su);
      setFuelSurcharges(fs);
      // Decode via's collected orders from notes
      setVias((booking.viaAddresses?.filter((v: any) => !v.deletedAt) ?? []).map((v: any) => {
        if (v.notes?.includes("---ORDERS---")) {
          const [text, ordJson] = v.notes.split("---ORDERS---");
          return { ...v, notes: text, collectedOrders: JSON.parse(ordJson || "[]") || [] };
        }
        return { ...v, collectedOrders: v.collectedOrders ?? [] };
      }));
      // Decode delivery orders from deliveryNotes
      const rawDeliveryNotes: string = booking.deliveryNotes || "";
      let parsedDeliveryNotes = rawDeliveryNotes;
      if (rawDeliveryNotes.includes("---ORDERS---")) {
        const [text, ordJson] = rawDeliveryNotes.split("---ORDERS---");
        parsedDeliveryNotes = text;
        setDeliveryOrders(JSON.parse(ordJson || "[]") || []);
      }
      // Flatten booking into form state
      setF({
        vehicleId: booking.vehicleId || "",
        miles: booking.miles != null ? String(Math.round(booking.miles)) : "",
        customerPrice: booking.customerPrice != null ? String(booking.customerPrice) : "",
        manualAmount: booking.manualAmount != null ? String(booking.manualAmount) : "",
        manualDesc: booking.manualDesc || "",
        fuelSurchargePercent: booking.fuelSurchargePercent != null ? String(booking.fuelSurchargePercent) : "",
        extraCost2: booking.extraCost2 != null ? String(booking.extraCost2) : "",
        extraCost2Label: booking.extraCost2Label || "",
        avoidTolls: booking.avoidTolls ?? false,
        waitAndReturn: booking.waitAndReturn ?? false,
        deadMilesEnabled: !!(booking.deadMileageStatus),
        deadMiles: booking.deadMileageStatus || "",
        purchaseOrder: booking.purchaseOrder || "",
        bookedBy: booking.bookedBy || "",
        numberOfItems: booking.numberOfItems != null ? String(booking.numberOfItems) : "",
        weight: booking.weight != null ? String(booking.weight) : "",
        bookingTypeId: booking.bookingTypeId || "",
        jobNotes: booking.jobNotes || "",
        officeNotes: booking.officeNotes || "",
        driverId: booking.driverId || "",
        driverCost: booking.driverCost != null ? String(booking.driverCost) : "",
        secondManId: booking.secondManId || "",
        secondManContactId: "",
        extraCost: booking.extraCost != null ? String(booking.extraCost) : "",
        cxDriverId: booking.cxDriverId || "",
        cxDriverContactId: "",
        cxDriverCost: booking.cxDriverCost != null ? String(booking.cxDriverCost) : "",
        chillUnitId: booking.chillUnitId || "",
        ambientUnitId: booking.ambientUnitId || "",
        collectionDate: booking.collectionDate || "",
        collectionTime: booking.collectionTime || "00:00",
        collectionName: booking.collectionName || "",
        collectionAddress1: booking.collectionAddress1 || "",
        collectionAddress2: booking.collectionAddress2 || "",
        collectionArea: booking.collectionArea || "",
        collectionCountry: booking.collectionCountry || "UK",
        collectionPostcode: booking.collectionPostcode || "",
        collectionContact: booking.collectionContact || "",
        collectionPhone: booking.collectionPhone || "",
        collectionNotes: booking.collectionNotes || "",
        deliveryDate: booking.deliveryDate || "",
        deliveryTime: booking.deliveryTime || "00:00",
        deliveryName: booking.deliveryName || "",
        deliveryAddress1: booking.deliveryAddress1 || "",
        deliveryAddress2: booking.deliveryAddress2 || "",
        deliveryArea: booking.deliveryArea || "",
        deliveryCountry: booking.deliveryCountry || "UK",
        deliveryPostcode: booking.deliveryPostcode || "",
        deliveryContact: booking.deliveryContact || "",
        deliveryPhone: booking.deliveryPhone || "",
        deliveryNotes: parsedDeliveryNotes,
        // POD
        podSignature: booking.podSignature || "",
        podDate: booking.podDate || today,
        podTime: booking.podTime || "",
        podRelationship: booking.podRelationship || "",
        deliveredTemperature: booking.deliveredTemperature || "",
        podDataVerify: booking.podDataVerify ?? false,
        driverNote: booking.driverNote || "",
        hideTrackingTemperature: booking.hideTrackingTemperature ?? false,
        hideTrackingMap: booking.hideTrackingMap ?? false,
        jobStatus: booking.jobStatus ?? 0,
        jobRef: booking.jobRef || "",
      });
      setLoadingBooking(false);
    });
  }, [id]);

  // Auto-draw route on map once booking data and map are both ready
  useEffect(() => {
    if (!f.collectionPostcode || !f.deliveryPostcode) return;
    const tryDraw = () => {
      const g = (window as any).google;
      if (!g?.maps || !googleMapRef.current) { setTimeout(tryDraw, 300); return; }
      const viaPostcodes = vias.filter((v: any) => v.postcode).map((v: any) => v.postcode);
      new g.maps.DirectionsService().route({
        origin: f.collectionPostcode,
        destination: f.deliveryPostcode,
        waypoints: viaPostcodes.map((p: string) => ({ location: p, stopover: true })),
        travelMode: g.maps.TravelMode.DRIVING,
      }, (result: any, status: string) => {
        if (status === "OK") directionsRendererRef.current?.setDirections(result);
      });
    };
    tryDraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.collectionPostcode, f.deliveryPostcode]);

  // Load vehicle rates when vehicle changes
  useEffect(() => {
    if (!f.vehicleId || !customer?.id) { setVehicleRates([]); return; }
    fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`)
      .then(r => r.json()).then(rates => {
        setVehicleRates(rates);
        if (rates.length > 0) setVehicleRatesMap(prev => ({ ...prev, [f.vehicleId]: rates[0][rateKey] ?? 0 }));
      });
  }, [f.vehicleId, customer?.id]);

  // Load all vehicle rates for dropdown
  useEffect(() => {
    if (!vehicles.length || !customer?.id) return;
    Promise.all(vehicles.map(v =>
      fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${v.id}`)
        .then(r => r.json()).then(rates => ({ vehicleId: v.id, rate: rates.length > 0 ? rates[0][rateKey] : null }))
    )).then(results => {
      const map: Record<string, number> = {};
      results.forEach(({ vehicleId, rate }) => { if (rate !== null) map[vehicleId] = rate; });
      setVehicleRatesMap(map);
    });
  }, [vehicles.length, customer?.id]);

  // Load subcon contacts
  useEffect(() => {
    if (!f.secondManId) { setSubconContacts([]); return; }
    fetch(`/api/drivers/${f.secondManId}`).then(r => r.json()).then(d => setSubconContacts(d.contacts ?? []));
  }, [f.secondManId]);

  // Load CX contacts
  useEffect(() => {
    if (!f.cxDriverId) { setCxContacts([]); return; }
    fetch(`/api/drivers/${f.cxDriverId}`).then(r => r.json()).then(d => setCxContacts(d.contacts ?? []));
  }, [f.cxDriverId]);

  function recalcPrices(baseMiles: number, formState: Record<string, any>, newRates?: any[]) {
    const rates = newRates ?? vehicleRates;
    const deadMi = formState.deadMilesEnabled && formState.deadMiles ? parseFloat(formState.deadMiles) || 0 : 0;
    const totalMiles = baseMiles + deadMi;
    // Wait & Return = outward + return (return = base journey only, no dead miles)
    const billMiles = formState.waitAndReturn ? Math.round(totalMiles * 1.5) : totalMiles;
    let customerPrice = 0;
    if (rates.length > 0) customerPrice = billMiles * rates[0][rateKey];
    const pencePerMile = formState.fuelSurchargePercent ? parseFloat(formState.fuelSurchargePercent) || 0 : 0;
    if (pencePerMile > 0) customerPrice = customerPrice + (billMiles * pencePerMile / 100);
    const updates: Record<string, any> = {
      miles: String(Math.round(billMiles)),
      customerPrice: customerPrice > 0 ? customerPrice.toFixed(2) : formState.customerPrice,
    };
    if (formState.driverId) {
      const dr = drivers.find((d: any) => d.id === formState.driverId);
      if (dr) updates.driverCost = (billMiles * dr[driverRateKey]).toFixed(2);
    }
    if (formState.secondManId) {
      const dr = subcons.find((d: any) => d.id === formState.secondManId);
      if (dr) updates.extraCost = (billMiles * dr[driverRateKey]).toFixed(2);
    }
    if (formState.cxDriverId) {
      const dr = cxDrivers.find((d: any) => d.id === formState.cxDriverId);
      if (dr) updates.cxDriverCost = (billMiles * dr[driverRateKey]).toFixed(2);
    }
    return { updates, billMiles };
  }

  function initMap() {
    if (googleMapRef.current) return;
    let attempts = 0;
    const tryInit = () => {
      if (!mapRef.current) { if (++attempts < 20) setTimeout(tryInit, 200); return; }
      const gm = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 52.8, lng: -1.5 }, zoom: 7,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      googleMapRef.current = gm;
      directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
        polylineOptions: { strokeColor: "#2563eb", strokeWeight: 5 },
      });
      directionsRendererRef.current.setMap(gm);
    };
    tryInit();
  }

  async function handleGetMiles() {
    if (!f.collectionPostcode || !f.deliveryPostcode) { toast.error("Enter collection and delivery postcodes first"); return; }
    setCalcMiles(true);
    const viaPostcodes = vias.filter((v: any) => v.postcode).map((v: any) => v.postcode);
    try {
      const res = await fetch("/api/bookings/miles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: f.collectionPostcode, destination: f.deliveryPostcode, avoidTolls: f.avoidTolls, waypoints: viaPostcodes }),
      });
      const data = await res.json();
      if (data.miles !== undefined) {
        const rawMiles = Math.round(data.miles);
        setRouteInfo({ miles: rawMiles, duration: data.duration });
        const { updates } = recalcPrices(rawMiles, f);
        setF(p => ({ ...p, ...updates }));
      }
      const g = (window as any).google;
      if (g && googleMapRef.current) {
        new g.maps.DirectionsService().route({
          origin: f.collectionPostcode, destination: f.deliveryPostcode,
          waypoints: viaPostcodes.map((p: string) => ({ location: p, stopover: true })),
          travelMode: g.maps.TravelMode.DRIVING, avoidTolls: f.avoidTolls,
        }, (result: any, status: string) => {
          if (status === "OK") directionsRendererRef.current?.setDirections(result);
        });
      }
    } catch { toast.error("Failed to calculate"); } finally { setCalcMiles(false); }
  }

  async function assignUnit(unitId: string, driverId: string) {
    setAssigningUnit(unitId);
    try {
      const unit = allStorageUnits.find(u => u.id === unitId);
      if (!unit) return;
      await fetch(`/api/storage/${unitId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...unit, currentDriverId: driverId || null, trackable: driverId ? 1 : 0, availability: driverId ? "No" : "Yes" }),
      });
      const updated = await fetch("/api/storage").then(r => r.json());
      setAllStorageUnits(updated);

      const driverUnits: any[] = updated.filter((u: any) => u.currentDriverId === activeDriverId);
      const newChillId = driverUnits.find((u: any) => u.unitType?.toLowerCase().startsWith("chill"))?.id ?? "";
      const newAmbId   = driverUnits.find((u: any) => u.unitType?.toLowerCase().startsWith("amb"))?.id ?? "";
      setF((prev: any) => ({
        ...prev,
        chillUnitId:   newChillId,
        ambientUnitId: newAmbId,
      }));

      toast.success(driverId ? "Unit assigned" : "Unit unassigned");
    } catch { toast.error("Failed to assign unit"); } finally { setAssigningUnit(null); }
  }

  async function autoSaveTracking(field: "hideTrackingTemperature" | "hideTrackingMap", newVal: boolean) {
    s(field, newVal);
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: newVal,
          driverId: f.driverId || null,
          chillUnitId: f.chillUnitId || null,
          ambientUnitId: f.ambientUnitId || null,
        }),
      });
      toast.success(newVal ? "Hidden on customer view" : "Visible on customer view");
    } catch { toast.error("Failed to update"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.purchaseOrder) { toast.error("Purchase Order is required"); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...f,
        customerId: customer?.id,
        weekend: jt,
        miles: f.miles ? Math.round(parseFloat(f.miles)) : null,
        customerPrice: f.customerPrice ? parseFloat(f.customerPrice) : null,
        driverCost: f.driverCost ? parseFloat(f.driverCost) : null,
        extraCost: f.extraCost ? parseFloat(f.extraCost) : null,
        cxDriverCost: f.cxDriverCost ? parseFloat(f.cxDriverCost) : null,
        extraCost2: f.extraCost2 ? parseFloat(f.extraCost2) : null,
        manualAmount: f.manualAmount ? parseFloat(f.manualAmount) : null,
        fuelSurchargePercent: f.fuelSurchargePercent ? parseFloat(f.fuelSurchargePercent) : null,
        numberOfItems: f.numberOfItems ? parseInt(f.numberOfItems) : null,
        weight: f.weight ? parseFloat(f.weight) : null,
        vehicleId: f.vehicleId || null, driverId: f.driverId || null,
        secondManId: f.secondManId || null, cxDriverId: f.cxDriverId || null,
        bookingTypeId: f.bookingTypeId || null,
        chillUnitId: f.chillUnitId || null, ambientUnitId: f.ambientUnitId || null,
      };
      delete payload.secondManContactId;
      delete payload.cxDriverContactId;
      payload.deadMileageStatus = f.deadMilesEnabled && f.deadMiles ? String(parseFloat(f.deadMiles) || 0) : null;
      delete payload.deadMilesEnabled;
      delete payload.deadMiles;
      // Encode collected orders into via notes
      const encodedVias = vias.filter((v: any) => v.name || v.postcode).map((v: any) => {
        const { collectedOrders, ...vRest } = v;
        const orders = collectedOrders ?? [];
        const baseNotes = vRest.notes || "";
        return { ...vRest, notes: orders.length > 0 ? `${baseNotes}---ORDERS---${JSON.stringify(orders)}` : baseNotes };
      });
      // Encode delivery orders into deliveryNotes
      const baseDeliveryNotes = payload.deliveryNotes || "";
      if (deliveryOrders.length > 0) payload.deliveryNotes = `${baseDeliveryNotes}---ORDERS---${JSON.stringify(deliveryOrders)}`;
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, viaAddresses: encodedVias }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success("Booking updated");
      router.push(`/admin/bookings/${id}`);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  const activeDriverId = f.driverId || f.secondManId || f.cxDriverId;
  const currentRate = vehicleRates.length > 0 ? vehicleRates[0][rateKey] : null;
  const milesNum = Math.round(parseFloat(f.miles) || 0);
  const profit = ((parseFloat(f.customerPrice) || 0) + (parseFloat(f.extraCost2) || 0))
    - ((parseFloat(f.driverCost) || 0) + (parseFloat(f.extraCost) || 0) + (parseFloat(f.cxDriverCost) || 0));

  if (loadingBooking) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-100">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4&libraries=places`}
        strategy="afterInteractive" onLoad={initMap} />
      <div className="flex-1 bg-slate-100 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a3a5c] to-[#1e4976] px-5 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">Edit Job — {f.jobRef || id.slice(-6).toUpperCase()}</h1>
              <p className="text-blue-300 text-xs mt-0.5">{customer?.name}</p>
            </div>
            <select value={jt} onChange={e => setJt(Number(e.target.value))}
              className="bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none hover:bg-white/20 transition-colors">
              <option value={0} className="text-slate-800">Normal</option>
              <option value={1} className="text-slate-800">Weekend / BH</option>
              <option value={2} className="text-slate-800">Out of Hours</option>
            </select>
          </div>
          <button type="button" onClick={(e) => handleSubmit(e as any)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold text-sm disabled:opacity-70 shadow-md transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓"}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
          {/* Row 1: Customer info + PO — combined into one panel, matching create layout */}
          <div className={panel}>
            <SHead color="bg-blue-700" icon="👤" label="Customer &amp; Order Info" />
            <div className="p-4 grid grid-cols-2 gap-6">
              {/* Left: customer info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-xs font-semibold text-slate-700 truncate flex-1">{customer?.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">{jtLabel}</span>
                  {customer?.accountNumber && <span className="text-xs text-slate-400 self-center">{customer.accountNumber}</span>}
                </div>
              </div>
              {/* Right: PO + Booked By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Order <span className="text-rose-500">*</span></label>
                  <input type="text" value={f.purchaseOrder || ""} onChange={e => s("purchaseOrder", e.target.value)}
                    className={f.purchaseOrder ? inp : inpReq} placeholder="PO Number" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Booked By</label>
                  <input type="text" value={f.bookedBy || ""} onChange={e => s("bookedBy", e.target.value)} className={inp} placeholder="Name" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 3-column */}
          <div className="grid grid-cols-3 gap-4 items-start">
            {/* COLUMN 1: Collection */}
            <div className="space-y-4">
              <div className={panel}>
                <SHead color="bg-blue-700" icon="📅" label="Collection Date / Time" />
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Date</label>
                    <input type="date" value={f.collectionDate || ""} onChange={e => s("collectionDate", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Time</label>
                    <TimePicker value={f.collectionTime || ""} onChange={v => s("collectionTime", v)} className={inp} />
                  </div>
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-orange-500" icon="📍" label="Collection Details" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch postcode={f.collectionPostcode || ""} country={f.collectionCountry || "UK"}
                    onChangePostcode={v => s("collectionPostcode", v)} onChangeCountry={v => s("collectionCountry", v)}
                    onApply={r => { const isBiz = r.line1 && !/^\d/.test(r.line1) && r.line2; s("collectionName", isBiz ? r.line1 : ""); s("collectionAddress1", isBiz ? (r.line2 || "") : (r.line1 || "")); s("collectionAddress2", ""); s("collectionArea", r.city); s("collectionPostcode", r.postcode); }} />
                  <NameSearch value={f.collectionName || ""} onChange={v => s("collectionName", v)}
                    onApply={a => {
                      s("collectionAddress1", a.address1 || "");
                      s("collectionAddress2", a.address2 || "");
                      s("collectionArea", a.area || "");
                      if (a.postcode) s("collectionPostcode", a.postcode);
                      if (a.contact) s("collectionContact", a.contact);
                      if (a.phone) s("collectionPhone", a.phone);
                    }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionAddress1 || ""} onChange={e => s("collectionAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <input type="text" value={f.collectionAddress2 || ""} onChange={e => s("collectionAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionArea || ""} onChange={e => s("collectionArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    <input type="text" value={f.collectionPostcode || ""} onChange={e => s("collectionPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionContact || ""} onChange={e => s("collectionContact", e.target.value)} placeholder="Contact Name" className={inp} />
                    <input type="text" value={f.collectionPhone || ""} onChange={e => s("collectionPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                  </div>
                  <textarea value={f.collectionNotes || ""} onChange={e => s("collectionNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-teal-600" icon="📎" label="Office Notes" />
                <div className="p-4">
                  <textarea value={f.officeNotes || ""} onChange={e => s("officeNotes", e.target.value)} placeholder="Office Notes" rows={3} className={inp + " resize-none"} />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Mileage + Profit */}
            <div className="space-y-4">
              <div className={panel}>
                <SHead color="bg-purple-600" icon="🗺️" label="Mileage Calculator" />
                <div ref={el => { (mapRef as any).current = el; }} style={{ height: "220px" }} className="w-full border-b border-slate-100" />
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Vehicle</label>
                    <select value={f.vehicleId || ""} onChange={e => s("vehicleId", e.target.value)} className={inp}>
                      <option value="">— Select Vehicle —</option>
                      {vehicles.map((v: any) => {
                        const rate = vehicleRatesMap[v.id];
                        return <option key={v.id} value={v.id}>{v.name}{rate !== undefined ? ` — £${rate.toFixed(2)}/mi` : " — no rate"}</option>;
                      })}
                    </select>
                    {f.vehicleId && currentRate && (
                      <div className="mt-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-medium">{jtLabel} rate: £{currentRate.toFixed(4)}/mi</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      if (f.vehicleId && customer?.id) {
                        fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`).then(r => r.json()).then(rates => {
                          setVehicleRates(rates);
                          if (rates.length > 0) setVehicleRatesMap(prev => ({ ...prev, [f.vehicleId]: rates[0][rateKey] ?? 0 }));
                        });
                      }
                    }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs hover:bg-blue-600 font-medium transition-colors shadow-sm">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <a href={`/admin/customers/${customer?.id}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs hover:bg-emerald-600 font-medium transition-colors shadow-sm">
                      <Plus className="w-3 h-3" /> Add Rates
                    </a>
                  </div>
                  <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm disabled:opacity-60 transition-colors shadow-md">
                    {calcMiles ? <Loader2 className="w-4 h-4 animate-spin" /> : "🚩"} Get Mileage and Costs
                  </button>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-10 shrink-0">Miles</label>
                    <input type="number" min="0" value={f.miles || ""}
                      onChange={e => s("miles", String(Math.round(parseFloat(e.target.value) || 0)))}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    {routeInfo && <span className="text-xs text-amber-600 font-semibold">⏱ {routeInfo.duration}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-16 shrink-0">Quote (£)</label>
                    <input type="number" step="0.01" min="0" value={f.customerPrice || ""} onChange={e => s("customerPrice", e.target.value)} className={inp + " font-bold"} placeholder="0.00" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-16 shrink-0">Fuel Surcharge</label>
                    <select value={f.fuelSurchargePercent || ""} onChange={e => {
                      const pct = e.target.value;
                      const miles = Math.round(parseFloat(f.miles) || 0);
                      if (miles && vehicleRates.length > 0) {
                        let cp = miles * vehicleRates[0][rateKey];
                        const pencePerMile = pct ? parseFloat(pct) || 0 : 0;
                        if (pencePerMile > 0) cp = cp + (miles * pencePerMile / 100);
                        setF(p => ({ ...p, fuelSurchargePercent: pct, customerPrice: cp.toFixed(2) }));
                      } else { s("fuelSurchargePercent", pct); }
                    }} className={inp}>
                      <option value="">None{fuelSurcharges.length > 0 ? ` (Up to £${[...fuelSurcharges].sort((a: any, b: any) => a.price - b.price)[0].price.toFixed(2)}/litre)` : ""}</option>
                      {(() => {
                        const sorted = [...fuelSurcharges].sort((a: any, b: any) => a.price - b.price);
                        return sorted.map((fs: any, idx: number) => {
                          const lo = Number((fs.price + 0.01).toFixed(2));
                          const next = sorted[idx + 1];
                          const range = next ? `£${lo.toFixed(2)} – £${(next.price - 0.01).toFixed(2)}/litre` : `£${lo.toFixed(2)}+/litre`;
                          return <option key={fs.id} value={String(fs.percentage)}>{range} (+{fs.percentage}p/mile)</option>;
                        });
                      })()}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">No. Items</label>
                      <input type="number" min="0" value={f.numberOfItems || ""} onChange={e => s("numberOfItems", e.target.value)} className={inp} placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Weight (kg)</label>
                      <input type="number" step="0.1" min="0" value={f.weight || ""} onChange={e => s("weight", e.target.value)} className={inp} placeholder="e.g. 10" />
                    </div>
                  </div>
                  <select value={f.bookingTypeId || ""} onChange={e => s("bookingTypeId", e.target.value)} className={inp}>
                    <option value="">Sameday</option>
                    {bookingTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.manualDesc || ""} onChange={e => s("manualDesc", e.target.value)} placeholder="Manual Job" className={inp} />
                    <input type="number" step="0.01" value={f.manualAmount || ""} onChange={e => s("manualAmount", e.target.value)} placeholder="Amount £" className={inp} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Toggle checked={!!f.avoidTolls} onChange={v => {
                      setF(p => ({ ...p, avoidTolls: v }));
                      if (f.collectionPostcode && f.deliveryPostcode && googleMapRef.current) {
                        const g = (window as any).google;
                        if (g) new g.maps.DirectionsService().route({
                          origin: f.collectionPostcode, destination: f.deliveryPostcode,
                          travelMode: g.maps.TravelMode.DRIVING, avoidTolls: v,
                        }, (result: any, status: string) => { if (status === "OK") directionsRendererRef.current?.setDirections(result); });
                      }
                    }} label="Avoid Tolls" />
                    <Toggle checked={!!f.waitAndReturn} onChange={v => {
                      const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                      if (rawMiles) { const { updates } = recalcPrices(rawMiles, { ...f, waitAndReturn: v }); setF(p => ({ ...p, waitAndReturn: v, ...updates })); }
                      else s("waitAndReturn", v);
                    }} label="Wait & Return" />
                    <Toggle checked={!!f.deadMilesEnabled} onChange={v => {
                      const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                      const dmi = v ? String(customer?.deadMileage || 15) : "";
                      if (rawMiles) { const { updates } = recalcPrices(rawMiles, { ...f, deadMilesEnabled: v, deadMiles: dmi }); setF(p => ({ ...p, deadMilesEnabled: v, deadMiles: dmi, ...updates })); }
                      else setF(p => ({ ...p, deadMilesEnabled: v, deadMiles: dmi }));
                    }} label="Dead Miles" />
                    {f.deadMilesEnabled && (
                      <input type="number" min="0" value={f.deadMiles || ""} onChange={e => {
                        const dm = e.target.value;
                        const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                        if (rawMiles) { const { updates } = recalcPrices(rawMiles, { ...f, deadMiles: dm }); setF(p => ({ ...p, deadMiles: dm, ...updates })); }
                        else s("deadMiles", dm);
                      }} className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="15" />
                    )}
                    <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-xs font-semibold transition-colors disabled:opacity-60">
                      Apply New Mileage
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 mt-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-full">Customer View Controls</span>
                    <button type="button" onClick={() => autoSaveTracking("hideTrackingTemperature", !f.hideTrackingTemperature)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        !f.hideTrackingTemperature
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                      }`}>
                      🌡️ {!f.hideTrackingTemperature ? "Temp Tracking ON" : "Temp Tracking OFF"}
                    </button>
                    <button type="button" onClick={() => autoSaveTracking("hideTrackingMap", !f.hideTrackingMap)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        !f.hideTrackingMap
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                      }`}>
                      🗺️ {!f.hideTrackingMap ? "Map Tracking ON" : "Map Tracking OFF"}
                    </button>
                  </div>
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-emerald-600" icon="💰" label="Profit &amp; Notes" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-600 shrink-0">PROFIT £</label>
                    <div className={`flex-1 px-3 py-2 border rounded-xl text-sm font-bold text-center ${profit >= 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}>
                      {profit.toFixed(2)}
                    </div>
                  </div>
                  <textarea value={f.jobNotes || ""} onChange={e => s("jobNotes", e.target.value)} placeholder="Job Notes" rows={4} className={inp + " resize-none"} />
                </div>
              </div>
            </div>

            {/* COLUMN 3: Delivery + Drivers + POD */}
            <div className="space-y-4">
              <div className={panel}>
                <SHead color="bg-blue-700" icon="📅" label="Delivery Date / Time" />
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Date</label>
                    <input type="date" value={f.deliveryDate || ""} onChange={e => s("deliveryDate", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Time</label>
                    <TimePicker value={f.deliveryTime || ""} onChange={v => s("deliveryTime", v)} className={inp} />
                  </div>
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-teal-600" icon="🏭" label="Delivery Address" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch postcode={f.deliveryPostcode || ""} country={f.deliveryCountry || "UK"}
                    onChangePostcode={v => s("deliveryPostcode", v)} onChangeCountry={v => s("deliveryCountry", v)}
                    onApply={r => { const isBiz = r.line1 && !/^\d/.test(r.line1) && r.line2; s("deliveryName", isBiz ? r.line1 : ""); s("deliveryAddress1", isBiz ? (r.line2 || "") : (r.line1 || "")); s("deliveryAddress2", ""); s("deliveryArea", r.city); s("deliveryPostcode", r.postcode); }} />
                  <NameSearch value={f.deliveryName || ""} onChange={v => s("deliveryName", v)}
                    onApply={a => {
                      s("deliveryAddress1", a.address1 || "");
                      s("deliveryAddress2", a.address2 || "");
                      s("deliveryArea", a.area || "");
                      if (a.postcode) s("deliveryPostcode", a.postcode);
                      if (a.contact) s("deliveryContact", a.contact);
                      if (a.phone) s("deliveryPhone", a.phone);
                    }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryAddress1 || ""} onChange={e => s("deliveryAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <input type="text" value={f.deliveryAddress2 || ""} onChange={e => s("deliveryAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryArea || ""} onChange={e => s("deliveryArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    <input type="text" value={f.deliveryPostcode || ""} onChange={e => s("deliveryPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryContact || ""} onChange={e => s("deliveryContact", e.target.value)} placeholder="Contact Name" className={inp} />
                    <input type="text" value={f.deliveryPhone || ""} onChange={e => s("deliveryPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                  </div>
                  <textarea value={f.deliveryNotes || ""} onChange={e => s("deliveryNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                  {/* Delivery Collected Orders */}
                  <div className="border-t border-slate-200 pt-2 space-y-1.5 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collected Orders</span>
                      <button type="button" onClick={() => setDeliveryOrders(prev => [...prev, {ref: "", type: ""}])}
                        className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {deliveryOrders.map((order, oi) => (
                      <div key={oi} className="flex items-center gap-1.5">
                        <input type="text" value={order.ref} onChange={e => setDeliveryOrders(prev => prev.map((o, i) => i === oi ? {...o, ref: e.target.value} : o))}
                          placeholder="Order ref / no" className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        <div className="flex gap-0.5">
                          {["Chill","Amb","Pump","Stores"].map(t => (
                            <button key={t} type="button" onClick={() => setDeliveryOrders(prev => prev.map((o, i) => i === oi ? {...o, type: t} : o))}
                              className={`px-1.5 py-1 text-xs rounded font-medium transition-colors ${
                                order.type === t ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}>{t}</button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setDeliveryOrders(prev => prev.filter((_, i) => i !== oi))}
                          className="text-slate-400 hover:text-rose-600 font-bold leading-none">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Driver Cost */}
              <div className={panel}>
                <SHead color="bg-red-700" icon="🚘" label="Driver Cost" />
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Driver</label>
                    <div className="flex items-center gap-2">
                      <select value={f.driverId || ""} onChange={e => {
                        const id = e.target.value;
                        const miles = Math.round(parseFloat(f.miles) || 0);
                        const dr = drivers.find((d: any) => d.id === id);
                        if (!id) {
                          setF(p => ({ ...p, driverId: "", driverCost: "", chillUnitId: "", ambientUnitId: "" }));
                          return;
                        }
                        const driverUnits = allStorageUnits.filter((u: any) => u.currentDriverId === id);
                        setF(p => ({
                          ...p,
                          driverId: id,
                          driverCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.driverCost,
                          chillUnitId: driverUnits[0]?.id ?? p.chillUnitId,
                          ambientUnitId: driverUnits[1]?.id ?? p.ambientUnitId,
                        }));
                      }} className={inp}>
                        <option value="">— Select Driver —</option>
                        {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>)}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.driverCost || ""} onChange={e => s("driverCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">SubContractor</label>
                    <div className="flex items-center gap-2">
                      <select value={f.secondManId || ""} onChange={e => {
                        const id = e.target.value;
                        const miles = Math.round(parseFloat(f.miles) || 0);
                        const dr = subcons.find((d: any) => d.id === id);
                        setF(p => ({ ...p, secondManId: id, secondManContactId: "", extraCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.extraCost }));
                      }} className={inp}>
                        <option value="">— Select SubCon —</option>
                        {subcons.map((d: any) => <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>)}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.extraCost || ""} onChange={e => s("extraCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                    {subconContacts.length > 0 && (
                      <select value={f.secondManContactId || ""} onChange={e => s("secondManContactId", e.target.value)} className={inp + " mt-1.5"}>
                        <option value="">— Assign driver under SubCon —</option>
                        {subconContacts.map((c: any) => <option key={c.id} value={c.id}>{c.driverName}{c.vehicleRegistration ? ` · ${c.vehicleRegistration}` : ""}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">CX Driver</label>
                    <div className="flex items-center gap-2">
                      <select value={f.cxDriverId || ""} onChange={e => {
                        const id = e.target.value;
                        const miles = Math.round(parseFloat(f.miles) || 0);
                        const dr = cxDrivers.find((d: any) => d.id === id);
                        setF(p => ({ ...p, cxDriverId: id, cxDriverContactId: "", cxDriverCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.cxDriverCost }));
                      }} className={inp}>
                        <option value="">— Select CX Driver —</option>
                        {cxDrivers.map((d: any) => <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>)}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.cxDriverCost || ""} onChange={e => s("cxDriverCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                    {cxContacts.length > 0 && (
                      <select value={f.cxDriverContactId || ""} onChange={e => s("cxDriverContactId", e.target.value)} className={inp + " mt-1.5"}>
                        <option value="">— Assign driver under CX —</option>
                        {cxContacts.map((c: any) => <option key={c.id} value={c.id}>{c.driverName}{c.vehicleRegistration ? ` · ${c.vehicleRegistration}` : ""}</option>)}
                      </select>
                    )}
                  </div>
                  {/* Storage units — only show when a driver is selected */}
                  {activeDriverId && <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        Storage Units
                      </div>
                      <button type="button" onClick={() => setShowUnitsModal(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                        <Plus className="w-3 h-3" /> Show All Units
                      </button>
                    </div>
                    <div>
                      <select value={f.chillUnitId || ""} onChange={e => s("chillUnitId", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— Select Unit —</option>
                        {allStorageUnits.map((u: any) => (
                          <option key={u.id} value={u.id} disabled={!!u.currentDriverId && u.currentDriverId !== activeDriverId}>
                            {u.unitNumber}{u.unitType ? ` (${u.unitType})` : ""}{u.currentDriverId && u.currentDriverId !== activeDriverId ? ` (in use)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select value={f.ambientUnitId || ""} onChange={e => s("ambientUnitId", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— Select Unit —</option>
                        {allStorageUnits.map((u: any) => (
                          <option key={u.id} value={u.id} disabled={!!u.currentDriverId && u.currentDriverId !== activeDriverId}>
                            {u.unitNumber}{u.unitType ? ` (${u.unitType})` : ""}{u.currentDriverId && u.currentDriverId !== activeDriverId ? ` (in use)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>}
                </div>
              </div>

              {/* POD Details */}
              <div className={panel}>
                <SHead color="bg-teal-700" icon="✅" label="POD Details" />
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Signed By</label>
                      <input type="text" value={f.podSignature || ""} onChange={e => s("podSignature", e.target.value)} placeholder="Signature name" className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Relationship</label>
                      <input type="text" value={f.podRelationship || ""} onChange={e => s("podRelationship", e.target.value)} placeholder="e.g. Recipient" className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">POD Date</label>
                      <input type="date" value={f.podDate || ""} onChange={e => s("podDate", e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">POD Time</label>
                      <TimePicker value={f.podTime || ""} onChange={v => s("podTime", v)} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">🌡 Delivered Temperature</label>
                    <input type="text" value={f.deliveredTemperature || ""} onChange={e => s("deliveredTemperature", e.target.value)} placeholder="e.g. 4°C" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Driver Note</label>
                    <textarea value={f.driverNote || ""} onChange={e => s("driverNote", e.target.value)} placeholder="Driver's note" rows={2} className={inp + " resize-none"} />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Toggle checked={!!f.podDataVerify} onChange={v => s("podDataVerify", v)} label="POD Verified" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VIA */}
          <div className={panel}>
            <SHead color="bg-indigo-600" icon="📍" label="Via Stops" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => setVias(prev => [...prev.slice(0, 5), { viaType: "Via", name: "", postcode: "", address1: "", address2: "", area: "", contact: "", phone: "", notes: "", viaDate: today, viaTime: "", collectedOrders: [], signedBy: "", podRelationship: "", podDate: "", podTime: "", deliveredTemp: "" }])} disabled={vias.length >= 6}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  <Plus className="w-3 h-3" /> Add Via Stop
                </button>
                {vias.length > 0 && <span className="text-xs text-slate-400">{vias.length}/6 stops</span>}
              </div>
              {vias.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {vias.map((via: any, i: number) => (
                    <div key={i} className="relative bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                      {/* Header: type + date + time + remove */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select value={via.viaType} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, viaType: e.target.value } : x))}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold">
                          <option value="Via">📍 Via</option>
                          <option value="Collection">📦 Collection</option>
                          <option value="Delivery">🏭 Delivery</option>
                        </select>
                        <input type="date" value={via.viaDate || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, viaDate: e.target.value } : x))}
                          className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <TimePicker value={via.viaTime || ""} onChange={v => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, viaTime: v } : x))}
                          className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button type="button" onClick={() => setVias(prev => prev.filter((_, idx) => idx !== i))}
                          className="ml-auto text-slate-400 hover:text-rose-600 text-lg font-bold leading-none">&times;</button>
                      </div>
                      <PostcodeSearch postcode={via.postcode || ""} country="UK"
                        onChangePostcode={v => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, postcode: v.toUpperCase() } : x))}
                        onChangeCountry={() => {}}
                        onApply={r => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, name: (r.line1 && !/^\d/.test(r.line1) && r.line2) ? r.line1 : "", address1: (r.line1 && !/^\d/.test(r.line1) && r.line2) ? (r.line2 || "") : (r.line1 || ""), address2: "", area: r.city, postcode: r.postcode } : x))}
                        placeholder="Postcode lookup..." />
                      <NameSearch value={via.name || ""} onChange={v => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))}
                        onApply={a => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, address1: a.address1 || "", address2: a.address2 || "", area: a.area || "", ...(a.postcode ? { postcode: a.postcode } : {}), ...(a.contact ? { contact: a.contact } : {}), ...(a.phone ? { phone: a.phone } : {}) } : x))} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={via.address1 || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, address1: e.target.value } : x))} placeholder="Address 1" className={inp} />
                        <input type="text" value={via.address2 || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, address2: e.target.value } : x))} placeholder="Address 2" className={inp} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={via.area || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, area: e.target.value } : x))} placeholder="Town / Area" className={inp} />
                        <input type="text" value={via.postcode || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, postcode: e.target.value.toUpperCase() } : x))} placeholder="Postcode" className={inp2} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={via.contact || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, contact: e.target.value } : x))} placeholder="Contact" className={inp} />
                        <input type="text" value={via.phone || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} placeholder="Phone" className={inp} />
                      </div>
                      {via.signedBy && (
                        <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">✓ POD received: {via.signedBy}</div>
                      )}
                      <textarea value={via.notes || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))} placeholder="Notes" rows={1} className={inp + " resize-none"} />
                      {/* Collected Orders */}
                      <div className="border-t border-slate-200 pt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collected Orders</span>
                          <button type="button" onClick={() => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, collectedOrders: [...(x.collectedOrders || []), { ref: "", type: "" }] } : x))}
                            className="flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        {(via.collectedOrders || []).map((order: any, oi: number) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <input type="text" value={order.ref || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, collectedOrders: x.collectedOrders.map((o: any, oIdx: number) => oIdx === oi ? { ...o, ref: e.target.value } : o) } : x))}
                              placeholder="Order ref / no" className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
                            <div className="flex gap-0.5">
                              {["Chill","Amb","Pump","Stores"].map(t => (
                                <button key={t} type="button" onClick={() => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, collectedOrders: x.collectedOrders.map((o: any, oIdx: number) => oIdx === oi ? { ...o, type: t } : o) } : x))}
                                  className={`px-1.5 py-1 text-xs rounded font-medium transition-colors ${
                                  order.type === t ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}>{t}</button>
                              ))}
                            </div>
                            <button type="button" onClick={() => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, collectedOrders: x.collectedOrders.filter((_: any, oIdx: number) => oIdx !== oi) } : x))}
                              className="text-slate-400 hover:text-rose-600 font-bold leading-none">&times;</button>
                          </div>
                        ))}
                      </div>
                      {/* Via POD */}
                      <div className="border-t border-slate-200 pt-2 space-y-1.5">
                        <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">✅ Via POD</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="text" value={via.signedBy || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, signedBy: e.target.value } : x))} placeholder="Signed By" className={inp} />
                          <input type="text" value={via.podRelationship || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, podRelationship: e.target.value } : x))} placeholder="Relationship" className={inp} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="date" value={via.podDate || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, podDate: e.target.value } : x))} className={inp} />
                          <TimePicker value={via.podTime || ""} onChange={v => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, podTime: v } : x))} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <input type="text" value={via.deliveredTemp || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, deliveredTemp: e.target.value } : x))} placeholder="Delivered Temp (e.g. 4°C)" className={inp} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom save bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-md border border-slate-100 px-5 py-3">
            <Link href={`/admin/bookings/${id}`}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 font-medium transition-colors">
              ← Cancel
            </Link>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Miles: <strong className="text-slate-800 text-sm">{milesNum || "—"}</strong></span>
              <span>Quote: <strong className="text-emerald-700 text-sm">£{parseFloat(f.customerPrice || "0").toFixed(2)}</strong></span>
              <span className={profit >= 0 ? "text-emerald-600" : "text-rose-600"}>Profit: <strong className="text-sm">£{profit.toFixed(2)}</strong></span>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-70 shadow-md transition-all">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "✓ Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Save Button */}
      <button type="button" onClick={(e) => handleSubmit(e as any)} disabled={saving}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm shadow-xl disabled:opacity-70 transition-all">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : "Save"}
      </button>

      {/* All Units Modal */}
      {showUnitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 text-base">All Storage Units</h2>
              <button type="button" onClick={() => setShowUnitsModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-2 gap-2">
                {allStorageUnits.map((u: any) => {
                  const isActiveDriver = u.currentDriverId === activeDriverId;
                  const isAssignedElsewhere = u.currentDriverId && u.currentDriverId !== activeDriverId;
                  return (
                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${isActiveDriver ? "bg-blue-50 border-blue-300" : isAssignedElsewhere ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"}`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{u.unitNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${u.unitType === "chill" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{u.unitType || "unit"}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${u.availability === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{u.availability === "Yes" ? "In Store" : "Out"}</span>
                        </div>
                        {isAssignedElsewhere && <p className="text-slate-400">Driver: {u.currentDriver?.name || "other"}</p>}
                        {isActiveDriver && <p className="text-blue-600 font-medium">✓ Assigned to this driver</p>}
                      </div>
                      {activeDriverId && !isAssignedElsewhere && (
                        <button type="button" onClick={() => assignUnit(u.id, isActiveDriver ? "" : activeDriverId)} disabled={assigningUnit === u.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${isActiveDriver ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                          {assigningUnit === u.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : isActiveDriver ? "Remove" : "Assign"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
