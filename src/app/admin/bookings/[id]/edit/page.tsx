"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Plus, ExternalLink, RefreshCw, Thermometer, MapPin, CheckCircle } from "lucide-react";
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
    <div className="flex items-center gap-2 px-4 py-3 text-slate-100 text-xs font-semibold uppercase tracking-wider bg-slate-700 border-b border-slate-600">
      <span className="text-base">{icon}</span> {label}
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

function PostcodeSearch({ postcode, country, onChangePostcode, onChangeCountry, onApply, placeholder }: {
  postcode: string; country: string;
  onChangePostcode: (v: string) => void; onChangeCountry: (v: string) => void;
  onApply: (r: any) => void; placeholder?: string;
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

  function selectAddress(r: any) { onApply(r); onChangePostcode(r.postcode); setResults([]); setSearched(false); }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input type="text" value={postcode} onChange={e => search(e.target.value)}
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
  const [transferDriverId, setTransferDriverId] = useState("");

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
      });
      setLoadingBooking(false);
    });
  }, [id]);

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
        body: JSON.stringify({ ...unit, currentDriverId: driverId || null, trackable: driverId ? 1 : 0 }),
      });
      const updated = await fetch("/api/storage").then(r => r.json());
      setAllStorageUnits(updated);
      toast.success(driverId ? "Unit assigned" : "Unit unassigned");
    } catch { toast.error("Failed to assign unit"); } finally { setAssigningUnit(null); }
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
              <h1 className="text-white font-bold text-base tracking-tight">Edit Job — {customer?.name}</h1>
              <p className="text-blue-300 text-xs mt-0.5">{customer?.accountNumber}</p>
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Row 1: Customer info + PO */}
          <div className="grid grid-cols-2 gap-4">
            <div className={panel}>
              <SHead color="bg-blue-700" icon="👤" label="Customer" />
              <div className="p-4">
                <div className="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="flex-1 text-sm font-semibold text-slate-700">{customer?.name}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">{jtLabel}</span>
                  {customer?.accountNumber && <span className="text-xs text-slate-400 self-center">{customer.accountNumber}</span>}
                </div>
              </div>
            </div>
            <div className={panel}>
              <SHead color="bg-blue-700" icon="📋" label="Purchase Order" />
              <div className="p-4 grid grid-cols-2 gap-3">
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
                    <input type="time" value={f.collectionTime || ""} onChange={e => s("collectionTime", e.target.value)} className={inp} />
                  </div>
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-orange-500" icon="📍" label="Collection Details" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch postcode={f.collectionPostcode || ""} country={f.collectionCountry || "UK"}
                    onChangePostcode={v => s("collectionPostcode", v)} onChangeCountry={v => s("collectionCountry", v)}
                    onApply={r => { s("collectionAddress1", r.line1); s("collectionAddress2", r.line2 || ""); s("collectionArea", r.city); s("collectionPostcode", r.postcode); }} />
                  <input type="text" value={f.collectionName || ""} onChange={e => s("collectionName", e.target.value)} placeholder="Business / Place Name" className={inp} />
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
                        const fuelPct = pct ? parseFloat(pct) || 0 : 0;
                        if (fuelPct > 0) cp = cp * (1 + fuelPct / 100);
                        setF(p => ({ ...p, fuelSurchargePercent: pct, customerPrice: cp.toFixed(2) }));
                      } else { s("fuelSurchargePercent", pct); }
                    }} className={inp}>
                      <option value="">None</option>
                      {fuelSurcharges.map((fs: any) => (
                        <option key={fs.id} value={String(fs.percentage)}>{fs.percentage}% (diesel &gt; £{fs.price.toFixed(2)}/litre)</option>
                      ))}
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
                    <Toggle checked={!!f.hideTrackingTemperature} onChange={v => s("hideTrackingTemperature", v)} label="Hide Temp" />
                    <Toggle checked={!!f.hideTrackingMap} onChange={v => s("hideTrackingMap", v)} label="Hide Map" />
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
                    <input type="time" value={f.deliveryTime || ""} onChange={e => s("deliveryTime", e.target.value)} className={inp} />
                  </div>
                </div>
              </div>
              <div className={panel}>
                <SHead color="bg-teal-600" icon="🏭" label="Delivery Address" />
                <div className="p-4 space-y-2">
                  <PostcodeSearch postcode={f.deliveryPostcode || ""} country={f.deliveryCountry || "UK"}
                    onChangePostcode={v => s("deliveryPostcode", v)} onChangeCountry={v => s("deliveryCountry", v)}
                    onApply={r => { s("deliveryAddress1", r.line1); s("deliveryAddress2", r.line2 || ""); s("deliveryArea", r.city); s("deliveryPostcode", r.postcode); }} />
                  <input type="text" value={f.deliveryName || ""} onChange={e => s("deliveryName", e.target.value)} placeholder="Business / Place Name" className={inp} />
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
                        setF(p => ({ ...p, driverId: id, driverCost: dr && miles ? (miles * dr[driverRateKey]).toFixed(2) : p.driverCost }));
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-700 font-semibold w-14 shrink-0">🧊 Chill</span>
                      <select value={f.chillUnitId || ""} onChange={e => s("chillUnitId", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— None —</option>
                        {allStorageUnits.map((u: any) => (
                          <option key={u.id} value={u.id} disabled={!!u.currentDriverId && u.currentDriverId !== activeDriverId}>
                            {u.unitNumber}{u.unitType ? ` (${u.unitType})` : ""}{u.currentDriverId && u.currentDriverId !== activeDriverId ? ` (in use)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 font-semibold w-14 shrink-0">🌡 Ambient</span>
                      <select value={f.ambientUnitId || ""} onChange={e => s("ambientUnitId", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— None —</option>
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
                      <input type="time" value={f.podTime || ""} onChange={e => s("podTime", e.target.value)} className={inp} />
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
                <button type="button" onClick={() => setVias(prev => [...prev.slice(0, 5), { viaType: "Via", name: "", postcode: "", address1: "", address2: "", area: "", contact: "", phone: "", notes: "", viaDate: today, viaTime: "", collectedOrders: [] }])} disabled={vias.length >= 6}
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
                        <input type="time" value={via.viaTime || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, viaTime: e.target.value } : x))}
                          className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <button type="button" onClick={() => setVias(prev => prev.filter((_, idx) => idx !== i))}
                          className="ml-auto text-slate-400 hover:text-rose-600 text-lg font-bold leading-none">&times;</button>
                      </div>
                      <PostcodeSearch postcode={via.postcode || ""} country="UK"
                        onChangePostcode={v => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, postcode: v.toUpperCase() } : x))}
                        onChangeCountry={() => {}}
                        onApply={r => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, address1: r.line1, address2: r.line2 || "", area: r.city, postcode: r.postcode } : x))}
                        placeholder="Postcode lookup..." />
                      <input type="text" value={via.name || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Business / Place Name" className={inp} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={via.address1 || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, address1: e.target.value } : x))} placeholder="Address 1" className={inp} />
                        <input type="text" value={via.area || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, area: e.target.value } : x))} placeholder="Town / Area" className={inp} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="text" value={via.contact || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, contact: e.target.value } : x))} placeholder="Contact" className={inp} />
                        <input type="text" value={via.phone || ""} onChange={e => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} placeholder="Phone" className={inp} />
                      </div>
                      {via.signedBy && (
                        <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">✓ POD: {via.signedBy}{via.podDate ? ` · ${via.podDate}` : ""}</div>
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
                                    (order.type || "Chill") === t ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}>{t}</button>
                              ))}
                            </div>
                            <button type="button" onClick={() => setVias(prev => prev.map((x, idx) => idx === i ? { ...x, collectedOrders: x.collectedOrders.filter((_: any, oIdx: number) => oIdx !== oi) } : x))}
                              className="text-slate-400 hover:text-rose-600 font-bold leading-none">&times;</button>
                          </div>
                        ))}
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
              {activeDriverId && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Transfer units to another driver:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={transferDriverId} onChange={e => setTransferDriverId(e.target.value)}
                      className="flex-1 min-w-48 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Select driver to transfer to —</option>
                      {[...drivers, ...subcons, ...cxDrivers].filter((d: any) => d.id !== activeDriverId).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.driverType})</option>
                      ))}
                    </select>
                    <button type="button" disabled={!transferDriverId || assigningUnit !== null} onClick={async () => {
                      const unitIds = allStorageUnits.filter((u: any) => u.currentDriverId === activeDriverId).map((u: any) => u.id);
                      if (!unitIds.length) { toast.error("No units assigned to current driver"); return; }
                      setAssigningUnit("transfer");
                      try { for (const uid of unitIds) await assignUnit(uid, transferDriverId); toast.success("Units transferred"); setTransferDriverId(""); }
                      finally { setAssigningUnit(null); }
                    }} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
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
