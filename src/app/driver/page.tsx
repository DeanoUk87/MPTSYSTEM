"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Truck, Loader2, LogOut, MapPin, Clock, Package, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

interface ViaAddress {
  id: string; name?: string; postcode?: string;
  viaType?: string; address1?: string; area?: string; notes?: string;
  signedBy?: string; podRelationship?: string; podDate?: string; podTime?: string; deliveredTemp?: string;
}

interface StorageUnit { id: string; unitNumber: string; unitType?: string; imei?: string; }

interface Booking {
  id: string; jobRef?: string;
  collectionDate?: string; collectionTime?: string;
  collectionName?: string; collectionAddress1?: string; collectionPostcode?: string;
  collectionContact?: string; collectionPhone?: string; collectionNotes?: string;
  deliveryTime?: string; deliveryName?: string; deliveryAddress1?: string;
  deliveryPostcode?: string; deliveryContact?: string; deliveryPhone?: string;
  deliveryNotes?: string;
  purchaseOrder?: string; jobNotes?: string;
  jobStatus: number; podSignature?: string; podDataVerify: boolean;
  podDate?: string; podTime?: string; podRelationship?: string; deliveredTemperature?: string;
  numberOfItems?: number; weight?: number;
  customer?: { name: string };
  vehicle?: { name: string };
  driver?: { name: string };
  secondMan?: { name: string };
  chillUnit?: StorageUnit; ambientUnit?: StorageUnit;
  viaAddresses?: ViaAddress[];
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusInfo(b: Booking) {
  const vp = !b.viaAddresses?.length || b.viaAddresses.every(v => !!v.signedBy);
  if (b.podSignature && b.podDataVerify && vp)
    return { label: "Completed", cls: "bg-blue-500 text-white", rowCls: "border-l-4 border-l-blue-400 bg-blue-50" };
  if (b.podSignature && vp)
    return { label: "POD Received", cls: "bg-emerald-500 text-white", rowCls: "border-l-4 border-l-emerald-400 bg-emerald-50" };
  if (b.driver)
    return { label: "Allocated", cls: "bg-amber-400 text-white", rowCls: "border-l-4 border-l-amber-400 bg-amber-50" };
  return { label: "Booked", cls: "bg-rose-500 text-white", rowCls: "border-l-4 border-l-rose-400 bg-rose-50" };
}

export default function DriverPortalPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d?.name) setDriverName(d.name);
      if (!d?.dcontactId) { router.replace("/login"); }
    }).catch(() => router.replace("/login"));
  }, [router]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (res.ok) setBookings(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-purple-700 text-white px-4 sm:px-6 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Driver Portal</h1>
              <p className="text-purple-200 text-xs">{driverName}</p>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs text-purple-200 hover:text-white border border-purple-500 hover:border-purple-300 px-3 py-1.5 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-medium text-slate-500 whitespace-nowrap">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
              {bookings.length} job{bookings.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No jobs found for this date range</p>
          </div>
        ) : (
          bookings.map(b => {
            const st = statusInfo(b);
            const isExpanded = expanded === b.id;
            const vias = b.viaAddresses ?? [];
            return (
              <div key={b.id} className={clsx("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", st.rowCls)}>
                {/* Summary row */}
                <button onClick={() => setExpanded(isExpanded ? null : b.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">{b.jobRef || b.id.slice(-6).toUpperCase()}</span>
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold", st.cls)}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.collectionTime || "—"}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.collectionPostcode || "—"}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.deliveryPostcode || "—"}</span>
                      {vias.length > 0 && <span className="text-purple-500 font-medium">{vias.length} stop{vias.length !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                    {/* Collection */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Collection</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-slate-400">Name</p><p className="font-medium text-slate-800">{b.collectionName || "—"}</p></div>
                        <div><p className="text-xs text-slate-400">Postcode</p><p className="font-medium text-slate-800">{b.collectionPostcode || "—"}</p></div>
                        {b.collectionAddress1 && <div className="col-span-2"><p className="text-xs text-slate-400">Address</p><p className="font-medium text-slate-700">{b.collectionAddress1}</p></div>}
                        {b.collectionContact && <div><p className="text-xs text-slate-400">Contact</p><p className="font-medium text-slate-700">{b.collectionContact}</p></div>}
                        {b.collectionPhone && <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium text-slate-700">{b.collectionPhone}</p></div>}
                        {b.collectionNotes && <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-600 text-xs">{b.collectionNotes}</p></div>}
                        <div><p className="text-xs text-slate-400">Time</p><p className="font-medium text-slate-800">{b.collectionTime || "—"}</p></div>
                        <div><p className="text-xs text-slate-400">Date</p><p className="font-medium text-slate-800">{fmt(b.collectionDate)}</p></div>
                      </div>
                    </div>

                    {/* Via Stops */}
                    {vias.map((v, i) => (
                      <div key={v.id} className={clsx("rounded-lg p-3", v.signedBy ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200")}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: v.signedBy ? "#059669" : "#d97706" }}>
                          {v.viaType || "Via"} Stop {i + 1}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {v.name && <div><p className="text-xs text-slate-400">Name</p><p className="font-medium text-slate-800">{v.name}</p></div>}
                          {v.postcode && <div><p className="text-xs text-slate-400">Postcode</p><p className="font-medium text-slate-800">{v.postcode}</p></div>}
                          {v.address1 && <div className="col-span-2"><p className="text-xs text-slate-400">Address</p><p className="font-medium text-slate-700">{v.address1}</p></div>}
                          {v.notes && <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-600 text-xs">{v.notes}</p></div>}
                          {v.signedBy && <div><p className="text-xs text-slate-400">Signed By</p><p className="font-medium text-emerald-700">{v.signedBy}</p></div>}
                          {v.podTime && <div><p className="text-xs text-slate-400">POD Time</p><p className="font-medium text-slate-700">{v.podTime}</p></div>}
                        </div>
                      </div>
                    ))}

                    {/* Delivery */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-slate-400">Name</p><p className="font-medium text-slate-800">{b.deliveryName || "—"}</p></div>
                        <div><p className="text-xs text-slate-400">Postcode</p><p className="font-medium text-slate-800">{b.deliveryPostcode || "—"}</p></div>
                        {b.deliveryAddress1 && <div className="col-span-2"><p className="text-xs text-slate-400">Address</p><p className="font-medium text-slate-700">{b.deliveryAddress1}</p></div>}
                        {b.deliveryContact && <div><p className="text-xs text-slate-400">Contact</p><p className="font-medium text-slate-700">{b.deliveryContact}</p></div>}
                        {b.deliveryPhone && <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium text-slate-700">{b.deliveryPhone}</p></div>}
                        {b.deliveryNotes && <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-600 text-xs">{b.deliveryNotes}</p></div>}
                        <div><p className="text-xs text-slate-400">Time</p><p className="font-medium text-slate-800">{b.deliveryTime || "—"}</p></div>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Info</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {b.customer?.name && <div><p className="text-xs text-slate-400">Customer</p><p className="font-medium text-slate-800">{b.customer.name}</p></div>}
                        {b.vehicle?.name && <div><p className="text-xs text-slate-400">Vehicle</p><p className="font-medium text-slate-800">{b.vehicle.name}</p></div>}
                        {b.purchaseOrder && <div><p className="text-xs text-slate-400">PO Number</p><p className="font-medium text-slate-800">{b.purchaseOrder}</p></div>}
                        {b.numberOfItems && <div><p className="text-xs text-slate-400">Items</p><p className="font-medium text-slate-800">{b.numberOfItems}</p></div>}
                        {b.weight && <div><p className="text-xs text-slate-400">Weight</p><p className="font-medium text-slate-800">{b.weight} kg</p></div>}
                        {b.secondMan?.name && <div><p className="text-xs text-slate-400">Second Man</p><p className="font-medium text-slate-800">{b.secondMan.name}</p></div>}
                        {b.chillUnit && <div><p className="text-xs text-slate-400">Chill Unit</p><p className="font-medium text-blue-700">{b.chillUnit.unitNumber}</p></div>}
                        {b.ambientUnit && <div><p className="text-xs text-slate-400">Ambient Unit</p><p className="font-medium text-green-700">{b.ambientUnit.unitNumber}</p></div>}
                      </div>
                      {b.jobNotes && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-400">Job Notes</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{b.jobNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* POD info if completed */}
                    {b.podSignature && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Proof of Delivery</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {b.podDate && <div><p className="text-xs text-slate-400">POD Date</p><p className="font-medium text-slate-800">{b.podDate}</p></div>}
                          {b.podTime && <div><p className="text-xs text-slate-400">POD Time</p><p className="font-medium text-slate-800">{b.podTime}</p></div>}
                          {b.podRelationship && <div><p className="text-xs text-slate-400">Relationship</p><p className="font-medium text-slate-800">{b.podRelationship}</p></div>}
                          {b.deliveredTemperature && <div><p className="text-xs text-slate-400">Temperature</p><p className="font-medium text-slate-800">{b.deliveredTemperature}</p></div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
