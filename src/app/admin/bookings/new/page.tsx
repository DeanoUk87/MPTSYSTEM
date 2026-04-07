"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import { Loader2, Search, RefreshCw, Plus, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";

// ── Helpers ────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

const inp = "w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";
const inp2 = "w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono";
const sectionHead = "flex items-center gap-2 px-3 py-2 rounded text-white text-xs font-bold uppercase tracking-wider";

function SHead({ color, icon, label }: { color: string; icon: string; label: string }) {
  return <div className={`${sectionHead} ${color} mb-2`}>{icon} {label}</div>;
}

// Postcode search with Crafty Clicks
function PostcodeSearch({ value, onChange, onApply, placeholder }: {
  value: string; onChange: (v: string) => void;
  onApply: (r: any) => void; placeholder?: string;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(v: string) {
    onChange(v.toUpperCase());
    const pc = v.replace(/\s/g, "");
    if (pc.length < 5) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/postcode?postcode=${encodeURIComponent(pc)}`);
      const d = await res.json();
      setResults(d.results ?? []);
    } catch { setResults([]); } finally { setLoading(false); }
  }

  return (
    <div className="relative">
      <input type="text" value={value} onChange={e => search(e.target.value)}
        placeholder={placeholder || "Start with post/zip code or street"}
        className={inp + " uppercase"} />
      {loading && <Loader2 className="absolute right-2 top-2 w-3 h-3 animate-spin text-slate-400" />}
      {results.length > 0 && (
        <div className="absolute z-30 w-full bg-white border border-slate-300 rounded shadow-xl mt-0.5 max-h-48 overflow-y-auto">
          {results.map((r: any, i: number) => (
            <button key={i} type="button" onClick={() => { onApply(r); onChange(r.postcode); setResults([]); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0">
              <span className="font-medium">{r.line1}</span>
              {r.line2 && <span className="text-slate-400">, {r.line2}</span>}
              <span className="text-slate-400">, {r.city} {r.postcode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 1: Customer Search ────────────────────────────────────────────────
function CustomerSearch({ onSelect }: { onSelect: (c: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">New Booking</h2>
        <p className="text-sm text-slate-500 mb-6">Search for a customer to get started</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Type customer name or account number..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
        </div>
        {results.length > 0 && (
          <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {results.map((c: any) => (
              <button key={c.id} onClick={() => onSelect(c)} className="w-full px-4 py-3 text-left hover:bg-blue-50">
                <p className="font-medium text-slate-800">{c.name}</p>
                {c.accountNumber && <p className="text-xs text-slate-400">{c.accountNumber}</p>}
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-4">No customers found</p>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Job Type ───────────────────────────────────────────────────────
function JobTypeSelect({ customer, onSelect }: { customer: any; onSelect: (t: number) => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <p className="text-xs text-slate-400 mb-1">New booking for</p>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{customer.name}</h2>
        <div className="space-y-3">
          {[
            { value: 0, label: "Normal", desc: "Standard weekday rate", color: "border-blue-300 hover:bg-blue-50" },
            { value: 1, label: "Weekend / Bank Holiday", desc: "Weekend rate", color: "border-amber-300 hover:bg-amber-50" },
            { value: 2, label: "Out of Hours", desc: "Evening/overnight rate", color: "border-purple-300 hover:bg-purple-50" },
          ].map(opt => (
            <button key={opt.value} onClick={() => onSelect(opt.value)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${opt.color}`}>
              <p className="font-semibold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Booking Form ──────────────────────────────────────────────────────
function BookingForm({ customer, jobType, onBack }: { customer: any; jobType: number; onBack: () => void }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const [saving, setSaving] = useState(false);
  const [calcMiles, setCalcMiles] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [subcons, setSubcons] = useState<any[]>([]);
  const [cxDrivers, setCxDrivers] = useState<any[]>([]);
  const [subconContacts, setSubconContacts] = useState<any[]>([]);
  const [cxContacts, setCxContacts] = useState<any[]>([]);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [storageUnits, setStorageUnits] = useState<any[]>([]);
  const [vehicleRates, setVehicleRates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ miles: number; duration: string } | null>(null);

  const jt = jobType;
  const rateKey = jt === 0 ? "ratePerMile" : jt === 1 ? "ratePerMileWeekends" : "ratePerMileOutOfHours";
  const driverRateKey = jt === 0 ? "costPerMile" : jt === 1 ? "costPerMileWeekends" : "costPerMileOutOfHours";
  const jtLabel = ["Normal", "Weekend / BH", "Out of Hours"][jt];

  const [f, setF] = useState<Record<string, any>>({
    vehicleId: "", miles: "", customerPrice: "", manualAmount: "", manualDesc: "",
    fuelSurchargePercent: "", extraCost2: "", extraCost2Label: "",
    avoidTolls: false, waitAndReturn: false,
    purchaseOrder: customer.poNumber || "", bookedBy: "",
    numberOfItems: "", weight: "", bookingTypeId: "",
    jobNotes: "", officeNotes: "",
    driverId: "", driverCost: "",
    secondManId: "", secondManContactId: "", extraCost: "",
    cxDriverId: "", cxDriverContactId: "", cxDriverCost: "",
    chillUnitId: "", ambientUnitId: "",
    // Collection
    collectionDate: today, collectionTime: "00:00",
    collectionName: "", collectionAddress1: "", collectionAddress2: "",
    collectionArea: "", collectionCountry: "UK", collectionPostcode: "",
    collectionContact: "", collectionPhone: "", collectionNotes: "",
    // Delivery
    deliveryDate: today, deliveryTime: "00:00",
    deliveryName: "", deliveryAddress1: "", deliveryAddress2: "",
    deliveryArea: "", deliveryCountry: "UK", deliveryPostcode: "",
    deliveryContact: "", deliveryPhone: "", deliveryNotes: "",
  });

  const s = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then(r => r.json()),
      fetch("/api/drivers?type=Driver").then(r => r.json()),
      fetch("/api/drivers?type=SubContractor").then(r => r.json()),
      fetch("/api/drivers?type=CXDriver").then(r => r.json()),
      fetch("/api/booking-types").then(r => r.json()),
      fetch("/api/storage?availability=Yes").then(r => r.json()),
    ]).then(([v, d, sc, cx, bt, su]) => {
      setVehicles(v);
      setDrivers(d.filter((dr: any) => dr[driverRateKey] > 0));
      setSubcons(sc.filter((dr: any) => dr[driverRateKey] > 0));
      setCxDrivers(cx.filter((dr: any) => dr[driverRateKey] > 0));
      setBookingTypes(bt);
      setStorageUnits(su);
    });
  }, [jt]);

  // Vehicle rates
  useEffect(() => {
    if (!f.vehicleId) { setVehicleRates([]); return; }
    fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`)
      .then(r => r.json()).then(rates => {
        setVehicleRates(rates);
        if (rates.length > 0 && f.miles) {
          const rate = rates[0][rateKey];
          s("customerPrice", (Math.round(f.miles) * rate).toFixed(2));
        }
      });
  }, [f.vehicleId]);

  // Recalc price when miles change
  useEffect(() => {
    if (!vehicleRates.length || !f.miles) return;
    const rate = vehicleRates[0][rateKey];
    s("customerPrice", (Math.round(parseFloat(f.miles)) * rate).toFixed(2));
  }, [f.miles]);

  // Load subcon contacts when subcon changes
  useEffect(() => {
    if (!f.secondManId) { setSubconContacts([]); s("secondManContactId", ""); return; }
    fetch(`/api/drivers/${f.secondManId}`)
      .then(r => r.json()).then(d => setSubconContacts(d.contacts ?? []));
  }, [f.secondManId]);

  // Load CX driver contacts when CX changes
  useEffect(() => {
    if (!f.cxDriverId) { setCxContacts([]); s("cxDriverContactId", ""); return; }
    fetch(`/api/drivers/${f.cxDriverId}`)
      .then(r => r.json()).then(d => setCxContacts(d.contacts ?? []));
  }, [f.cxDriverId]);

  // Auto driver cost on driver select
  function handleDriverChange(driverId: string) {
    s("driverId", driverId);
    if (!driverId || !f.miles) return;
    const dr = drivers.find((d: any) => d.id === driverId);
    if (dr) s("driverCost", (Math.round(parseFloat(f.miles)) * dr[driverRateKey]).toFixed(2));
  }

  // Init Google Map
  function initMap() {
    if (!mapRef.current || googleMapRef.current) return;
    const gm = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 52.8, lng: -1.5 }, zoom: 7,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    googleMapRef.current = gm;
    directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 5 },
    });
    directionsRendererRef.current.setMap(gm);
  }

  async function handleGetMiles() {
    if (!f.collectionPostcode || !f.deliveryPostcode) {
      toast.error("Enter collection and delivery postcodes first");
      return;
    }
    setCalcMiles(true);
    try {
      const res = await fetch("/api/bookings/miles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: f.collectionPostcode, destination: f.deliveryPostcode, avoidTolls: f.avoidTolls }),
      });
      const data = await res.json();
      if (data.miles !== undefined) {
        s("miles", String(data.miles));
        setRouteInfo({ miles: data.miles, duration: data.duration });
      }
      // Draw route on map
      const g = (window as any).google;
      if (g && googleMapRef.current) {
        new g.maps.DirectionsService().route({
          origin: f.collectionPostcode, destination: f.deliveryPostcode,
          travelMode: g.maps.TravelMode.DRIVING, avoidTolls: f.avoidTolls,
        }, (result: any, status: string) => {
          if (status === "OK") directionsRendererRef.current?.setDirections(result);
        });
      }
    } catch { toast.error("Failed to calculate"); } finally { setCalcMiles(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.numberOfItems) { toast.error("Number of items is required"); return; }
    if (!f.weight) { toast.error("Weight is required"); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...f,
        customerId: customer.id,
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
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success("Booking created");
      router.push("/admin/bookings");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  const currentRate = vehicleRates.length > 0 ? vehicleRates[0][rateKey] : null;
  const miles = Math.round(parseFloat(f.miles) || 0);
  const profit = ((parseFloat(f.customerPrice) || 0) + (parseFloat(f.extraCost2) || 0))
    - ((parseFloat(f.driverCost) || 0) + (parseFloat(f.extraCost) || 0) + (parseFloat(f.cxDriverCost) || 0));

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4&libraries=places`}
        strategy="lazyOnload" onLoad={initMap}
      />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Topbar title={`Create Job — ${customer.name}`} subtitle={jtLabel} />

        <div className="p-4">
          {/* ── TOP ROW: Customer | PO + Booked By ── */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Customer panel */}
            <div className="bg-white rounded border border-slate-200">
              <SHead color="bg-blue-600" icon="👤" label="Customer" />
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded bg-slate-50 text-sm font-medium text-slate-700">
                  {customer.name}
                  <button type="button" onClick={onBack} className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline">Change</button>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">{jtLabel}</span>
                  {customer.accountNumber && <span className="text-xs text-slate-400">{customer.accountNumber}</span>}
                </div>
              </div>
            </div>
            {/* PO + Booked By */}
            <div className="bg-white rounded border border-slate-200">
              <SHead color="bg-blue-600" icon="📋" label="Purchase Order" />
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Purchase Order <span className="text-rose-500">*</span></label>
                  <input type="text" value={f.purchaseOrder} onChange={e => s("purchaseOrder", e.target.value)} className={inp} required />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Booked By</label>
                  <input type="text" value={f.bookedBy} onChange={e => s("bookedBy", e.target.value)} className={inp} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 3-COLUMN MAIN LAYOUT ── */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-3">

              {/* ══ COLUMN 1: Collection ══ */}
              <div className="space-y-3">
                {/* Collection Date/Time */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-blue-700" icon="📅" label="Collection Date / Time" />
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                    <input type="date" value={f.collectionDate} onChange={e => s("collectionDate", e.target.value)} className={inp} />
                    <input type="time" value={f.collectionTime} onChange={e => s("collectionTime", e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Collection Details */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-orange-500" icon="📍" label="Collection Details" />
                  <div className="px-3 pb-3 space-y-1.5">
                    <PostcodeSearch value={f.collectionPostcode}
                      onChange={v => s("collectionPostcode", v)}
                      onApply={r => { s("collectionAddress1", r.line1); s("collectionAddress2", r.line2||""); s("collectionArea", r.city); s("collectionPostcode", r.postcode); }} />
                    <input type="text" value={f.collectionName} onChange={e => s("collectionName", e.target.value)} placeholder="Business / Place Name" className={inp} />
                    <input type="text" value={f.collectionAddress1} onChange={e => s("collectionAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.collectionAddress2} onChange={e => s("collectionAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                      <input type="text" value={f.collectionArea} onChange={e => s("collectionArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.collectionPostcode} onChange={e => s("collectionPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                      <input type="text" value={f.collectionCountry} onChange={e => s("collectionCountry", e.target.value)} placeholder="Country" className={inp} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.collectionContact} onChange={e => s("collectionContact", e.target.value)} placeholder="Contact Name" className={inp} />
                      <input type="text" value={f.collectionPhone} onChange={e => s("collectionPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                    </div>
                    <textarea value={f.collectionNotes} onChange={e => s("collectionNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                  </div>
                </div>

                {/* Office Notes */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-slate-500" icon="📝" label="Office Notes" />
                  <div className="px-3 pb-3">
                    <textarea value={f.officeNotes} onChange={e => s("officeNotes", e.target.value)} placeholder="Office Notes" rows={4} className={inp + " resize-none"} />
                  </div>
                </div>
              </div>

              {/* ══ COLUMN 2: Map + Mileage Calculator ══ */}
              <div className="space-y-3">
                {/* MILEAGE CALCULATOR with map at top */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-purple-600" icon="🚗" label="Mileage Calculator" />
                  {/* Map always visible */}
                  <div ref={el => { (mapRef as any).current = el; }} style={{ height: "220px" }} className="w-full border-b border-slate-100" />

                  <div className="px-3 pb-3 space-y-2 mt-2">
                    {/* Vehicle select + rates */}
                    <div>
                      <select value={f.vehicleId} onChange={e => s("vehicleId", e.target.value)} className={inp}>
                        <option value="">— Select Vehicle —</option>
                        {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      {f.vehicleId && vehicleRates.length > 0 && (
                        <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {jtLabel}: £{currentRate?.toFixed(4)}/mi
                        </div>
                      )}
                      {f.vehicleId && vehicleRates.length === 0 && (
                        <div className="mt-1 flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          <span>No rates set</span>
                          <a href={`/admin/customers/${customer.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 underline font-semibold">
                            Add Rates <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Refresh + Add Rates buttons */}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        // Refresh vehicle rates
                        if (f.vehicleId) {
                          fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`)
                            .then(r => r.json()).then(setVehicleRates);
                        }
                      }} className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                      <a href={`/admin/customers/${customer.id}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600">
                        <Plus className="w-3 h-3" /> Add Rates
                      </a>
                    </div>

                    {/* Get Mileage button */}
                    <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-sm disabled:opacity-60">
                      {calcMiles ? <Loader2 className="w-4 h-4 animate-spin" /> : "🚩"}
                      Get Mileage and Costs
                    </button>

                    {/* Miles + time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500">Miles</label>
                        <input type="number" min="0" value={f.miles}
                          onChange={e => s("miles", String(Math.round(parseFloat(e.target.value) || 0)))}
                          className={inp + " font-bold text-base"} />
                      </div>
                      {routeInfo && (
                        <div className="flex flex-col justify-center">
                          <p className="text-xs text-amber-600 font-medium">{routeInfo.duration}</p>
                          <p className="text-xs text-slate-400">{routeInfo.miles} miles (rounded)</p>
                        </div>
                      )}
                    </div>

                    {/* Quote */}
                    <div>
                      <label className="text-xs text-slate-500">Quote (£)</label>
                      <input type="number" step="0.01" min="0" value={f.customerPrice}
                        onChange={e => s("customerPrice", e.target.value)}
                        className={inp + " font-bold text-base"} placeholder="0.00" />
                    </div>

                    {/* Fuel surcharge */}
                    <div>
                      <label className="text-xs text-slate-500">Fuel Surcharge</label>
                      <select value={f.fuelSurchargePercent} onChange={e => s("fuelSurchargePercent", e.target.value)} className={inp}>
                        <option value="">None (Up to £1.70/litre)</option>
                        <option value="6">6% (£1.70-£1.80/litre)</option>
                        <option value="9">9% (£1.80-£1.90/litre)</option>
                        <option value="12">12% (Over £1.90/litre)</option>
                      </select>
                    </div>

                    {/* Items + Weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input type="number" min="1" value={f.numberOfItems}
                          onChange={e => s("numberOfItems", e.target.value)}
                          placeholder="No. of Items *" className={inp} />
                      </div>
                      <div>
                        <input type="number" step="0.1" min="0" value={f.weight}
                          onChange={e => s("weight", e.target.value)}
                          placeholder="Weight (kg) *" className={inp} />
                      </div>
                    </div>

                    {/* Booking type */}
                    <select value={f.bookingTypeId} onChange={e => s("bookingTypeId", e.target.value)} className={inp}>
                      <option value="">Sameday</option>
                      {bookingTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>

                    {/* Manual job */}
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={f.manualDesc} onChange={e => s("manualDesc", e.target.value)} placeholder="Manual Job" className={inp} />
                      <input type="number" step="0.01" value={f.manualAmount} onChange={e => s("manualAmount", e.target.value)} placeholder="Amount" className={inp} />
                    </div>

                    {/* Checkboxes */}
                    <div className="flex gap-3 flex-wrap">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="checkbox" checked={f.avoidTolls} onChange={e => s("avoidTolls", e.target.checked)} className="rounded" />
                        Avoid Tolls
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="checkbox" checked={f.waitAndReturn} onChange={e => s("waitAndReturn", e.target.checked)} className="rounded" />
                        Wait and Return
                      </label>
                    </div>
                  </div>
                </div>

                {/* Profit & Notes */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-green-600" icon="💰" label="Profit & Notes" />
                  <div className="px-3 pb-3 space-y-2">
                    <div>
                      <label className="text-xs text-slate-500">PROFIT £</label>
                      <div className={`px-2 py-1.5 border rounded text-sm font-bold ${profit >= 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}>
                        {profit.toFixed(2)}
                      </div>
                    </div>
                    <textarea value={f.jobNotes} onChange={e => s("jobNotes", e.target.value)}
                      placeholder="Job Notes" rows={4} className={inp + " resize-none"} />
                  </div>
                </div>
              </div>

              {/* ══ COLUMN 3: Delivery + Driver Cost + POD ══ */}
              <div className="space-y-3">
                {/* Delivery Date/Time */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-blue-700" icon="📅" label="Delivery Date / Time" />
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                    <input type="date" value={f.deliveryDate} onChange={e => s("deliveryDate", e.target.value)} className={inp} />
                    <input type="time" value={f.deliveryTime} onChange={e => s("deliveryTime", e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-teal-600" icon="🏭" label="Delivery Address" />
                  <div className="px-3 pb-3 space-y-1.5">
                    <PostcodeSearch value={f.deliveryPostcode}
                      onChange={v => s("deliveryPostcode", v)}
                      onApply={r => { s("deliveryAddress1", r.line1); s("deliveryAddress2", r.line2||""); s("deliveryArea", r.city); s("deliveryPostcode", r.postcode); }} />
                    <input type="text" value={f.deliveryName} onChange={e => s("deliveryName", e.target.value)} placeholder="Business / Place Name" className={inp} />
                    <input type="text" value={f.deliveryAddress1} onChange={e => s("deliveryAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.deliveryAddress2} onChange={e => s("deliveryAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                      <input type="text" value={f.deliveryArea} onChange={e => s("deliveryArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.deliveryPostcode} onChange={e => s("deliveryPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                      <input type="text" value={f.deliveryCountry} onChange={e => s("deliveryCountry", e.target.value)} placeholder="Country" className={inp} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input type="text" value={f.deliveryContact} onChange={e => s("deliveryContact", e.target.value)} placeholder="Contact Name" className={inp} />
                      <input type="text" value={f.deliveryPhone} onChange={e => s("deliveryPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                    </div>
                    <textarea value={f.deliveryNotes} onChange={e => s("deliveryNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                  </div>
                </div>

                {/* Driver Cost */}
                <div className="bg-white rounded border border-slate-200">
                  <SHead color="bg-red-600" icon="🚗" label="Driver Cost" />
                  <div className="px-3 pb-3 space-y-2">
                    {/* Driver */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 w-16 shrink-0">Driver</label>
                      <select value={f.driverId} onChange={e => handleDriverChange(e.target.value)} className={inp}>
                        <option value="">Select Driver</option>
                        {drivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} (£{d[driverRateKey].toFixed(2)}/mi)</option>
                        ))}
                      </select>
                      <input type="number" step="0.01" min="0" value={f.driverCost}
                        onChange={e => s("driverCost", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-right text-red-600 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00" />
                    </div>

                    {/* SubCon */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 w-16 shrink-0">SubCon</label>
                      <select value={f.secondManId} onChange={e => s("secondManId", e.target.value)} className={inp}>
                        <option value="">Select Driver</option>
                        {subcons.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} (£{d[driverRateKey].toFixed(2)}/mi)</option>
                        ))}
                      </select>
                      <input type="number" step="0.01" min="0" value={f.extraCost}
                        onChange={e => s("extraCost", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-right text-red-600 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00" />
                    </div>
                    {/* SubCon driver contact picker */}
                    {subconContacts.length > 0 && (
                      <div className="ml-16">
                        <select value={f.secondManContactId} onChange={e => s("secondManContactId", e.target.value)} className={inp}>
                          <option value="">— Select Driver Under SubCon —</option>
                          {subconContacts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.driverName} {c.vehicleRegistration ? `(${c.vehicleRegistration})` : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* CX Driver */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 w-16 shrink-0">CX Driver</label>
                      <select value={f.cxDriverId} onChange={e => s("cxDriverId", e.target.value)} className={inp}>
                        <option value="">Select CX Driver</option>
                        {cxDrivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} (£{d[driverRateKey].toFixed(2)}/mi)</option>
                        ))}
                      </select>
                      <input type="number" step="0.01" min="0" value={f.cxDriverCost}
                        onChange={e => s("cxDriverCost", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-right text-red-600 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00" />
                    </div>
                    {/* CX driver contact picker */}
                    {cxContacts.length > 0 && (
                      <div className="ml-16">
                        <select value={f.cxDriverContactId} onChange={e => s("cxDriverContactId", e.target.value)} className={inp}>
                          <option value="">— Select Driver Under CX —</option>
                          {cxContacts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.driverName} {c.vehicleRegistration ? `(${c.vehicleRegistration})` : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Storage units */}
                    {storageUnits.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="text-xs text-slate-500">Chill Unit</label>
                          <select value={f.chillUnitId} onChange={e => s("chillUnitId", e.target.value)} className={inp}>
                            <option value="">None</option>
                            {storageUnits.filter((u: any) => !u.unitType || u.unitType === "chill").map((u: any) => (
                              <option key={u.id} value={u.id}>{u.unitNumber}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Ambient Unit</label>
                          <select value={f.ambientUnitId} onChange={e => s("ambientUnitId", e.target.value)} className={inp}>
                            <option value="">None</option>
                            {storageUnits.filter((u: any) => !u.unitType || u.unitType === "ambient").map((u: any) => (
                              <option key={u.id} value={u.id}>{u.unitNumber}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="flex items-center justify-between mt-4 bg-white rounded border border-slate-200 px-4 py-3">
              <button type="button" onClick={onBack} className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-70">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "✓ Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Page controller ────────────────────────────────────────────────────────
export default function NewBookingPage() {
  const [step, setStep] = useState<"customer" | "jobtype" | "form">("customer");
  const [customer, setCustomer] = useState<any>(null);
  const [jobType, setJobType] = useState(0);

  if (step === "customer") return <CustomerSearch onSelect={c => { setCustomer(c); setStep("jobtype"); }} />;
  if (step === "jobtype") return <JobTypeSelect customer={customer} onSelect={jt => { setJobType(jt); setStep("form"); }} />;
  return <BookingForm customer={customer} jobType={jobType} onBack={() => setStep("jobtype")} />;
}
