"use client";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
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
  const invoices: any[] = Array.isArray(data?.recentInvoices) ? data.recentInvoices : [];

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
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">Recent Invoices</h2>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {data === null ? "Loading..." : "No invoices yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Invoice #", "Customer", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{inv.customerAccount}</td>
                      <td className="px-4 py-3 text-slate-500">{inv.invoiceDate}</td>
                      <td className="px-4 py-3">
                        {inv.emailStatus === 1
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Sent</span>
                          : inv.printer === 0
                          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Ready</span>
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
