"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Loader2, LogOut, CheckCircle2, Clock3, Truck, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import clsx from "clsx";

interface ViaAddress {
  id: string; name?: string; postcode?: string; deliveryTime?: string; signedBy?: string; time?: string;
}

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string; collectionTime?: string; collectionName?: string; collectionPostcode?: string; collectionAddress1?: string; collectionArea?: string;
  deliveryTime?: string; deliveryName?: string; deliveryPostcode?: string; deliveryAddress1?: string; deliveryArea?: string;
  purchaseOrder?: string; jobNotes?: string;
  jobStatus: number; podSignature?: string; podDataVerify: boolean;
  driver?: { name: string };
  viaAddresses?: ViaAddress[];
}

function statusInfo(b: Booking) {
  if (b.podSignature && b.podDataVerify) return { label: "Delivered", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (b.podSignature) return { label: "POD Pending", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (b.driver) return { label: "In Progress", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Booked", cls: "bg-slate-100 text-slate-600 border-slate-200" };
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => { loadBookings(); }, []);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">MP Transport — Customer Portal</h1>
          <p className="text-blue-200 text-xs mt-0.5">View and track your bookings</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Date range filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={loadBookings}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              View
            </button>
            <button onClick={() => { const d = today; setDateFrom(d); setDateTo(d); setTimeout(loadBookings, 0); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
              Today
            </button>
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
                    {["Job Ref", "Date", "Time", "Collection", "Via 1", "Via 2", "Via 3", "Final Delivery", "ETA", "Status"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const st = statusInfo(b);
                    const via = b.viaAddresses ?? [];
                    const expanded = expandedId === b.id;
                    return (
                      <>
                        <tr key={b.id}
                          className={clsx("border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors", expanded && "bg-blue-50")}
                          onClick={() => setExpandedId(expanded ? null : b.id)}>
                          <td className="px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {b.jobRef || b.id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-700">{fmt(b.collectionDate)}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-500">{b.collectionTime || "—"}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-800 truncate max-w-[140px]">{b.collectionName || "—"}</div>
                            {b.collectionPostcode && <div className="text-xs text-slate-400">{b.collectionPostcode}</div>}
                          </td>
                          {[0, 1, 2].map(i => (
                            <td key={i} className="px-3 py-3 text-slate-600">
                              {via[i] ? (
                                <div>
                                  <div className="truncate max-w-[120px]">{via[i].name || via[i].postcode || "—"}</div>
                                  {via[i].postcode && via[i].name && <div className="text-xs text-slate-400">{via[i].postcode}</div>}
                                </div>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-800 truncate max-w-[140px]">{b.deliveryName || "—"}</div>
                            {b.deliveryPostcode && <div className="text-xs text-slate-400">{b.deliveryPostcode}</div>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-500">{b.deliveryTime || "—"}</td>
                          <td className="px-3 py-3">
                            <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", st.cls)}>{st.label}</span>
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={b.id + "-detail"} className="bg-blue-50 border-b border-blue-100">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                {b.purchaseOrder && (
                                  <div><span className="font-semibold text-slate-600">PO Number:</span> <span className="text-slate-700">{b.purchaseOrder}</span></div>
                                )}
                                {b.driver && (
                                  <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-600">{b.driver.name}</span></div>
                                )}
                                {b.podSignature && (
                                  <div className="flex items-center gap-1.5 text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Signed by: <strong>{b.podSignature}</strong></span>
                                  </div>
                                )}
                                {b.jobNotes && (
                                  <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-xs">
                                    <span className="font-semibold">Notes:</span> {b.jobNotes}
                                  </div>
                                )}
                              </div>
                              {via.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">All Stops</p>
                                  <div className="flex flex-wrap gap-2">
                                    {via.map((v, i) => (
                                      <div key={v.id} className={clsx("flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border", v.signedBy ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-600")}>
                                        <span className="font-semibold">Via {i + 1}:</span>
                                        <span>{v.name || v.postcode}</span>
                                        {v.signedBy && <CheckCircle2 className="w-3 h-3" />}
                                        {v.deliveryTime && <span className="text-slate-400"><Clock3 className="w-3 h-3 inline" /> {v.deliveryTime}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
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
                const expanded = expandedId === b.id;
                return (
                  <div key={b.id} className="p-4">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expanded ? null : b.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-700 font-semibold text-sm">{b.jobRef || b.id.slice(-6).toUpperCase()}</span>
                          <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold border", st.cls)}>{st.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{fmt(b.collectionDate)} {b.collectionTime}</p>
                        <div className="mt-2 text-sm">
                          <div className="text-slate-700 font-medium">{b.collectionName || b.collectionPostcode || "—"}</div>
                          {via.length > 0 && <div className="text-slate-400 text-xs">{via.length} stop{via.length !== 1 ? "s" : ""}</div>}
                          <div className="text-slate-700 font-medium mt-0.5">{b.deliveryName || b.deliveryPostcode || "—"}</div>
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-1" />}
                    </div>
                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                        {b.purchaseOrder && <div><span className="font-semibold">PO:</span> {b.purchaseOrder}</div>}
                        {b.driver && <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {b.driver.name}</div>}
                        {b.podSignature && <div className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Signed: {b.podSignature}</div>}
                        {via.map((v, i) => (
                          <div key={v.id} className="text-xs text-slate-500">Via {i + 1}: {v.name || v.postcode}{v.signedBy ? " ✓" : ""}</div>
                        ))}
                        {b.jobNotes && <div className="text-xs bg-amber-50 border border-amber-100 rounded px-2 py-1 text-amber-700">{b.jobNotes}</div>}
                      </div>
                    )}
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

