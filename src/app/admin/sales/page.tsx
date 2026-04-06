"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Trash2, Upload, Download, Archive, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Sale {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerAccount: string;
  customerName?: string;
  jobNumber?: string;
  serviceType?: string;
  destination?: string;
  invoiceTotal?: string;
  subTotal?: string;
  vatAmount?: string;
  invoiceReady: number;
  msCreated: number;
  uploadTs?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiveFrom, setArchiveFrom] = useState("");
  const [archiveTo, setArchiveTo] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [sageModal, setSageModal] = useState(false);
  const [sageFrom, setSageFrom] = useState("");
  const [sageTo, setSageTo] = useState("");

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sales");
    if (res.ok) setSales(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/sales/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(`Imported ${data.imported} rows from ${data.filename}`);
      fetchSales();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(sale: Sale) {
    try {
      const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Sale deleted");
      setDeleteTarget(null);
      fetchSales();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleArchive() {
    if (!archiveFrom || !archiveTo) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/sales/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: archiveFrom, to: archiveTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Archive failed");
      toast.success(`Archived ${data.archivedSales} sales and ${data.archivedInvoices} invoices`);
      setArchiveModal(false);
      fetchSales();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setArchiving(false);
    }
  }

  function handleSageExport() {
    const url = `/api/sales/sage-export?from=${sageFrom}&to=${sageTo}`;
    window.open(url, "_blank");
    setSageModal(false);
  }

  function exportCSV() {
    if (!sales.length) return;
    const headers = ["Invoice #", "Invoice Date", "Customer", "Job #", "Service", "Destination", "Sub Total", "VAT", "Total", "Status"];
    const rows = sales.map((s) => [
      s.invoiceNumber, s.invoiceDate, s.customerAccount, s.jobNumber ?? "",
      s.serviceType ?? "", s.destination ?? "", s.subTotal ?? "", s.vatAmount ?? "",
      s.invoiceTotal ?? "", s.invoiceReady ? "Invoiced" : "Pending",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sales.csv";
    a.click();
  }

  const columns: Column<Sale>[] = [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "invoiceDate", label: "Date" },
    { key: "customerAccount", label: "Customer" },
    { key: "jobNumber", label: "Job #" },
    { key: "serviceType", label: "Service" },
    { key: "destination", label: "Destination" },
    { key: "invoiceTotal", label: "Total" },
    {
      key: "invoiceReady",
      label: "Status",
      render: (row) => row.invoiceReady ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Invoiced</span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Sales" subtitle="Shipment job records imported from CSV" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-500">{sales.length} record(s)</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setSageModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Sage Export
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={() => setArchiveModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors">
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <label className={`flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer ${importing ? "opacity-70 pointer-events-none" : ""}`}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? "Importing..." : "Import CSV"}
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <DataTable
          data={sales}
          columns={columns}
          searchKeys={["invoiceNumber", "customerAccount", "jobNumber", "destination"]}
          loading={loading}
          emptyMessage="No sales records. Import a CSV file to get started."
        />
      </div>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete sale record for invoice <strong>{deleteTarget?.invoiceNumber}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal open={archiveModal} onClose={() => setArchiveModal(false)} title="Archive Sales by Date" size="sm">
        <p className="text-sm text-slate-500 mb-4">Select a date range (max 14 days). Records will be moved to the archive and removed from live data.</p>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input type="date" value={archiveFrom} onChange={(e) => setArchiveFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input type="date" value={archiveTo} onChange={(e) => setArchiveTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setArchiveModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleArchive} disabled={!archiveFrom || !archiveTo || archiving} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
            {archiving ? "Archiving..." : "Archive"}
          </button>
        </div>
      </Modal>

      {/* Sage Export Modal */}
      <Modal open={sageModal} onClose={() => setSageModal(false)} title="Sage Export" size="sm">
        <p className="text-sm text-slate-500 mb-4">Filter by date range for Sage accounting export (optional).</p>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input type="date" value={sageFrom} onChange={(e) => setSageFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input type="date" value={sageTo} onChange={(e) => setSageTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setSageModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSageExport} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Download
          </button>
        </div>
      </Modal>
    </div>
  );
}
