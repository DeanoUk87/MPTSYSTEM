"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Truck, Loader2, LogOut } from "lucide-react";

interface ViaAddress {
  id: string;
  postcode?: string;
  name?: string;
}

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string;
  collectionPostcode?: string;
  collectionName?: string;
  deliveryPostcode?: string;
  deliveryName?: string;
  driverCost?: number;
  extraCost?: number;
  viaAddresses?: ViaAddress[];
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function DriverPortalPage() {
  const router = useRouter();
  const [driverName, setDriverName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(d => {
        if (!d?.driverId) { router.replace("/login"); return; }
        if (d?.name) setDriverName(d.name);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver-portal/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (res.ok) setBookings(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  const total = bookings.reduce((sum, b) => sum + (b.driverCost ?? 0) + (b.extraCost ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-purple-700 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Driver Portal</h1>
              <p className="text-purple-200 text-xs">{driverName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-purple-200 hover:text-white border border-purple-500 hover:border-purple-300 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Date filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">From</label>
            <input
              type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">To</label>
            <input
              type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
          >
            View
          </button>
          <span className="text-sm text-slate-500 ml-auto">
            {bookings.length} job{bookings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Job Ref</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Collect</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 1</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 2</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 3</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 4</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 5</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Via 6</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Delivery</th>
                    <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                        <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No jobs found for this date range</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => {
                      const vias = b.viaAddresses ?? [];
                      const rowTotal = (b.driverCost ?? 0) + (b.extraCost ?? 0);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                            {b.jobRef || b.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(b.collectionDate)}</td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {b.collectionPostcode || b.collectionName || "—"}
                          </td>
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <td key={i} className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {vias[i]?.postcode || vias[i]?.name || "—"}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {b.deliveryPostcode || b.deliveryName || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                            {rowTotal > 0 ? `£${rowTotal.toFixed(2)}` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {bookings.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300">
                      <td
                        colSpan={10}
                        className="px-4 py-3 text-right font-bold text-slate-700 uppercase tracking-wide text-sm"
                      >
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 text-base whitespace-nowrap">
                        £{total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
