"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, CheckCircle, Package, ChevronRight, Calendar, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Booking {
  id: string;
  collectionDate?: string; collectionTime?: string; collectionName?: string; collectionPostcode?: string;
  deliveryDate?: string; deliveryTime?: string; deliveryName?: string; deliveryPostcode?: string;
  numberOfItems?: number; weight?: number; purchaseOrder?: string;
  jobStatus: number; podSignature?: string; podDataVerify: boolean;
  vehicle?: { name: string }; driver?: { name: string };
  viaAddresses?: any[];
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/portal/bookings?date=${date}`)
      .then(r => {
        if (r.status === 403) { setError("This account does not have customer portal access."); setLoading(false); return null; }
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then(d => { if (d) { setBookings(d); setLoading(false); } })
      .catch(() => { setError("Failed to load bookings"); setLoading(false); });
  }, [date, router]);

  function getStatus(b: Booking) {
    if (b.podSignature && b.podDataVerify) return { label: "Delivered", color: "bg-emerald-100 text-emerald-700" };
    if (b.podSignature) return { label: "POD Pending", color: "bg-blue-100 text-blue-700" };
    if (b.driver) return { label: "In Progress", color: "bg-amber-100 text-amber-700" };
    return { label: "Booked", color: "bg-slate-100 text-slate-600" };
  }

  if (error) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm">
        <p className="text-slate-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-blue-700 text-white px-6 py-5">
        <h1 className="text-xl font-bold">My Bookings</h1>
        <p className="text-blue-200 text-sm mt-0.5">Track your sameday deliveries</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Date picker */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-sm text-slate-500">{bookings.length} booking(s)</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No bookings for this date</p>
          </div>
        )}

        {!loading && bookings.map(b => {
          const status = getStatus(b);
          return (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium", status.color)}>{status.label}</span>
                      {b.purchaseOrder && <span className="text-xs text-slate-400">PO: {b.purchaseOrder}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Collection</p>
                        <p className="font-medium truncate">{b.collectionName || b.collectionPostcode || "—"}</p>
                        <p className="text-xs text-slate-500">{b.collectionDate} {b.collectionTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Delivery</p>
                        <p className="font-medium truncate">{b.deliveryName || b.deliveryPostcode || "—"}</p>
                        <p className="text-xs text-slate-500">{b.deliveryDate} {b.deliveryTime}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={clsx("w-4 h-4 text-slate-400 mt-1 transition-transform", selectedBooking?.id === b.id && "rotate-90")} />
                </div>
              </div>

              {/* Expanded detail */}
              {selectedBooking?.id === b.id && (
                <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {b.vehicle && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-3 h-3" />
                        <span>{b.vehicle.name}</span>
                      </div>
                    )}
                    {b.driver && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span>Driver: {b.driver.name}</span>
                      </div>
                    )}
                    {b.numberOfItems && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Package className="w-3 h-3" />
                        <span>{b.numberOfItems} item(s) · {b.weight}kg</span>
                      </div>
                    )}
                  </div>

                  {/* Via stops */}
                  {(b.viaAddresses?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Stops</p>
                      {b.viaAddresses?.map((v: any) => (
                        <div key={v.id} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>{v.name} — {v.postcode}</span>
                          {v.signedBy && <span className="text-emerald-600">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* POD */}
                  {b.podSignature && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Delivered &amp; signed by {b.podSignature}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
