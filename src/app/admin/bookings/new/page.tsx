"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import { Loader2, MapPin, Search, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";

const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

// ── Postcode search field with Crafty Clicks dropdown ─────────────────────
function PostcodeField({ prefix, value, onChange, onApply }: {
  prefix: string; value: string;
  onChange: (v: string) => void;
  onApply: (r: any) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleChange(v: string) {
    onChange(v.toUpperCase());
    const pc = v.replace(/\s/g, "");
    if (pc.length < 5) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/postcode?postcode=${encodeURIComponent(pc)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch { setResults([]); } finally { setLoading(false); }
  }

  return (
    <div className="relative">
      <label className={lbl}>Postcode Search</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          placeholder="e.g. SW1A 1AA"
          onChange={e => handleChange(e.target.value)}
          className={inp + " uppercase pr-8"}
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-slate-400" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-52 overflow-y-auto">
          {results.map((r: any, i: number) => (
            <button key={i} type="button"
              onClick={() => { onApply(r); onChange(r.postcode); setResults([]); }}
              className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors">
              <span className="font-medium text-slate-700">{r.line1}</span>
              {r.line2 && <span className="text-slate-400">, {r.line2}</span>}
              <span className="text-slate-400">, {r.city} {r.postcode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 1: Customer Search ───────────────────────────────────────────────
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
            {results.map(c => (
              <button key={c.id} onClick={() => onSelect(c)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors">
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

// ── Step 2: Job Type Selection ────────────────────────────────────────────
function JobTypeSelect({ customer, onSelect }: { customer: any; onSelect: (t: number) => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <p className="text-xs text-slate-400 mb-1">New booking for</p>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{customer.name}</h2>
        <p className="text-sm font-semibold text-slate-600 mb-4">Select job type</p>
        <div className="space-y-3">
          {[
            { value: 0, label: "Normal", desc: "Standard weekday rate", color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
            { value: 1, label: "Weekend / Bank Holiday", desc: "Weekend and bank holiday rate", color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50" },
            { value: 2, label: "Out of Hours", desc: "Evening and overnight rate", color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50" },
          ].map(opt => (
            <button key={opt.value} onClick={() => onSelect(opt.value)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${opt.color}`}>
              <p className="font-semibold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Booking Form ─────────────────────────────────────────────────────
function BookingForm({ customer, jobType, onBack }: { customer: any; jobType: number; onBack: () => void }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [calcMiles, setCalcMiles] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [cxDrivers, setCxDrivers] = useState<any[]>([]);
  const [bookingTypes, setBookingTypes] = useState<any[]>([]);
  const [storageUnits, setStorageUnits] = useState<any[]>([]);
  const [vehicleRates, setVehicleRates] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ miles: string; duration: string } | null>(null);

  const jobTypeLabel = ["Normal", "Weekend / Bank Holiday", "Out of Hours"][jobType];
  const jobTypeColor = ["bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700"][jobType];

  const [form, setForm] = useState({
    vehicleId: "", miles: "", customerPrice: "", driverCost: "",
    driverId: "", secondManId: "", extraCost: "", cxDriverId: "", cxDriverCost: "",
    bookingTypeId: "", purchaseOrder: customer.poNumber || "", bookedBy: "",
    numberOfItems: "", weight: "", jobNotes: "", officeNotes: "",
    manualAmount: "", manualDesc: "", extraCost2: "", extraCost2Label: "",
    fuelSurchargePercent: "", avoidTolls: false,
    collectionDate: "", collectionTime: "09:00",
    collectionName: "", collectionAddress1: "", collectionAddress2: "",
    collectionArea: "", collectionCountry: "UK", collectionPostcode: "",
    collectionContact: "", collectionPhone: "", collectionNotes: "",
    deliveryDate: "", deliveryTime: "09:00",
    deliveryName: "", deliveryAddress1: "", deliveryAddress2: "",
    deliveryArea: "", deliveryCountry: "UK", deliveryPostcode: "",
    deliveryContact: "", deliveryPhone: "", deliveryNotes: "",
    chillUnitId: "", ambientUnitId: "",
  } as Record<string, any>);

  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then(r => r.json()),
      fetch("/api/drivers?type=Driver").then(r => r.json()),
      fetch("/api/drivers?type=SubContractor").then(r => r.json()),
      fetch("/api/drivers?type=CXDriver").then(r => r.json()),
      fetch("/api/booking-types").then(r => r.json()),
      fetch("/api/storage?availability=Yes").then(r => r.json()),
    ]).then(([v, d, s2, cx, bt, su]) => {
      setVehicles(v);
      const rf = jobType === 0 ? "costPerMile" : jobType === 1 ? "costPerMileWeekends" : "costPerMileOutOfHours";
      setDrivers(d.filter((dr: any) => dr[rf] > 0));
      setSubcontractors(s2.filter((dr: any) => dr[rf] > 0));
      setCxDrivers(cx.filter((dr: any) => dr[rf] > 0));
      setBookingTypes(bt);
      setStorageUnits(su);
    });
  }, [jobType]);

  useEffect(() => {
    if (!form.vehicleId) { setVehicleRates([]); return; }
    fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${form.vehicleId}`)
      .then(r => r.json()).then(rates => {
        setVehicleRates(rates);
        if (rates.length > 0 && form.miles) {
          const r = rates[0];
          const rate = jobType === 0 ? r.ratePerMile : jobType === 1 ? r.ratePerMileWeekends : r.ratePerMileOutOfHours;
          s("customerPrice", (parseFloat(form.miles) * rate).toFixed(2));
        }
      });
  }, [form.vehicleId]);

  useEffect(() => {
    if (!vehicleRates.length || !form.miles) return;
    const r = vehicleRates[0];
    const rate = jobType === 0 ? r.ratePerMile : jobType === 1 ? r.ratePerMileWeekends : r.ratePerMileOutOfHours;
    s("customerPrice", (parseFloat(form.miles) * rate).toFixed(2));
  }, [form.miles]);

  function handleDriverChange(driverId: string) {
    s("driverId", driverId);
    if (!driverId) return;
    const driver = drivers.find((d: any) => d.id === driverId);
    if (!driver || !form.miles) return;
    const rate = jobType === 0 ? driver.costPerMile : jobType === 1 ? driver.costPerMileWeekends : driver.costPerMileOutOfHours;
    if (rate > 0) s("driverCost", (parseFloat(form.miles) * rate).toFixed(2));
  }

  // Initialise Google Map
  function initMap() {
    if (!mapRef.current || googleMapRef.current) return;
    const gMap = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 52.5, lng: -1.5 },
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
    });
    googleMapRef.current = gMap;
    directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 4 },
    });
    directionsRendererRef.current.setMap(gMap);
    setMapReady(true);
  }

  async function handleGetMiles() {
    const origin = form.collectionPostcode;
    const dest = form.deliveryPostcode;
    if (!origin || !dest) { toast.error("Enter collection and delivery postcodes first"); return; }
    setCalcMiles(true);
    setMapVisible(true);

    // Server-side distance calc
    try {
      const res = await fetch("/api/bookings/miles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination: dest, avoidTolls: form.avoidTolls }),
      });
      const data = await res.json();
      if (data.miles !== undefined) {
        s("miles", String(data.miles));
        setRouteInfo({ miles: data.miles.toFixed(1), duration: data.duration });
        if (data.note) toast(data.note);
      }
    } catch { toast.error("Failed to calculate miles"); }

    // Client-side route display on map
    const g = (window as any).google;
    if (g && googleMapRef.current && directionsRendererRef.current) {
      const directionsService = new g.maps.DirectionsService();
      directionsService.route({
        origin,
        destination: dest,
        travelMode: g.maps.TravelMode.DRIVING,
        avoidTolls: form.avoidTolls,
      }, (result: any, status: string) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);
        }
      });
    }

    setCalcMiles(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.numberOfItems) { toast.error("Number of items is required"); return; }
    if (!form.weight) { toast.error("Weight is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form, customerId: customer.id, weekend: jobType,
        miles: form.miles ? parseFloat(form.miles) : null,
        customerPrice: form.customerPrice ? parseFloat(form.customerPrice) : null,
        driverCost: form.driverCost ? parseFloat(form.driverCost) : null,
        extraCost: form.extraCost ? parseFloat(form.extraCost) : null,
        cxDriverCost: form.cxDriverCost ? parseFloat(form.cxDriverCost) : null,
        extraCost2: form.extraCost2 ? parseFloat(form.extraCost2) : null,
        manualAmount: form.manualAmount ? parseFloat(form.manualAmount) : null,
        fuelSurchargePercent: form.fuelSurchargePercent ? parseFloat(form.fuelSurchargePercent) : null,
        numberOfItems: form.numberOfItems ? parseInt(form.numberOfItems) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        vehicleId: form.vehicleId || null, driverId: form.driverId || null,
        secondManId: form.secondManId || null, cxDriverId: form.cxDriverId || null,
        bookingTypeId: form.bookingTypeId || null,
        chillUnitId: form.chillUnitId || null, ambientUnitId: form.ambientUnitId || null,
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

  const rateField = jobType === 0 ? "ratePerMile" : jobType === 1 ? "ratePerMileWeekends" : "ratePerMileOutOfHours";
  const currentRate = vehicleRates.length > 0 ? vehicleRates[0][rateField] : null;
  const profit = ((parseFloat(form.customerPrice) || 0) + (parseFloat(form.extraCost2) || 0))
    - ((parseFloat(form.driverCost) || 0) + (parseFloat(form.extraCost) || 0) + (parseFloat(form.cxDriverCost) || 0));

  return (
    <>
      {/* Load Google Maps JS API */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4"}&libraries=places`}
        strategy="lazyOnload"
        onLoad={initMap}
      />

      <div className="flex-1">
        <Topbar title={`New Booking — ${customer.name}`}
          subtitle={`${customer.accountNumber ? customer.accountNumber + ' · ' : ''}${jobTypeLabel}`} />

        <div className="px-6 pt-4 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColor}`}>{jobTypeLabel}</span>
          <button type="button" onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600 underline">Change</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* ── COL 1: Collection ── */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Collection Date & Time</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lbl}>Date</label><input type="date" value={form.collectionDate} onChange={e => s("collectionDate", e.target.value)} className={inp} /></div>
                  <div><label className={lbl}>Time</label><input type="time" value={form.collectionTime} onChange={e => s("collectionTime", e.target.value)} className={inp} /></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Collection Details</h3>
                {/* Postcode search FIRST */}
                <PostcodeField prefix="collection" value={form.collectionPostcode}
                  onChange={v => s("collectionPostcode", v)}
                  onApply={r => {
                    s("collectionAddress1", r.line1);
                    s("collectionAddress2", r.line2 || "");
                    s("collectionArea", r.city);
                    s("collectionPostcode", r.postcode);
                  }} />
                <div><label className={lbl}>Business / Place Name</label><input type="text" value={form.collectionName} onChange={e => s("collectionName", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Address 1</label><input type="text" value={form.collectionAddress1} onChange={e => s("collectionAddress1", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Address 2</label><input type="text" value={form.collectionAddress2} onChange={e => s("collectionAddress2", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Town / Area</label><input type="text" value={form.collectionArea} onChange={e => s("collectionArea", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Contact Name</label><input type="text" value={form.collectionContact} onChange={e => s("collectionContact", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Phone</label><input type="text" value={form.collectionPhone} onChange={e => s("collectionPhone", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Collection Notes</label><textarea value={form.collectionNotes} onChange={e => s("collectionNotes", e.target.value)} rows={2} className={inp + " resize-none"} /></div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Office Notes</h3>
                <textarea value={form.officeNotes} onChange={e => s("officeNotes", e.target.value)} rows={3} className={inp + " resize-none"} placeholder="Internal notes (not visible to driver)" />
              </div>
            </div>

            {/* ── COL 2: Map + Pricing ── */}
            <div className="space-y-3">

              {/* Google Map */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Route & Mileage</h3>
                  <div>
                    <label className={lbl}>Miles</label>
                    <div className="flex gap-2">
                      <input type="number" step="0.1" min="0" value={form.miles}
                        onChange={e => s("miles", e.target.value)} className={inp} placeholder="0.0" />
                      <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap font-medium">
                        {calcMiles ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        Calc & Map
                      </button>
                    </div>
                  </div>
                  {routeInfo && (
                    <div className="flex gap-4 text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <span className="text-blue-700 font-semibold">{routeInfo.miles} miles</span>
                      <span className="text-blue-500">{routeInfo.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="avoidTolls" checked={form.avoidTolls} onChange={e => s("avoidTolls", e.target.checked)} className="rounded" />
                    <label htmlFor="avoidTolls" className="text-xs text-slate-600">Avoid Tolls</label>
                  </div>
                </div>
                {/* Map div — always rendered, height 0 until visible */}
                <div
                  ref={el => {
                    (mapRef as any).current = el;
                    if (el && mapReady && !googleMapRef.current) initMap();
                  }}
                  className="transition-all duration-300"
                  style={{ height: mapVisible ? "280px" : "0px" }}
                />
              </div>

              {/* Vehicle & Rates */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle & Customer Rate</h3>
                <div>
                  <label className={lbl}>Vehicle</label>
                  <select value={form.vehicleId} onChange={e => s("vehicleId", e.target.value)} className={inp}>
                    <option value="">— Select vehicle —</option>
                    {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                {form.vehicleId && vehicleRates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-semibold text-blue-700">{jobTypeLabel} Rate</p>
                    <p className="text-blue-600 font-mono text-sm">£{currentRate?.toFixed(4)} / mile</p>
                  </div>
                )}
                {form.vehicleId && vehicleRates.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start justify-between gap-2">
                    <span>No rates set for this customer &amp; vehicle.</span>
                    <a href={`/admin/customers/${customer.id}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 font-semibold underline whitespace-nowrap hover:text-amber-900">
                      Add rates <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div>
                  <label className={lbl}>Customer Price (£)</label>
                  <input type="number" step="0.01" min="0" value={form.customerPrice}
                    onChange={e => s("customerPrice", e.target.value)} className={inp} placeholder="Auto-calculated" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Fuel Surcharge %</label>
                    <select value={form.fuelSurchargePercent} onChange={e => s("fuelSurchargePercent", e.target.value)} className={inp}>
                      <option value="">0%</option>
                      <option value="6">6%</option>
                      <option value="9">9%</option>
                      <option value="12">12%</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Manual Override (£)</label>
                    <input type="number" step="0.01" min="0" value={form.manualAmount} onChange={e => s("manualAmount", e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Manual Desc</label>
                  <input type="text" value={form.manualDesc} onChange={e => s("manualDesc", e.target.value)} className={inp} />
                </div>
              </div>

              {/* Job Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Items <span className="text-rose-500">*</span></label>
                    <input type="number" min="1" value={form.numberOfItems} onChange={e => s("numberOfItems", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Weight (kg) <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.1" min="0" value={form.weight} onChange={e => s("weight", e.target.value)} className={inp} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>PO Number</label>
                  <input type="text" value={form.purchaseOrder} onChange={e => s("purchaseOrder", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Booked By</label>
                  <input type="text" value={form.bookedBy} onChange={e => s("bookedBy", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Booking Type</label>
                  <select value={form.bookingTypeId} onChange={e => s("bookingTypeId", e.target.value)} className={inp}>
                    <option value="">Standard</option>
                    {bookingTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Profit */}
              {(form.customerPrice || form.driverCost) && (
                <div className={`rounded-xl border p-4 ${profit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Est. Profit</p>
                  <p className={`text-2xl font-bold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>£{profit.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* ── COL 3: Delivery + Drivers ── */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Delivery Date & Time</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lbl}>Date</label><input type="date" value={form.deliveryDate} onChange={e => s("deliveryDate", e.target.value)} className={inp} /></div>
                  <div><label className={lbl}>Time</label><input type="time" value={form.deliveryTime} onChange={e => s("deliveryTime", e.target.value)} className={inp} /></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Delivery Details</h3>
                {/* Postcode search FIRST */}
                <PostcodeField prefix="delivery" value={form.deliveryPostcode}
                  onChange={v => s("deliveryPostcode", v)}
                  onApply={r => {
                    s("deliveryAddress1", r.line1);
                    s("deliveryAddress2", r.line2 || "");
                    s("deliveryArea", r.city);
                    s("deliveryPostcode", r.postcode);
                  }} />
                <div><label className={lbl}>Business / Place Name</label><input type="text" value={form.deliveryName} onChange={e => s("deliveryName", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Address 1</label><input type="text" value={form.deliveryAddress1} onChange={e => s("deliveryAddress1", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Address 2</label><input type="text" value={form.deliveryAddress2} onChange={e => s("deliveryAddress2", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Town / Area</label><input type="text" value={form.deliveryArea} onChange={e => s("deliveryArea", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Contact Name</label><input type="text" value={form.deliveryContact} onChange={e => s("deliveryContact", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Phone</label><input type="text" value={form.deliveryPhone} onChange={e => s("deliveryPhone", e.target.value)} className={inp} /></div>
                <div><label className={lbl}>Delivery Notes</label><textarea value={form.deliveryNotes} onChange={e => s("deliveryNotes", e.target.value)} rows={2} className={inp + " resize-none"} /></div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Cost</h3>
                <div>
                  <label className={lbl}>Driver</label>
                  <select value={form.driverId} onChange={e => handleDriverChange(e.target.value)} className={inp}>
                    <option value="">— Unassigned —</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (£{(jobType === 0 ? d.costPerMile : jobType === 1 ? d.costPerMileWeekends : d.costPerMileOutOfHours).toFixed(2)}/mi)
                      </option>
                    ))}
                  </select>
                  {drivers.length === 0 && <p className="text-xs text-amber-600 mt-1">No drivers with {jobTypeLabel} rates set</p>}
                </div>
                <div>
                  <label className={lbl}>Driver Cost (£)</label>
                  <input type="number" step="0.01" min="0" value={form.driverCost} onChange={e => s("driverCost", e.target.value)} className={inp} />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <label className={lbl}>Second Man (Subcontractor)</label>
                  <select value={form.secondManId} onChange={e => s("secondManId", e.target.value)} className={inp}>
                    <option value="">— None —</option>
                    {subcontractors.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (£{(jobType === 0 ? d.costPerMile : jobType === 1 ? d.costPerMileWeekends : d.costPerMileOutOfHours).toFixed(2)}/mi)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Second Man Cost (£)</label>
                  <input type="number" step="0.01" min="0" value={form.extraCost} onChange={e => s("extraCost", e.target.value)} className={inp} />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <label className={lbl}>CX Driver</label>
                  <select value={form.cxDriverId} onChange={e => s("cxDriverId", e.target.value)} className={inp}>
                    <option value="">— None —</option>
                    {cxDrivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (£{(jobType === 0 ? d.costPerMile : jobType === 1 ? d.costPerMileWeekends : d.costPerMileOutOfHours).toFixed(2)}/mi)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>CX Driver Cost (£)</label>
                  <input type="number" step="0.01" min="0" value={form.cxDriverCost} onChange={e => s("cxDriverCost", e.target.value)} className={inp} />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <label className={lbl}>Extra Charge to Customer (£)</label>
                  <input type="number" step="0.01" min="0" value={form.extraCost2} onChange={e => s("extraCost2", e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Extra Charge Label</label>
                  <input type="text" value={form.extraCost2Label} onChange={e => s("extraCost2Label", e.target.value)} className={inp} placeholder="e.g. Waiting time" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Notes (Driver Visible)</h3>
                <textarea value={form.jobNotes} onChange={e => s("jobNotes", e.target.value)} rows={3} className={inp + " resize-none"} placeholder="Notes visible to driver" />
              </div>

              {storageUnits.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Temperature Units</h3>
                  <div>
                    <label className={lbl}>Chill Unit</label>
                    <select value={form.chillUnitId} onChange={e => s("chillUnitId", e.target.value)} className={inp}>
                      <option value="">None</option>
                      {storageUnits.filter((u: any) => !u.unitType || u.unitType === "chill").map((u: any) => (
                        <option key={u.id} value={u.id}>{u.unitNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ambient Unit</label>
                    <select value={form.ambientUnitId} onChange={e => s("ambientUnitId", e.target.value)} className={inp}>
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

          {/* Sticky save bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 mt-6 -mx-6 px-6 py-4 flex items-center justify-between">
            <button type="button" onClick={onBack} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-70">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Page controller ───────────────────────────────────────────────────────
export default function NewBookingPage() {
  const [step, setStep] = useState<"customer" | "jobtype" | "form">("customer");
  const [customer, setCustomer] = useState<any>(null);
  const [jobType, setJobType] = useState<number>(0);

  if (step === "customer") return <CustomerSearch onSelect={c => { setCustomer(c); setStep("jobtype"); }} />;
  if (step === "jobtype") return <JobTypeSelect customer={customer} onSelect={jt => { setJobType(jt); setStep("form"); }} />;
  return <BookingForm customer={customer} jobType={jobType} onBack={() => setStep("jobtype")} />;
}
