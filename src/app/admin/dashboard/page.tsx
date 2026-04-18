"use client";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Users, Package, Truck, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { usePermissions } from "@/lib/use-permissions";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const { has } = usePermissions();

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  const [selectedDate, setSelectedDate] = useState(() => todayStr());

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard?date=${selectedDate}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, [selectedDate]);

  function navigateDay(dir: 1 | -1) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }

  const stats = data?.stats;
  const bookings: any[] = Array.isArray(data?.recentBookings) ? data.recentBookings : [];

  return (
    <div className="flex-1">
      <Topbar title="Dashboard" subtitle="Welcome back to MP Booking System" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={stats?.totalCustomers ?? "—"} icon={Users} color="blue" />
          <StatCard title="Total Sales" value={stats?.totalSales ?? "—"} icon={Package} color="purple" />
          <StatCard title="Total Vehicles" value={stats?.totalVehicles ?? "—"} icon={Car} color="amber" />
          <StatCard title="Total Drivers" value={stats?.totalDrivers ?? "—"} icon={Truck} color="green" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Bookings</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateDay(-1)} title="Previous day"
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <input type="date" value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                onClick={e => { try { (e.target as any).showPicker?.(); } catch {} }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
              <button onClick={() => navigateDay(1)} title="Next day"
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <Link href="/admin/bookings" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
            </div>
          </div>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {data === null ? "Loading..." : "No bookings yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Job Ref", "Date", "Time", "Customer", "From", "Via 1", "Via 2", "Via 3", "Via 4", "Via 5", "Via 6", "To", "Driver"].map((h) => (
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => {
                    const isQuote = b.bookingType?.name?.toLowerCase() === "quote";
                    const bookingVias: any[] = Array.isArray(b.viaAddresses) ? b.viaAddresses : [];
                    const allViasPodded = !bookingVias.length || bookingVias.every((v: any) => v.signedBy);
                    const assignedDriver = b.driver || b.secondMan || b.cxDriver;
                    const rowCls = isQuote ? "bg-slate-50" : b.podSignature && b.podDataVerify && allViasPodded ? "bg-blue-50 border-l-4 border-l-blue-500" : b.podSignature && allViasPodded ? "bg-emerald-50 border-l-4 border-l-emerald-500" : assignedDriver ? "bg-amber-50 border-l-4 border-l-amber-400" : "bg-rose-50 border-l-4 border-l-rose-500";
                    return (
                      <tr key={b.id} className={`border-b border-slate-100 hover:brightness-95 transition-all ${rowCls}`}>
                        <td className="px-2 py-2 font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">
                          <Link href={`/admin/bookings/${b.id}`} className="hover:underline">{b.jobRef || b.id.slice(-6).toUpperCase()}</Link>
                          {b.cxDriver && !b.driver && <span className="ml-1 text-xs text-amber-600">(cx)</span>}
                        </td>
                        <td className="px-2 py-2 text-xs text-slate-600 whitespace-nowrap">{b.collectionDate ? b.collectionDate.split("-").reverse().join("-") : "—"}</td>
                        <td className="px-2 py-2 text-xs text-slate-500 whitespace-nowrap">{b.collectionTime ?? "—"}</td>
                        <td className="px-2 py-2 text-xs font-medium text-slate-700 whitespace-nowrap max-w-[120px] truncate">{b.customer?.name ?? "—"}</td>
                        <td className="px-2 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">{b.collectionPostcode ?? "—"}</td>
                        {[0,1,2,3,4,5].map(i => (
                          <td key={i} className="px-2 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">{bookingVias[i]?.postcode ?? "—"}</td>
                        ))}
                        <td className="px-2 py-2 font-mono text-xs text-slate-600 whitespace-nowrap">{b.deliveryPostcode ?? "—"}</td>
                        <td className="px-2 py-2 text-xs text-slate-600 whitespace-nowrap">
                          {b.driver?.name
                            ? b.driver.name
                            : b.secondMan?.name
                            ? <span className="text-purple-600">{b.secondMan.name} <span className="text-xs opacity-70">(sub)</span></span>
                            : b.cxDriver?.name
                            ? <span className="text-amber-600">{b.cxDriver.name} <span className="text-xs opacity-70">(cx)</span></span>
                            : <span className="text-rose-500 font-semibold">Unassigned</span>}
                        </td>
                        {has("bookings_financials") && <td className="px-2 py-2 text-xs text-slate-500 whitespace-nowrap">{b.driverCost ? `£${Number(b.driverCost).toFixed(2)}` : "—"}</td>}
                        <td className="px-2 py-2 text-xs text-slate-500 whitespace-nowrap">{b.vehicle?.name ?? "—"}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {isQuote ? <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">Quote</span>
                            : !(b.driver || b.secondMan || b.cxDriver) ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>
                            : b.podSignature && b.podDataVerify && allViasPodded ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">Completed</span>
                            : b.podSignature && allViasPodded ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">POD Received</span>
                            : <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">Driver Allocated</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

