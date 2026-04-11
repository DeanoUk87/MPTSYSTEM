"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, RefreshCw, Plus, ExternalLink, Thermometer, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";

// ── Helpers ────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

const inp = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors";
const inp2 = "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono transition-colors";
const inpReq = "w-full px-3 py-2 border-2 border-rose-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50 transition-colors";
const panel = "bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden";
const costInp = "w-24 px-2 py-2 border border-slate-200 rounded-xl text-sm text-right text-red-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

function SHead({ color, icon, label }: { color: string; icon: string; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 text-white text-xs font-bold uppercase tracking-widest ${color}`}>
      <span className="text-base">{icon}</span> {label}
    </div>
  );
}

// Toggle pill button (replaces checkbox)
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
        checked
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {checked ? "✓ " : ""}{label}
    </button>
  );
}

// Postcode search — shows full address list dropdown, country hidden but preserved
function PostcodeSearch({ postcode, country, onChangePostcode, onChangeCountry, onApply, placeholder }: {
  postcode: string;
  country: string;
  onChangePostcode: (v: string) => void;
  onChangeCountry: (v: string) => void;
  onApply: (r: any) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(v: string) {
    onChangePostcode(v.toUpperCase());
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

  function selectAddress(r: any) {
    onApply(r);
    onChangePostcode(r.postcode);
    setResults([]);
    setSearched(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type="text"
          value={postcode}
          onChange={e => search(e.target.value)}
          placeholder={placeholder || "Enter postcode to find address..."}
          className={inp + " pr-8 uppercase font-mono"}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
        {results.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-52 overflow-y-auto">
            {results.map((r: any, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => selectAddress(r)}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
              >
                {r.fallback ? (
                  <>
                    <span className="font-semibold text-slate-500 italic">Town/area only — enter full address manually</span>
                    <span className="ml-2 text-blue-600 font-mono font-semibold">{r.postcode}</span>
                    <span className="text-slate-500"> · {r.label}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800">{r.line1}</span>
                    {r.line2 && <span className="text-slate-500">, {r.line2}</span>}
                    <span className="text-slate-400">, {r.city} </span>
                    <span className="text-blue-600 font-mono font-semibold">{r.postcode}</span>
                  </>
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
      {/* Country field — hidden, preserved in state */}
      <input type="hidden" value={country} onChange={e => onChangeCountry(e.target.value)} />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-1">New Booking</h2>
        <p className="text-sm text-slate-500 mb-6">Search for a customer to get started</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Type customer name or account number..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
        </div>
        {results.length > 0 && (
          <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-lg">
            {results.map((c: any) => (
              <button key={c.id} onClick={() => onSelect(c)} className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <p className="text-xs text-slate-400 mb-1">New booking for</p>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{customer.name}</h2>
        <div className="space-y-3">
          {[
            { value: 0, label: "Normal", desc: "Standard weekday rate", color: "border-blue-300 hover:bg-blue-50 hover:border-blue-400" },
            { value: 1, label: "Weekend / Bank Holiday", desc: "Weekend rate", color: "border-amber-300 hover:bg-amber-50 hover:border-amber-400" },
            { value: 2, label: "Out of Hours", desc: "Evening/overnight rate", color: "border-purple-300 hover:bg-purple-50 hover:border-purple-400" },
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
  const [allStorageUnits, setAllStorageUnits] = useState<any[]>([]);
  const [fuelSurcharges, setFuelSurcharges] = useState<any[]>([]);
  const [vehicleRates, setVehicleRates] = useState<any[]>([]);
  const [vehicleRatesMap, setVehicleRatesMap] = useState<Record<string, number>>({});
  const [routeInfo, setRouteInfo] = useState<{ miles: number; duration: string } | null>(null);
  const [assigningUnit, setAssigningUnit] = useState<string | null>(null);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [transferDriverSearch, setTransferDriverSearch] = useState("");
  const [transferDriverId, setTransferDriverId] = useState("");

  const jt = jobType;
  const rateKey = jt === 0 ? "ratePerMile" : jt === 1 ? "ratePerMileWeekends" : "ratePerMileOutOfHours";
  const driverRateKey = jt === 0 ? "costPerMile" : jt === 1 ? "costPerMileWeekends" : "costPerMileOutOfHours";
  const jtLabel = ["Normal", "Weekend / BH", "Out of Hours"][jt];

  const [f, setF] = useState<Record<string, any>>({
    vehicleId: "", miles: "", customerPrice: "", manualAmount: "", manualDesc: "",
    fuelSurchargePercent: "", extraCost2: "", extraCost2Label: "",
    avoidTolls: false, waitAndReturn: false, deadMilesEnabled: false, deadMiles: "",
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
      fetch("/api/storage").then(r => r.json()),
      fetch("/api/fuel-surcharges").then(r => r.json()),
    ]).then(([v, d, sc, cx, bt, su, fs]) => {
      setVehicles(v);
      setDrivers(d.filter((dr: any) => dr[driverRateKey] > 0));
      setSubcons(sc.filter((dr: any) => dr[driverRateKey] > 0));
      setCxDrivers(cx.filter((dr: any) => dr[driverRateKey] > 0));
      setBookingTypes(bt);
      setAllStorageUnits(su);
      setFuelSurcharges(fs);
    });
  }, [jt]);

  // Pre-load all vehicle rates for this customer so we can show rates in the dropdown
  useEffect(() => {
    if (!vehicles.length) return;
    Promise.all(
      vehicles.map(v =>
        fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${v.id}`)
          .then(r => r.json())
          .then(rates => ({ vehicleId: v.id, rate: rates.length > 0 ? rates[0][rateKey] : null, rates }))
      )
    ).then(results => {
      const map: Record<string, number> = {};
      results.forEach(({ vehicleId, rate }) => { if (rate !== null) map[vehicleId] = rate; });
      setVehicleRatesMap(map);
    });
  }, [vehicles.length, customer.id]);

  // When vehicle selected, load its rates, update map with fresh data, recalc price
  useEffect(() => {
    if (!f.vehicleId) { setVehicleRates([]); return; }
    fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`)
      .then(r => r.json()).then(rates => {
        setVehicleRates(rates);
        // Keep vehicleRatesMap fresh for the selected vehicle so the dropdown shows the correct rate
        if (rates.length > 0) {
          setVehicleRatesMap(prev => ({ ...prev, [f.vehicleId]: rates[0][rateKey] ?? 0 }));
        }
        if (rates.length > 0 && f.miles) {
          s("customerPrice", (Math.round(parseFloat(f.miles)) * rates[0][rateKey]).toFixed(2));
        }
      });
  }, [f.vehicleId]);

  // Recalc all prices when miles change manually
  useEffect(() => {
    const miles = Math.round(parseFloat(f.miles) || 0);
    if (!miles) return;
    setF(p => {
      const next = { ...p };
      const fuelPct = p.fuelSurchargePercent ? parseFloat(p.fuelSurchargePercent) || 0 : 0;
      if (vehicleRates.length > 0) {
        let cp = miles * vehicleRates[0][rateKey];
        if (fuelPct > 0) cp = cp * (1 + fuelPct / 100);
        next.customerPrice = cp.toFixed(2);
      }
      if (p.driverId) {
        const dr = drivers.find((d: any) => d.id === p.driverId);
        if (dr) next.driverCost = (miles * dr[driverRateKey]).toFixed(2);
      }
      if (p.secondManId) {
        const dr = subcons.find((d: any) => d.id === p.secondManId);
        if (dr) next.extraCost = (miles * dr[driverRateKey]).toFixed(2);
      }
      if (p.cxDriverId) {
        const dr = cxDrivers.find((d: any) => d.id === p.cxDriverId);
        if (dr) next.cxDriverCost = (miles * dr[driverRateKey]).toFixed(2);
      }
      return next;
    });
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

  // Handle driver change — update cost or clear if deselected
  function handleDriverChange(driverId: string) {
    if (!driverId) {
      setF(p => ({ ...p, driverId: "", driverCost: "" }));
      return;
    }
    const miles = Math.round(parseFloat(f.miles) || 0);
    const dr = drivers.find((d: any) => d.id === driverId);
    setF(p => ({
      ...p,
      driverId,
      driverCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.driverCost,
    }));
  }

  // Handle subcon change — update cost or clear if deselected
  function handleSubconChange(subconId: string) {
    if (!subconId) {
      setF(p => ({ ...p, secondManId: "", secondManContactId: "", extraCost: "" }));
      return;
    }
    const miles = Math.round(parseFloat(f.miles) || 0);
    const dr = subcons.find((d: any) => d.id === subconId);
    setF(p => ({
      ...p,
      secondManId: subconId,
      secondManContactId: "",
      extraCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.extraCost,
    }));
  }

  // SubCon contact selection — recalc extraCost from parent subcon's rate
  function handleSubconContactChange(contactId: string) {
    const miles = Math.round(parseFloat(f.miles) || 0);
    const dr = subcons.find((d: any) => d.id === f.secondManId);
    setF(p => ({
      ...p,
      secondManContactId: contactId,
      extraCost: contactId && dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.extraCost,
    }));
  }

  // CX contact selection — recalc cxDriverCost from parent CX driver's rate
  function handleCxContactChange(contactId: string) {
    const miles = Math.round(parseFloat(f.miles) || 0);
    const dr = cxDrivers.find((d: any) => d.id === f.cxDriverId);
    setF(p => ({
      ...p,
      cxDriverContactId: contactId,
      cxDriverCost: contactId && dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.cxDriverCost,
    }));
  }

  // Handle CX driver change — update cost or clear if deselected
  function handleCxChange(cxId: string) {
    if (!cxId) {
      setF(p => ({ ...p, cxDriverId: "", cxDriverContactId: "", cxDriverCost: "" }));
      return;
    }
    const miles = Math.round(parseFloat(f.miles) || 0);
    const dr = cxDrivers.find((d: any) => d.id === cxId);
    setF(p => ({
      ...p,
      cxDriverId: cxId,
      cxDriverContactId: "",
      cxDriverCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.cxDriverCost,
    }));
  }

  // Assign storage unit to driver
  async function assignUnit(unitId: string, driverId: string) {
    setAssigningUnit(unitId);
    try {
      const unit = allStorageUnits.find(u => u.id === unitId);
      if (!unit) return;
      await fetch(`/api/storage/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...unit,
          currentDriverId: driverId || null,
          trackable: driverId ? 1 : 0,
        }),
      });
      // Refresh storage units
      const updated = await fetch("/api/storage").then(r => r.json());
      setAllStorageUnits(updated);
      toast.success(driverId ? "Unit assigned to driver" : "Unit unassigned");
    } catch { toast.error("Failed to assign unit"); } finally { setAssigningUnit(null); }
  }

  // Init Google Map — retry up to 10x if DOM ref not attached yet
  function initMap() {
    if (googleMapRef.current) return;
    let attempts = 0;
    const tryInit = () => {
      if (!mapRef.current) {
        if (++attempts < 20) setTimeout(tryInit, 200);
        return;
      }
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

  // Central price recalculation — takes final miles and current form state
  function recalcPrices(baseMiles: number, formState: Record<string, any>, newVehicleRates?: any[]) {
    const rates = newVehicleRates ?? vehicleRates;
    const deadMi = formState.deadMilesEnabled && formState.deadMiles ? parseFloat(formState.deadMiles) || 0 : 0;
    const totalMiles = baseMiles + deadMi;
    const billMiles = formState.waitAndReturn ? totalMiles * 2 : totalMiles;

    let customerPrice = 0;
    if (rates.length > 0) customerPrice = billMiles * rates[0][rateKey];

    // Add fuel surcharge if selected
    const fuelPct = formState.fuelSurchargePercent ? parseFloat(formState.fuelSurchargePercent) || 0 : 0;
    if (fuelPct > 0) customerPrice = customerPrice * (1 + fuelPct / 100);

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
        const rawMiles = Math.round(data.miles);
        setRouteInfo({ miles: rawMiles, duration: data.duration });
        const { updates } = recalcPrices(rawMiles, f);
        setF(p => ({ ...p, ...updates }));
      }
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
    if (!f.purchaseOrder) { toast.error("Purchase Order is required"); return; }
    if (!f.bookedBy) { toast.error("Booked By is required"); return; }
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
      // Remove form-only fields not in the Booking schema
      delete payload.secondManContactId;
      delete payload.cxDriverContactId;
      payload.deadMileageStatus = f.deadMilesEnabled && f.deadMiles ? String(parseFloat(f.deadMiles) || 0) : null;
      delete payload.deadMilesEnabled;
      delete payload.deadMiles;
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
  const milesNum = Math.round(parseFloat(f.miles) || 0);
  const profit = ((parseFloat(f.customerPrice) || 0) + (parseFloat(f.extraCost2) || 0))
    - ((parseFloat(f.driverCost) || 0) + (parseFloat(f.extraCost) || 0) + (parseFloat(f.cxDriverCost) || 0));

  // Storage units for the active driver (main driver, subcon, or CX driver)
  const activeDriverId = f.driverId || f.secondManId || f.cxDriverId;
  const availableStorageUnits = allStorageUnits.filter((u: any) =>
    !u.currentDriverId || u.currentDriverId === activeDriverId
  );
  const assignedUnits = allStorageUnits.filter((u: any) => u.currentDriverId === activeDriverId && activeDriverId);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCxhsy1iGT_Aj5JnnyQMLOUVijsLm84Vd4&libraries=places`}
        strategy="lazyOnload" onLoad={initMap}
      />
      <div className="flex-1 bg-slate-100 min-h-screen">
        {/* Page header */}
        <div className="bg-gradient-to-r from-[#1a3a5c] to-[#1e4976] px-5 py-3 flex items-center justify-between shadow-lg">
          <div>
            <h1 className="text-white font-bold text-base tracking-tight">Create Job — {customer.name}</h1>
            <p className="text-blue-300 text-xs mt-0.5">{jtLabel}</p>
          </div>
          <button type="button" onClick={(e) => handleSubmit(e as any)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold text-sm disabled:opacity-70 shadow-md transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓"}
            {saving ? "Saving..." : "Save Record"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* ── ROW 1: Customer | Purchase Order ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className={panel}>
              <SHead color="bg-blue-700" icon="👤" label="Customer" />
              <div className="p-4">
                <div className="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="flex-1 text-sm font-semibold text-slate-700">{customer.name}</span>
                  <button type="button" onClick={onBack} className="text-xs text-blue-500 hover:text-blue-700 font-medium underline shrink-0">Change</button>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">{jtLabel}</span>
                  {customer.accountNumber && <span className="text-xs text-slate-400 self-center">{customer.accountNumber}</span>}
                </div>
              </div>
            </div>

            <div className={panel}>
              <SHead color="bg-blue-700" icon="📋" label="Purchase Order" />
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Order <span className="text-rose-500">*</span></label>
                  <input type="text" value={f.purchaseOrder} onChange={e => s("purchaseOrder", e.target.value)}
                    className={f.purchaseOrder ? inp : inpReq} placeholder="PO Number" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Booked By <span className="text-rose-500">*</span></label>
                  <input type="text" value={f.bookedBy} onChange={e => s("bookedBy", e.target.value)}
                    className={f.bookedBy ? inp : inpReq} placeholder="Name" required />
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: 3-column main ── */}
          <div className="grid grid-cols-3 gap-4 items-start">

            {/* ══ COLUMN 1: Collection ══ */}
            <div className="space-y-4">
              {/* Collection Date/Time */}
              <div className={panel}>
                <SHead color="bg-blue-700" icon="📅" label="Collection Date / Time" />
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Date <span className="text-rose-500">*</span></label>
                    <input type="date" value={f.collectionDate} onChange={e => s("collectionDate", e.target.value)} className={inp} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Time</label>
                    <input type="time" value={f.collectionTime} onChange={e => s("collectionTime", e.target.value)} className={inp} />
                  </div>
                </div>
              </div>

              {/* Collection Details */}
              <div className={panel}>
                <SHead color="bg-orange-500" icon="📍" label="Collection Details" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch
                    postcode={f.collectionPostcode}
                    country={f.collectionCountry}
                    onChangePostcode={v => s("collectionPostcode", v)}
                    onChangeCountry={v => s("collectionCountry", v)}
                    onApply={r => {
                      s("collectionAddress1", r.line1);
                      s("collectionAddress2", r.line2 || "");
                      s("collectionArea", r.city);
                      s("collectionPostcode", r.postcode);
                      s("collectionCountry", "UK");
                    }}
                  />
                  <input type="text" value={f.collectionName} onChange={e => s("collectionName", e.target.value)} placeholder="Business / Place Name" className={inp} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionAddress1} onChange={e => s("collectionAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <input type="text" value={f.collectionAddress2} onChange={e => s("collectionAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionArea} onChange={e => s("collectionArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    <input type="text" value={f.collectionPostcode} onChange={e => s("collectionPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.collectionContact} onChange={e => s("collectionContact", e.target.value)} placeholder="Contact Name" className={inp} />
                    <input type="text" value={f.collectionPhone} onChange={e => s("collectionPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                  </div>
                  <textarea value={f.collectionNotes} onChange={e => s("collectionNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                </div>
              </div>

              {/* POD Upload + Office Notes */}
              <div className={panel}>
                <SHead color="bg-teal-600" icon="📎" label="POD Upload" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white hover:bg-slate-50 cursor-pointer font-medium transition-colors">
                      Choose file
                      <input type="file" className="hidden" accept="image/*,.pdf" />
                    </label>
                    <span className="text-xs text-slate-400">No file chosen</span>
                  </div>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 font-medium transition-colors">
                    <Plus className="w-3 h-3" /> Add file
                  </button>
                  <textarea value={f.officeNotes} onChange={e => s("officeNotes", e.target.value)}
                    placeholder="Office Notes" rows={3} className={inp + " resize-none"} />
                </div>
              </div>
            </div>

            {/* ══ COLUMN 2: Mileage Calculator + Profit ══ */}
            <div className="space-y-4">
              <div className={panel}>
                <SHead color="bg-purple-600" icon="🗺️" label="Mileage Calculator" />

                {/* Map always visible */}
                <div ref={el => { (mapRef as any).current = el; }} style={{ height: "220px" }} className="w-full border-b border-slate-100" />

                <div className="p-4 space-y-3">
                  {/* Vehicle — shows rate for each vehicle upfront */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Vehicle</label>
                    <select value={f.vehicleId} onChange={e => s("vehicleId", e.target.value)} className={inp}>
                      <option value="">— Select Vehicle —</option>
                      {vehicles.map((v: any) => {
                        const rate = vehicleRatesMap[v.id];
                        return (
                          <option key={v.id} value={v.id}>
                            {v.name}{rate !== undefined ? ` — £${rate.toFixed(2)}/mi` : " — no rate"}
                          </option>
                        );
                      })}
                    </select>
                    {f.vehicleId && vehicleRates.length === 0 && (
                      <div className="mt-1.5 flex items-center justify-between text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <span>No rate set for this customer</span>
                        <a href={`/admin/customers/${customer.id}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 underline font-semibold">
                          Add Rate <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {f.vehicleId && currentRate && (
                      <div className="mt-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-medium">
                        {jtLabel} rate: £{currentRate.toFixed(4)}/mi
                      </div>
                    )}
                  </div>

                  {/* Refresh + Add Rates */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => {
                      if (f.vehicleId) {
                        fetch(`/api/vehicle-rates?customerId=${customer.id}&vehicleId=${f.vehicleId}`)
                          .then(r => r.json()).then(rates => {
                            setVehicleRates(rates);
                            if (rates.length > 0) {
                              setVehicleRatesMap(prev => ({ ...prev, [f.vehicleId]: rates[0][rateKey] ?? 0 }));
                            }
                          });
                      }
                    }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs hover:bg-blue-600 font-medium transition-colors shadow-sm">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <a href={`/admin/customers/${customer.id}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs hover:bg-emerald-600 font-medium transition-colors shadow-sm">
                      <Plus className="w-3 h-3" /> Add Rates
                    </a>
                  </div>

                  {/* Get Mileage */}
                  <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm disabled:opacity-60 transition-colors shadow-md">
                    {calcMiles ? <Loader2 className="w-4 h-4 animate-spin" /> : "🚩"}
                    Get Mileage and Costs
                  </button>

                  {/* Miles + duration */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-10 shrink-0">Miles</label>
                    <input type="number" min="0" value={f.miles}
                      onChange={e => s("miles", String(Math.round(parseFloat(e.target.value) || 0)))}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    {routeInfo && <span className="text-xs text-amber-600 font-semibold">⏱ {routeInfo.duration}</span>}
                  </div>

                  {/* Quote */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-16 shrink-0">Quote (£)</label>
                    <input type="number" step="0.01" min="0" value={f.customerPrice}
                      onChange={e => s("customerPrice", e.target.value)}
                      className={inp + " font-bold"} placeholder="0.00" />
                  </div>

                  {/* Fuel surcharge */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-16 shrink-0">Fuel Surcharge</label>
                    <select value={f.fuelSurchargePercent} onChange={e => {
                      const pct = e.target.value;
                      const miles = Math.round(parseFloat(f.miles) || 0);
                      if (miles && vehicleRates.length > 0) {
                        let cp = miles * vehicleRates[0][rateKey];
                        const fuelPct = pct ? parseFloat(pct) || 0 : 0;
                        if (fuelPct > 0) cp = cp * (1 + fuelPct / 100);
                        setF(p => ({ ...p, fuelSurchargePercent: pct, customerPrice: cp.toFixed(2) }));
                      } else {
                        s("fuelSurchargePercent", pct);
                      }
                    }} className={inp}>
                      <option value="">None</option>
                      {fuelSurcharges.map((fs: any) => (
                        <option key={fs.id} value={String(fs.percentage)}>{fs.percentage}% (diesel &gt; £{fs.price.toFixed(2)}/litre)</option>
                      ))}
                    </select>
                  </div>

                  {/* Items + Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">No. Items <span className="text-rose-500">*</span></label>
                      <input type="number" min="1" value={f.numberOfItems} onChange={e => s("numberOfItems", e.target.value)}
                        className={f.numberOfItems ? inp : inpReq} placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Weight (kg) <span className="text-rose-500">*</span></label>
                      <input type="number" step="0.1" min="0" value={f.weight} onChange={e => s("weight", e.target.value)}
                        className={f.weight ? inp : inpReq} placeholder="e.g. 10" />
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
                    <input type="number" step="0.01" value={f.manualAmount} onChange={e => s("manualAmount", e.target.value)} placeholder="Amount £" className={inp} />
                  </div>

                  {/* Toggle pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Toggle
                      checked={f.avoidTolls}
                      onChange={v => {
                        setF(p => ({ ...p, avoidTolls: v }));
                        // Re-fetch route with new tolls setting if we have postcodes
                        if (f.collectionPostcode && f.deliveryPostcode && googleMapRef.current) {
                          const g = (window as any).google;
                          if (g) {
                            new g.maps.DirectionsService().route({
                              origin: f.collectionPostcode, destination: f.deliveryPostcode,
                              travelMode: g.maps.TravelMode.DRIVING, avoidTolls: v,
                            }, (result: any, status: string) => {
                              if (status === "OK") directionsRendererRef.current?.setDirections(result);
                            });
                          }
                        }
                      }}
                      label="Avoid Tolls"
                    />
                    <Toggle
                      checked={f.waitAndReturn}
                      onChange={v => {
                        // Wait & Return: re-run recalc with current base miles
                        const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                        if (rawMiles) {
                          const newState = { ...f, waitAndReturn: v };
                          const { updates } = recalcPrices(rawMiles, newState);
                          setF(p => ({ ...p, waitAndReturn: v, ...updates }));
                        } else {
                          s("waitAndReturn", v);
                        }
                      }}
                      label="Wait & Return"
                    />
                    <Toggle
                      checked={!!f.deadMilesEnabled}
                      onChange={v => {
                        const deadMi = v ? (customer.deadMileage || 15) : 0;
                        const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                        if (rawMiles) {
                          const newState = { ...f, deadMilesEnabled: v, deadMiles: v ? String(deadMi) : "", waitAndReturn: f.waitAndReturn };
                          const { updates } = recalcPrices(rawMiles, newState);
                          setF(p => ({ ...p, deadMilesEnabled: v, deadMiles: v ? String(deadMi) : "", ...updates }));
                        } else {
                          setF(p => ({ ...p, deadMilesEnabled: v, deadMiles: v ? String(customer.deadMileage || 15) : "" }));
                        }
                      }}
                      label="Dead Miles"
                    />
                    {f.deadMilesEnabled && (
                      <input
                        type="number" min="0" value={f.deadMiles}
                        onChange={e => {
                          const dm = e.target.value;
                          const rawMiles = routeInfo?.miles ?? Math.round(parseFloat(f.miles) || 0);
                          if (rawMiles) {
                            const newState = { ...f, deadMiles: dm };
                            const { updates } = recalcPrices(rawMiles, newState);
                            setF(p => ({ ...p, deadMiles: dm, ...updates }));
                          } else {
                            s("deadMiles", dm);
                          }
                        }}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="15"
                      />
                    )}
                    <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-xs font-semibold transition-colors disabled:opacity-60">
                      Apply New Mileage
                    </button>
                  </div>
                </div>
              </div>

              {/* Profit & Notes */}
              <div className={panel}>
                <SHead color="bg-emerald-600" icon="💰" label="Profit &amp; Notes" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-600 shrink-0">PROFIT £</label>
                    <div className={`flex-1 px-3 py-2 border rounded-xl text-sm font-bold text-center ${profit >= 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}>
                      {profit.toFixed(2)}
                    </div>
                  </div>
                  <textarea value={f.jobNotes} onChange={e => s("jobNotes", e.target.value)}
                    placeholder="Job Notes" rows={5} className={inp + " resize-none"} />
                </div>
              </div>
            </div>

            {/* ══ COLUMN 3: Delivery + Driver Cost ══ */}
            <div className="space-y-4">
              {/* Delivery Date/Time */}
              <div className={panel}>
                <SHead color="bg-blue-700" icon="📅" label="Delivery Date / Time" />
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Date <span className="text-rose-500">*</span></label>
                    <input type="date" value={f.deliveryDate} onChange={e => s("deliveryDate", e.target.value)} className={inp} required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Time</label>
                    <input type="time" value={f.deliveryTime} onChange={e => s("deliveryTime", e.target.value)} className={inp} />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className={panel}>
                <SHead color="bg-teal-600" icon="🏭" label="Delivery Address" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch
                    postcode={f.deliveryPostcode}
                    country={f.deliveryCountry}
                    onChangePostcode={v => s("deliveryPostcode", v)}
                    onChangeCountry={v => s("deliveryCountry", v)}
                    onApply={r => {
                      s("deliveryAddress1", r.line1);
                      s("deliveryAddress2", r.line2 || "");
                      s("deliveryArea", r.city);
                      s("deliveryPostcode", r.postcode);
                      s("deliveryCountry", "UK");
                    }}
                  />
                  <input type="text" value={f.deliveryName} onChange={e => s("deliveryName", e.target.value)} placeholder="Business / Place Name" className={inp} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryAddress1} onChange={e => s("deliveryAddress1", e.target.value)} placeholder="Address 1" className={inp} />
                    <input type="text" value={f.deliveryAddress2} onChange={e => s("deliveryAddress2", e.target.value)} placeholder="Address 2" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryArea} onChange={e => s("deliveryArea", e.target.value)} placeholder="Town / Area" className={inp} />
                    <input type="text" value={f.deliveryPostcode} onChange={e => s("deliveryPostcode", e.target.value.toUpperCase())} placeholder="Postcode" className={inp2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={f.deliveryContact} onChange={e => s("deliveryContact", e.target.value)} placeholder="Contact Name" className={inp} />
                    <input type="text" value={f.deliveryPhone} onChange={e => s("deliveryPhone", e.target.value)} placeholder="Tel Number" className={inp} />
                  </div>
                  <textarea value={f.deliveryNotes} onChange={e => s("deliveryNotes", e.target.value)} placeholder="Notes" rows={2} className={inp + " resize-none"} />
                </div>
              </div>

              {/* Driver Cost */}
              <div className={panel}>
                <SHead color="bg-red-700" icon="🚘" label="Driver Cost" />
                <div className="p-4 space-y-3">

                  {/* Driver row */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Driver</label>
                    <div className="flex items-center gap-2">
                      <select value={f.driverId} onChange={e => handleDriverChange(e.target.value)} className={inp}>
                        <option value="">— Select Driver —</option>
                        {drivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.driverCost}
                        onChange={e => s("driverCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                  </div>

                  {/* SubCon row */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">SubContractor</label>
                    <div className="flex items-center gap-2">
                      <select value={f.secondManId} onChange={e => handleSubconChange(e.target.value)} className={inp}>
                        <option value="">— Select SubCon —</option>
                        {subcons.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.extraCost}
                        onChange={e => s("extraCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                    {subconContacts.length > 0 && (
                      <div className="mt-1.5">
                        <select value={f.secondManContactId} onChange={e => handleSubconContactChange(e.target.value)} className={inp}>
                          <option value="">— Assign driver under SubCon —</option>
                          {subconContacts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.driverName}{c.vehicleRegistration ? ` · ${c.vehicleRegistration}` : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* CX Driver row */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">CX Driver</label>
                    <div className="flex items-center gap-2">
                      <select value={f.cxDriverId} onChange={e => handleCxChange(e.target.value)} className={inp}>
                        <option value="">— Select CX Driver —</option>
                        {cxDrivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} · £{d[driverRateKey].toFixed(2)}/mi</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400 shrink-0">£</span>
                      <input type="number" step="0.01" min="0" value={f.cxDriverCost}
                        onChange={e => s("cxDriverCost", e.target.value)} className={costInp} placeholder="0.00" />
                    </div>
                    {cxContacts.length > 0 && (
                      <div className="mt-1.5">
                        <select value={f.cxDriverContactId} onChange={e => handleCxContactChange(e.target.value)} className={inp}>
                          <option value="">— Assign driver under CX —</option>
                          {cxContacts.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.driverName}{c.vehicleRegistration ? ` · ${c.vehicleRegistration}` : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Storage unit assignment — compact dropdowns per unit type */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
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
                    {/* Chill unit dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-700 font-semibold w-14 shrink-0">🧊 Chill</span>
                      <select
                        value={f.chillUnitId}
                        onChange={e => s("chillUnitId", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— None —</option>
                        {allStorageUnits.filter((u: any) => u.unitType === "chill").map((u: any) => (
                          <option key={u.id} value={u.id} disabled={!!u.currentDriverId && u.currentDriverId !== activeDriverId}>
                            {u.unitNumber}{u.currentDriverId && u.currentDriverId !== activeDriverId ? ` (in use: ${u.currentDriver?.name || "other"})` : u.currentDriverId === activeDriverId ? " ✓ assigned" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Ambient unit dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 font-semibold w-14 shrink-0">🌡 Ambient</span>
                      <select
                        value={f.ambientUnitId}
                        onChange={e => s("ambientUnitId", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— None —</option>
                        {allStorageUnits.filter((u: any) => u.unitType === "ambient" || u.unitType === "Ambient").map((u: any) => (
                          <option key={u.id} value={u.id} disabled={!!u.currentDriverId && u.currentDriverId !== activeDriverId}>
                            {u.unitNumber}{u.currentDriverId && u.currentDriverId !== activeDriverId ? ` (in use: ${u.currentDriver?.name || "other"})` : u.currentDriverId === activeDriverId ? " ✓ assigned" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom save bar ── */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-md border border-slate-100 px-5 py-3">
            <button type="button" onClick={onBack}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 font-medium transition-colors">
              ← Cancel
            </button>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Miles: <strong className="text-slate-800 text-sm">{milesNum || "—"}</strong></span>
              <span>Quote: <strong className="text-emerald-700 text-sm">£{parseFloat(f.customerPrice || "0").toFixed(2)}</strong></span>
              <span className={profit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                Profit: <strong className="text-sm">£{profit.toFixed(2)}</strong>
              </span>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-70 shadow-md transition-all">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "✓ Save Record"}
            </button>
          </div>
        </form>
      </div>

      {/* ── All Units Modal ── */}
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
                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      isActiveDriver ? "bg-blue-50 border-blue-300" :
                      isAssignedElsewhere ? "bg-slate-50 border-slate-200 opacity-60" :
                      "bg-white border-slate-200"
                    }`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">{u.unitNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${u.unitType === "chill" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                            {u.unitType || "unit"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${u.availability === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {u.availability === "Yes" ? "In Store" : "Out"}
                          </span>
                        </div>
                        {isAssignedElsewhere && <p className="text-slate-400">Driver: {u.currentDriver?.name || "other"}</p>}
                        {isActiveDriver && <p className="text-blue-600 font-medium">✓ Assigned to this driver</p>}
                      </div>
                      {activeDriverId && !isAssignedElsewhere && (
                        <button
                          type="button"
                          onClick={async () => {
                            setAssigningUnit(u.id);
                            await assignUnit(u.id, isActiveDriver ? "" : activeDriverId);
                            setAssigningUnit(null);
                          }}
                          disabled={assigningUnit === u.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isActiveDriver ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {assigningUnit === u.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : isActiveDriver ? "Remove" : "Assign"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Transfer section */}
              {activeDriverId && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Transfer units to another driver:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={transferDriverId}
                      onChange={e => setTransferDriverId(e.target.value)}
                      className="flex-1 min-w-48 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select driver to transfer to —</option>
                      {[...drivers, ...subcons, ...cxDrivers].filter((d: any) => d.id !== activeDriverId).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.driverType})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!transferDriverId || assigningUnit !== null}
                      onClick={async () => {
                        const unitIds = allStorageUnits
                          .filter((u: any) => u.currentDriverId === activeDriverId)
                          .map((u: any) => u.id);
                        if (!unitIds.length) { toast.error("No units assigned to current driver"); return; }
                        setAssigningUnit("transfer");
                        try {
                          for (const uid of unitIds) await assignUnit(uid, transferDriverId);
                          toast.success("Units transferred");
                          setTransferDriverId("");
                        } finally { setAssigningUnit(null); }
                      }}
                      className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {assigningUnit === "transfer" ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Transfer Units"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
