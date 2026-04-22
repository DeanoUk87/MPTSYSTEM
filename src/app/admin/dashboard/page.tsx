"use client";
import { useEffect, useState, useCallback } from "react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Users, Package, Truck, Car, ChevronLeft, ChevronRight, BarChart2, TrendingUp, TrendingDown, Award } from "lucide-react";
import { usePermissions } from "@/lib/use-permissions";

function WeeklyBarChart({ data }: { data: { week: string; jobs: number; revenue: number }[] }) {
  if (!data.length) return <div className="text-slate-400 text-sm text-center py-8">No data</div>;
  const maxJobs = Math.max(...data.map(d => d.jobs), 1);
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-0 h-40 px-2">
        {data.map((d) => {
          const jobH = Math.round((d.jobs / maxJobs) * 120);
          const revH = Math.round((d.revenue / maxRev) * 120);
          const label = d.week.slice(5).replace("-", "/");
          return (
            <div key={d.week} className="flex flex-col items-center gap-1 flex-1 min-w-[44px]">
              <div className="flex items-end gap-0.5 h-32">
                <div title={`${d.jobs} jobs`} style={{ height: jobH || 2 }} className="w-4 bg-blue-500 rounded-t cursor-pointer hover:bg-blue-600 transition-colors" />
                <div title={`£${d.revenue.toFixed(0)}`} style={{ height: revH || 2 }} className="w-4 bg-emerald-400 rounded-t cursor-pointer hover:bg-emerald-500 transition-colors" />
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Jobs</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" />Revenue (£)</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
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

  const loadKpi = useCallback(() => {
    fetch("/api/dashboard?kpi=1")
      .then(r => r.ok ? r.json() : null)
      .then(d => setKpiData(d?.kpi ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (has("kpi_view")) loadKpi();
  }, [has, loadKpi]);

  function navigateDay(dir: 1 | -1) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }

  const stats = data?.stats;
  const bookings: any[] = Array.isArray(data?.recentBookings) ? data.recentBookings : [];
  const monthChange = kpiData ? kpiData.thisMonthBookings - kpiData.lastMonthBookings : 0;

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

        {/* KPI Section */}
        {has("kpi_view") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-800">KPI Overview</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">This Month — Jobs</p>
                <p className="text-3xl font-bold text-slate-800">{kpiData?.thisMonthBookings ?? "—"}</p>
                {kpiData && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${monthChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {monthChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(monthChange)} vs last month ({kpiData.lastMonthBookings})
                  </p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-2">Top Customers (all time)</p>
                {kpiData?.topCustomers?.length ? (
                  <ol className="space-y-1">
                    {kpiData.topCustomers.map((c: any, i: number) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate">
                          {i === 0 && <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <span className="truncate text-slate-700">{c.name}</span>
                        </span>
                        <span className="font-semibold text-slate-800 ml-2 flex-shrink-0">{c.jobs} jobs</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="text-slate-400 text-xs">No data yet</p>}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-2">Weekly Jobs &amp; Revenue (8 weeks)</p>
                <WeeklyBarChart data={kpiData?.weeklyData ?? []} />
              </div>
            </div>
          </div>
        )}

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
                      <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                    {has("bookings_financials") && <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Driver Cost</th>}
                    {["Vehicle"].map((h) => (
                      <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                    <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
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
                          {b.driver?.name || b.secondMan?.name || b.cxDriver?.name
                            ? <span>{b.driver?.name || b.secondMan?.name || b.cxDriver?.name}{b.driverContact?.driverName && <span className="block text-xs text-slate-400">({b.driverContact.driverName})</span>}</span>
                            : <span className="text-rose-500 font-semibold">Unassigned</span>}
                        </td>
                        {has("bookings_financials") && <td className="px-2 py-2 text-xs text-slate-500 whitespace-nowrap">{(b.driverCost || b.extraCost || b.cxDriverCost) ? `£${Number(b.driverCost || b.extraCost || b.cxDriverCost).toFixed(2)}` : "—"}</td>}
                        <td className="px-2 py-2 text-xs text-slate-500 whitespace-nowrap">{b.vehicle?.name ?? "—"}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {isQuote ? <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">Quote</span>
                            : !(b.driver || b.secondMan || b.cxDriver) ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>
                            : b.podSignature && b.podDataVerify && allViasPodded ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">Completed</span>
                            : b.podSignature && allViasPodded ? <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">POD Received</span>
                            : <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">Driver Allocated</span>}
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


