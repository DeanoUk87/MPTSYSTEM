"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string;
  collectionName?: string;
  collectionAddress1?: string;
  collectionPostcode?: string;
  deliveryName?: string;
  deliveryAddress1?: string;
  deliveryPostcode?: string;
  purchaseOrder?: string;
  miles?: number;
  customerPrice?: number;
  driverCost?: number;
  podDate?: string;
  customer?: { name: string };
  vehicle?: { name: string };
  driver?: { name: string };
  viaAddresses?: { id: string; postcode?: string; viaType?: string; name?: string; address1?: string; city?: string }[];
}

function addrLine(name?: string, addr1?: string, postcode?: string) {
  return [name, addr1, postcode].filter(Boolean).join(", ");
}

function FinancialReport() {
  const sp = useSearchParams();
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const customerId = sp.get("customerId") ?? "";
  const driverId = sp.get("driverId") ?? "";
  const customerName = sp.get("customerName") ?? "";
  const driverName = sp.get("driverName") ?? "";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const printed = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (customerId) params.set("customerId", customerId);
    if (driverId) params.set("driverId", driverId);
    params.set("podOnly", "1");
    fetch(`/api/bookings?${params}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dateFrom, dateTo, customerId, driverId]);

  const totalPrice = bookings.reduce((s, b) => s + (b.customerPrice ?? 0), 0);
  const totalDriverCost = bookings.reduce((s, b) => s + (b.driverCost ?? 0), 0);
  const totalProfit = totalPrice - totalDriverCost;

  const label = [
    dateFrom && dateTo ? `${dateFrom.split("-").reverse().join("-")} – ${dateTo.split("-").reverse().join("-")}` :
    dateFrom ? `From ${dateFrom.split("-").reverse().join("-")}` :
    dateTo ? `To ${dateTo.split("-").reverse().join("-")}` : "All dates",
    customerName && `Customer: ${customerName}`,
    driverName && `Driver: ${driverName}`,
  ].filter(Boolean).join(" · ");

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report…
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8 text-slate-800 text-sm print:p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 print:text-xl">Financial Report</h1>
          <p className="text-slate-500 mt-0.5">{label}</p>
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
              {["Job Ref", "Customer", "Purchase Order", "Date", "From / Via", "To", "Miles", "Vehicle", "Driver", "Price", "Driver Cost", "Profit"]
                .map(h => <th key={h} className="px-2 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => {
              const profit = (b.customerPrice ?? 0) - (b.driverCost ?? 0);
              const fromAddr = addrLine(b.collectionName, b.collectionAddress1, b.collectionPostcode);
              const vias = b.viaAddresses ?? [];
              return (
                <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-2 py-2 font-mono font-semibold text-blue-700 whitespace-nowrap">{b.jobRef ?? b.id.slice(-6).toUpperCase()}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{b.customer?.name ?? "—"}</td>
                  <td className="px-2 py-2 text-slate-500">{b.purchaseOrder ?? "—"}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{b.collectionDate ? b.collectionDate.split("-").reverse().join("-") : "—"}</td>
                  <td className="px-2 py-2 max-w-[180px]">
                    <div>{fromAddr || "—"}</div>
                    {vias.map((v, vi) => (
                      <div key={v.id} className="text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-500">VIA {vi + 1} {v.viaType === "collection" ? "Collection" : "Delivery"}:</span>{" "}
                        {[v.name, v.address1, v.city, v.postcode].filter(Boolean).join(", ") || v.postcode || "—"}
                      </div>
                    ))}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{addrLine(b.deliveryName, b.deliveryAddress1, b.deliveryPostcode) || "—"}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{b.miles ? Math.round(b.miles) : "—"}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{b.vehicle?.name ?? "—"}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{b.driver?.name ?? "—"}</td>
                  <td className="px-2 py-2 text-right font-semibold text-emerald-700 whitespace-nowrap">£{(b.customerPrice ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2 text-right font-semibold text-rose-700 whitespace-nowrap">£{(b.driverCost ?? 0).toFixed(2)}</td>
                  <td className={`px-2 py-2 text-right font-semibold whitespace-nowrap ${profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>£{profit.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-400 bg-slate-100 font-bold">
              <td className="px-2 py-2" colSpan={9}>TOTAL ({bookings.length} jobs)</td>
              <td className="px-2 py-2 text-right text-emerald-700 whitespace-nowrap">£{totalPrice.toFixed(2)}</td>
              <td className="px-2 py-2 text-right text-rose-700 whitespace-nowrap">£{totalDriverCost.toFixed(2)}</td>
              <td className={`px-2 py-2 text-right whitespace-nowrap ${totalProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>£{totalProfit.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default function FinancialReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <FinancialReport />
    </Suspense>
  );
}
