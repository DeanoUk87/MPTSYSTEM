"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import { Archive, FileText } from "lucide-react";

interface SaleArchive {
  id: string; invoiceNumber: string; invoiceDate: string;
  customerAccount: string; customerName?: string; jobNumber?: string;
  destination?: string; invoiceTotal?: string; archivedAt: string;
}

interface InvoiceArchive {
  id: string; invoiceNumber: string; invoiceDate: string;
  customerAccount: string; dueDate?: string;
  emailStatus: number; printer: number; archivedAt: string;
}

export default function ArchivePage() {
  const [tab, setTab] = useState<"sales" | "invoices">("sales");
  const [salesData, setSalesData] = useState<SaleArchive[]>([]);
  const [invoicesData, setInvoicesData] = useState<InvoiceArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const [salesRes, invRes] = await Promise.all([
        fetch("/api/archive?type=sales"),
        fetch("/api/archive?type=invoices"),
      ]);
      if (cancelled) return;
      if (salesRes.ok) setSalesData(await salesRes.json());
      if (invRes.ok) setInvoicesData(await invRes.json());
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const saleColumns: Column<SaleArchive>[] = [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "invoiceDate", label: "Invoice Date" },
    { key: "customerAccount", label: "Customer" },
    { key: "jobNumber", label: "Job #" },
    { key: "destination", label: "Destination" },
    { key: "invoiceTotal", label: "Total" },
    { key: "archivedAt", label: "Archived", render: (r) => new Date(r.archivedAt).toLocaleDateString() },
  ];

  const invoiceColumns: Column<InvoiceArchive>[] = [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "invoiceDate", label: "Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "customerAccount", label: "Customer" },
    {
      key: "emailStatus", label: "Email",
      render: (r) => r.emailStatus === 1
        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Sent</span>
        : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Unsent</span>,
    },
    { key: "archivedAt", label: "Archived", render: (r) => new Date(r.archivedAt).toLocaleDateString() },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Archive" subtitle="View archived sales and invoice records" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab("sales")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === "sales" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived Sales ({salesData.length})
          </button>
          <button
            onClick={() => setTab("invoices")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === "invoices" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Archived Invoices ({invoicesData.length})
          </button>
        </div>

        {tab === "sales" ? (
          <DataTable
            data={salesData}
            columns={saleColumns}
            searchKeys={["invoiceNumber", "customerAccount", "jobNumber", "destination"]}
            loading={loading}
            emptyMessage="No archived sales records."
          />
        ) : (
          <DataTable
            data={invoicesData}
            columns={invoiceColumns}
            searchKeys={["invoiceNumber", "customerAccount"]}
            loading={loading}
            emptyMessage="No archived invoices."
          />
        )}
      </div>
    </div>
  );
}
