"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

interface SelectOption { id: string; name: string; [k: string]: any; }

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
      {title}
      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function NewBookingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [calcMiles, setCalcMiles] = useState(false);
  const [sections, setSections] = useState({ customer: true, collection: true, delivery: true, pricing: true, drivers: false, units: false });

  // Reference data
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [subcontractors, setSubcontractors] = useState<SelectOption[]>([]);
  const [cxDrivers, setCxDrivers] = useState<SelectOption[]>([]);
  const [bookingTypes, setBookingTypes] = useState<SelectOption[]>([]);
  const [storageUnits, setStorageUnits] = useState<SelectOption[]>([]);
  const [vehicleRates, setVehicleRates] = useState<any[]>([]);

  const [form, setForm] = useState({
    customerId: "", purchaseOrder: "", bookedBy: "", bookingTypeId: "", jobNotes: "", officeNotes: "",
    collectionDate: "", collectionTime: "09:00", collectionName: "", collectionAddress1: "", collectionAddress2: "",
    collectionArea: "", collectionCountry: "UK", collectionPostcode: "", collectionContact: "", collectionPhone: "", collectionNotes: "",
    deliveryDate: "", deliveryTime: "09:00", deliveryName: "", deliveryAddress1: "", deliveryAddress2: "",
    deliveryArea: "", deliveryCountry: "UK", deliveryPostcode: "", deliveryContact: "", deliveryPhone: "", deliveryNotes: "",
    vehicleId: "", miles: "", customerPrice: "", manualAmount: "", manualDesc: "", extraCost2: "", extraCost2Label: "",
    fuelSurchargePercent: "", fuelSurchargeCost: "", weekend: "0", avoidTolls: false,
    driverId: "", driverCost: "", secondManId: "", extraCost: "", cxDriverId: "", cxDriverCost: "",
    chillUnitId: "", ambientUnitId: "", numberOfItems: "", weight: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/vehicles").then(r => r.json()),
      fetch("/api/drivers?type=Driver").then(r => r.json()),
      fetch("/api/drivers?type=SubContractor").then(r => r.json()),
      fetch("/api/drivers?type=CXDriver").then(r => r.json()),
      fetch("/api/booking-types").then(r => r.json()),
      fetch("/api/storage?availability=Yes").then(r => r.json()),
    ]).then(([c, v, d, s, cx, bt, su]) => {
      setCustomers(c); setVehicles(v); setDrivers(d); setSubcontractors(s); setCxDrivers(cx);
      setBookingTypes(bt); setStorageUnits(su);
    });
  }, []);

  // Load vehicle rates when customer + vehicle change
  useEffect(() => {
    if (form.customerId && form.vehicleId) {
      fetch(`/api/vehicle-rates?customerId=${form.customerId}&vehicleId=${form.vehicleId}`)
        .then(r => r.json()).then(rates => {
          setVehicleRates(rates);
          if (rates.length > 0) {
            const rate = rates[0];
            const weekend = parseInt(form.weekend);
            const rateValue = weekend === 1 ? rate.ratePerMileWeekends : weekend === 2 ? rate.ratePerMileOutOfHours : rate.ratePerMile;
            if (form.miles && rateValue) {
              const price = (parseFloat(form.miles) * rateValue).toFixed(2);
              set("customerPrice", price);
            }
          }
        });
    }
  }, [form.customerId, form.vehicleId, form.weekend]);

  // Recalculate price when miles change
  useEffect(() => {
    if (vehicleRates.length > 0 && form.miles) {
      const rate = vehicleRates[0];
      const weekend = parseInt(form.weekend);
      const rateValue = weekend === 1 ? rate.ratePerMileWeekends : weekend === 2 ? rate.ratePerMileOutOfHours : rate.ratePerMile;
      if (rateValue) {
        const price = (parseFloat(form.miles) * rateValue).toFixed(2);
        set("customerPrice", price);
      }
    }
  }, [form.miles, form.weekend, vehicleRates]);

  async function handleGetMiles() {
    const origin = form.collectionPostcode;
    const dest = form.deliveryPostcode;
    if (!origin || !dest) { toast.error("Enter collection and delivery postcodes first"); return; }
    setCalcMiles(true);
    try {
      const res = await fetch("/api/bookings/miles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination: dest, avoidTolls: form.avoidTolls }),
      });
      const data = await res.json();
      if (data.miles !== undefined) {
        set("miles", data.miles.toString());
        if (data.note) toast(data.note);
      }
    } catch { toast.error("Failed to calculate miles"); } finally { setCalcMiles(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) { toast.error("Customer is required"); return; }
    if (!form.numberOfItems) { toast.error("Number of items is required"); return; }
    if (!form.weight) { toast.error("Weight is required"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        miles: form.miles ? parseFloat(form.miles) : null,
        customerPrice: form.customerPrice ? parseFloat(form.customerPrice) : null,
        manualAmount: form.manualAmount ? parseFloat(form.manualAmount) : null,
        extraCost2: form.extraCost2 ? parseFloat(form.extraCost2) : null,
        fuelSurchargePercent: form.fuelSurchargePercent ? parseFloat(form.fuelSurchargePercent) : null,
        fuelSurchargeCost: form.fuelSurchargeCost ? parseFloat(form.fuelSurchargeCost) : null,
        driverCost: form.driverCost ? parseFloat(form.driverCost) : null,
        extraCost: form.extraCost ? parseFloat(form.extraCost) : null,
        cxDriverCost: form.cxDriverCost ? parseFloat(form.cxDriverCost) : null,
        numberOfItems: form.numberOfItems ? parseInt(form.numberOfItems) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        weekend: parseInt(form.weekend),
        customerId: form.customerId || null,
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
        secondManId: form.secondManId || null,
        cxDriverId: form.cxDriverId || null,
        bookingTypeId: form.bookingTypeId || null,
        chillUnitId: form.chillUnitId || null,
        ambientUnitId: form.ambientUnitId || null,
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

  const tog = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="flex-1">
      <Topbar title="New Booking" subtitle="Create a new transport booking" />
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-5xl">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Customer & Job Details" open={sections.customer} onToggle={() => tog("customer")} />
          {sections.customer && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Customer" required>
                <select value={form.customerId} onChange={e => set("customerId", e.target.value)} className={inputCls} required>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.accountNumber ? `(${c.accountNumber})` : ""}</option>)}
                </select>
              </Field>
              <Field label="Purchase Order" required>
                <input type="text" value={form.purchaseOrder} onChange={e => set("purchaseOrder", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Booked By">
                <input type="text" value={form.bookedBy} onChange={e => set("bookedBy", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Booking Type">
                <select value={form.bookingTypeId} onChange={e => set("bookingTypeId", e.target.value)} className={inputCls}>
                  <option value="">Standard</option>
                  {bookingTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="Number of Items" required>
                <input type="number" min="1" value={form.numberOfItems} onChange={e => set("numberOfItems", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Weight (kg)" required>
                <input type="number" step="0.1" min="0" value={form.weight} onChange={e => set("weight", e.target.value)} className={inputCls} />
              </Field>
              <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-4">
                <Field label="Job Notes (visible to driver)">
                  <textarea value={form.jobNotes} onChange={e => set("jobNotes", e.target.value)} rows={2} className={inputCls + " resize-none"} />
                </Field>
                <Field label="Office Notes (internal)">
                  <textarea value={form.officeNotes} onChange={e => set("officeNotes", e.target.value)} rows={2} className={inputCls + " resize-none"} />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Collection */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Collection Details" open={sections.collection} onToggle={() => tog("collection")} />
          {sections.collection && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Collection Date"><input type="date" value={form.collectionDate} onChange={e => set("collectionDate", e.target.value)} className={inputCls} /></Field>
              <Field label="Collection Time"><input type="time" value={form.collectionTime} onChange={e => set("collectionTime", e.target.value)} className={inputCls} /></Field>
              <Field label="Business Name"><input type="text" value={form.collectionName} onChange={e => set("collectionName", e.target.value)} className={inputCls} /></Field>
              <Field label="Address 1"><input type="text" value={form.collectionAddress1} onChange={e => set("collectionAddress1", e.target.value)} className={inputCls} /></Field>
              <Field label="Address 2"><input type="text" value={form.collectionAddress2} onChange={e => set("collectionAddress2", e.target.value)} className={inputCls} /></Field>
              <Field label="Town/Area"><input type="text" value={form.collectionArea} onChange={e => set("collectionArea", e.target.value)} className={inputCls} /></Field>
              <Field label="Country"><input type="text" value={form.collectionCountry} onChange={e => set("collectionCountry", e.target.value)} className={inputCls} /></Field>
              <Field label="Postcode"><input type="text" value={form.collectionPostcode} onChange={e => set("collectionPostcode", e.target.value)} className={inputCls + " uppercase"} /></Field>
              <Field label="Contact Name"><input type="text" value={form.collectionContact} onChange={e => set("collectionContact", e.target.value)} className={inputCls} /></Field>
              <Field label="Phone"><input type="text" value={form.collectionPhone} onChange={e => set("collectionPhone", e.target.value)} className={inputCls} /></Field>
              <Field label="Notes"><input type="text" value={form.collectionNotes} onChange={e => set("collectionNotes", e.target.value)} className={inputCls} /></Field>
            </div>
          )}
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Delivery Details" open={sections.delivery} onToggle={() => tog("delivery")} />
          {sections.delivery && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Delivery Date"><input type="date" value={form.deliveryDate} onChange={e => set("deliveryDate", e.target.value)} className={inputCls} /></Field>
              <Field label="Delivery Time"><input type="time" value={form.deliveryTime} onChange={e => set("deliveryTime", e.target.value)} className={inputCls} /></Field>
              <Field label="Business Name"><input type="text" value={form.deliveryName} onChange={e => set("deliveryName", e.target.value)} className={inputCls} /></Field>
              <Field label="Address 1"><input type="text" value={form.deliveryAddress1} onChange={e => set("deliveryAddress1", e.target.value)} className={inputCls} /></Field>
              <Field label="Address 2"><input type="text" value={form.deliveryAddress2} onChange={e => set("deliveryAddress2", e.target.value)} className={inputCls} /></Field>
              <Field label="Town/Area"><input type="text" value={form.deliveryArea} onChange={e => set("deliveryArea", e.target.value)} className={inputCls} /></Field>
              <Field label="Country"><input type="text" value={form.deliveryCountry} onChange={e => set("deliveryCountry", e.target.value)} className={inputCls} /></Field>
              <Field label="Postcode"><input type="text" value={form.deliveryPostcode} onChange={e => set("deliveryPostcode", e.target.value)} className={inputCls + " uppercase"} /></Field>
              <Field label="Contact Name"><input type="text" value={form.deliveryContact} onChange={e => set("deliveryContact", e.target.value)} className={inputCls} /></Field>
              <Field label="Phone"><input type="text" value={form.deliveryPhone} onChange={e => set("deliveryPhone", e.target.value)} className={inputCls} /></Field>
              <Field label="Notes"><input type="text" value={form.deliveryNotes} onChange={e => set("deliveryNotes", e.target.value)} className={inputCls} /></Field>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Pricing & Vehicle" open={sections.pricing} onToggle={() => tog("pricing")} />
          {sections.pricing && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Vehicle">
                <select value={form.vehicleId} onChange={e => set("vehicleId", e.target.value)} className={inputCls}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="Rate Type">
                <select value={form.weekend} onChange={e => set("weekend", e.target.value)} className={inputCls}>
                  <option value="0">Normal</option>
                  <option value="1">Weekend / Bank Holiday</option>
                  <option value="2">Out of Hours</option>
                </select>
              </Field>
              <Field label="Miles">
                <div className="flex gap-2">
                  <input type="number" step="0.1" min="0" value={form.miles} onChange={e => set("miles", e.target.value)} className={inputCls} placeholder="0.0" />
                  <button type="button" onClick={handleGetMiles} disabled={calcMiles}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm flex items-center gap-1 disabled:opacity-60 whitespace-nowrap">
                    {calcMiles ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    Calc
                  </button>
                </div>
              </Field>
              <Field label="Customer Price (£)">
                <input type="number" step="0.01" min="0" value={form.customerPrice} onChange={e => set("customerPrice", e.target.value)} className={inputCls} placeholder="Auto-calculated" />
              </Field>
              <Field label="Manual Override (£)">
                <input type="number" step="0.01" min="0" value={form.manualAmount} onChange={e => set("manualAmount", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Manual Desc">
                <input type="text" value={form.manualDesc} onChange={e => set("manualDesc", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Extra Charge (£)">
                <input type="number" step="0.01" min="0" value={form.extraCost2} onChange={e => set("extraCost2", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Extra Charge Label">
                <input type="text" value={form.extraCost2Label} onChange={e => set("extraCost2Label", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fuel Surcharge %">
                <input type="number" step="0.1" min="0" value={form.fuelSurchargePercent} onChange={e => set("fuelSurchargePercent", e.target.value)} className={inputCls} />
              </Field>
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="avoidTolls" checked={form.avoidTolls} onChange={e => set("avoidTolls", e.target.checked)} className="rounded" />
                <label htmlFor="avoidTolls" className="text-sm text-slate-700">Avoid Tolls</label>
              </div>
              {vehicleRates.length > 0 && (
                <div className="sm:col-span-3 text-xs text-slate-500 bg-blue-50 p-2 rounded-lg">
                  Rate: £{vehicleRates[0].ratePerMile}/mi (normal) · £{vehicleRates[0].ratePerMileWeekends}/mi (weekend) · £{vehicleRates[0].ratePerMileOutOfHours}/mi (OOH)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drivers */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Driver Assignment" open={sections.drivers} onToggle={() => tog("drivers")} />
          {sections.drivers && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Driver">
                <select value={form.driverId} onChange={e => set("driverId", e.target.value)} className={inputCls}>
                  <option value="">Unassigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Driver Cost (£)">
                <input type="number" step="0.01" min="0" value={form.driverCost} onChange={e => set("driverCost", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Second Man (Subcontractor)">
                <select value={form.secondManId} onChange={e => set("secondManId", e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  {subcontractors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Second Man Cost (£)">
                <input type="number" step="0.01" min="0" value={form.extraCost} onChange={e => set("extraCost", e.target.value)} className={inputCls} />
              </Field>
              <Field label="CX Driver">
                <select value={form.cxDriverId} onChange={e => set("cxDriverId", e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  {cxDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="CX Driver Cost (£)">
                <input type="number" step="0.01" min="0" value={form.cxDriverCost} onChange={e => set("cxDriverCost", e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}
        </div>

        {/* Storage Units */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader title="Temperature-Controlled Units" open={sections.units} onToggle={() => tog("units")} />
          {sections.units && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Chill Unit">
                <select value={form.chillUnitId} onChange={e => set("chillUnitId", e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  {storageUnits.filter(u => u.unitType?.toLowerCase() === "chill" || !u.unitType).map(u => (
                    <option key={u.id} value={u.id}>{u.unitNumber} {u.unitSize ? `(${u.unitSize})` : ""}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ambient Unit">
                <select value={form.ambientUnitId} onChange={e => set("ambientUnitId", e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  {storageUnits.filter(u => u.unitType?.toLowerCase() === "ambient" || !u.unitType).map(u => (
                    <option key={u.id} value={u.id}>{u.unitNumber} {u.unitSize ? `(${u.unitSize})` : ""}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
