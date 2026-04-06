import { prisma } from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import { Users, Package, FileText, CheckCircle, Clock, Mail, Archive } from "lucide-react";

async function getStats() {
  const [
    totalCustomers,
    totalSales,
    totalInvoices,
    pendingInvoices,
    sentInvoices,
    unsent,
    archivedSales,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { printer: 0 } }),
    prisma.invoice.count({ where: { emailStatus: 1 } }),
    prisma.invoice.count({ where: { emailStatus: 0 } }),
    prisma.saleArchive.count(),
  ]);
  return { totalCustomers, totalSales, totalInvoices, pendingInvoices, sentInvoices, unsent, archivedSales };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const recentInvoices = await prisma.invoice.findMany({
    take: 10,
    orderBy: { dateCreated: "desc" },
    include: { customer: true },
  });

  return (
    <div className="flex-1">
      <Topbar title="Dashboard" subtitle="Welcome back to MP Booking System" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="blue" />
          <StatCard title="Total Sales" value={stats.totalSales} icon={Package} color="purple" />
          <StatCard title="Total Invoices" value={stats.totalInvoices} icon={FileText} color="amber" />
          <StatCard title="Emails Sent" value={stats.sentInvoices} icon={Mail} color="green" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={Clock} color="amber" trend="Awaiting print/send" />
          <StatCard title="Unsent Invoices" value={stats.unsent} icon={CheckCircle} color="rose" trend="Email not yet dispatched" />
          <StatCard title="Archived Sales" value={stats.archivedSales} icon={Archive} color="purple" trend="Moved to archive" />
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">Recent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400">No invoices yet.</td>
                  </tr>
                )}
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.customerAccount}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.invoiceDate}</td>
                    <td className="px-4 py-3">
                      {inv.emailStatus === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Sent</span>
                      ) : inv.printer === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
