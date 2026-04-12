"use client";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Users, Package, FileText, CheckCircle, Clock, Mail, Archive } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);

  const stats = data?.stats;
  const bookings: any[] = Array.isArray(data?.recentBookings) ? data.recentBookings : [];

  return (
    <div className="flex-1">
      <Topbar title="Dashboard" subtitle="Welcome back to MP Booking System" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={stats?.totalCustomers ?? "—"} icon={Users} color="blue" />
          <StatCard title="Total Sales" value={stats?.totalSales ?? "—"} icon={Package} color="purple" />
          <StatCard title="Total Invoices" value={stats?.totalInvoices ?? "—"} icon={FileText} color="amber" />
          <StatCard title="Emails Sent" value={stats?.sentInvoices ?? "—"} icon={Mail} color="green" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Pending Invoices" value={stats?.pendingInvoices ?? "—"} icon={Clock} color="amber" trend="Awaiting print/send" />
          <StatCard title="Unsent Invoices" value={stats?.unsent ?? "—"} icon={CheckCircle} color="rose" trend="Email not yet dispatched" />
          <StatCard title="Archived Sales" value={stats?.archivedSales ?? "—"} icon={Archive} color="purple" trend="Moved to archive" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {data === null ? "Loading..." : "No bookings yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Job Ref", "Customer", "Collection", "From", "To", "Driver", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-blue-600">
                        <Link href={`/admin/bookings/${b.id}`} className="hover:underline">{b.jobRef || b.id.slice(-8).toUpperCase()}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{b.customer?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{b.collectionDate ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.collectionPostcode ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.deliveryPostcode ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{b.driver?.name ?? <span className="text-slate-300">Unassigned</span>}</td>
                      <td className="px-4 py-3">
                        {b.podSignature
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">POD</span>
                          : b.jobStatus === 1
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Invoiced</span>
                          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Active</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

