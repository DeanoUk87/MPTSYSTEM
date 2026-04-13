"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string;
  collectionPostcode?: string;
  deliveryPostcode?: string;
  driverCost?: number;
  driver?: { name: string };
  secondMan?: { name: string };
  cxDriver?: { name: string };
  viaAddresses?: { id: string; postcode?: string }[];
}

function DriverStatement() {
  const sp = useSearchParams();
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const driverId = sp.get("driverId") ?? "";
  const driverName = sp.get("driverName") ?? "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (driverId) params.set("driverId", driverId);
    params.set("podOnly", "1");
    fetch(`/api/bookings?${params}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dateFrom, dateTo, driverId]);

  const totalDriverCost = bookings.reduce((s, b) => s + (b.driverCost ?? 0), 0);

  const dateLabel = [
    dateFrom && dateTo ? `${dateFrom.split("-").reverse().join("-")} – ${dateTo.split("-").reverse().join("-")}` :
    dateFrom ? `From ${dateFrom.split("-").reverse().join("-")}` :
    dateTo ? `To ${dateTo.split("-").reverse().join("-")}` : "All dates",
  ].filter(Boolean).join("");

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading statement…
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8 text-slate-800 text-sm print:p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 print:text-xl">Driver Statement</h1>
          {driverName && <p className="text-slate-700 font-semibold mt-0.5">{driverName}</p>}
          <p className="text-slate-500 mt-0.5">{dateLabel}</p>
          <p className="text-slate-400 text-xs mt-0.5">Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 print:hidden"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="text-slate-400 text-center py-16">No completed jobs found for the selected filters.</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              {["Job Ref", "Delivery Date", "Postcodes", "Driver Cost"]
                .map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => {
              const allPostcodes = [
                b.collectionPostcode,
                ...(b.viaAddresses ?? []).map(v => v.postcode),
                b.deliveryPostcode,
              ].filter(Boolean).join(" → ");
              return (
                <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2 font-mono font-semibold text-blue-700 whitespace-nowrap">{b.jobRef ?? b.id.slice(-6).toUpperCase()}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{b.collectionDate ? b.collectionDate.split("-").reverse().join("-") : "—"}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">{allPostcodes || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold text-rose-700 whitespace-nowrap">£{(b.driverCost ?? 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-400 bg-slate-100 font-bold">
              <td className="px-3 py-2" colSpan={3}>TOTAL ({bookings.length} jobs)</td>
              <td className="px-3 py-2 text-right text-rose-700 whitespace-nowrap">£{totalDriverCost.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default function DriverStatementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <DriverStatement />
    </Suspense>
  );
}
