"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { FileText, Zap, Send, Mail, Trash2, Eye, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerAccount: string;
  printer: number;
  emailStatus: number;
  terms?: string;
  poNumber?: string;
}

interface InvoiceDetail extends Invoice {
  customer?: { customerEmail?: string };
  sales: any[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [massSending, setMassSending] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewDetail, setViewDetail] = useState<InvoiceDetail | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/invoices/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      toast.success(data.generated > 0 ? `Generated ${data.generated} invoice(s)` : data.message);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleMassSend() {
    setMassSending(true);
    try {
      const res = await fetch("/api/invoices/mass-send", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mass send failed");
      toast.success(data.sent > 0 ? `Sent ${data.sent} invoice email(s). Failed: ${data.failed}` : data.message);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMassSending(false);
    }
  }

  async function handleSend(invoice: Invoice) {
    setSending(invoice.id);
    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      toast.success(`Invoice ${invoice.invoiceNumber} sent`);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(null);
    }
  }

  async function handleView(invoice: Invoice) {
    const res = await fetch(`/api/invoices/${invoice.id}`);
    if (res.ok) {
      setViewDetail(await res.json());
      setViewModal(true);
      // Mark as printer=1 if not yet opened
      if (invoice.printer === 0) {
        await fetch(`/api/invoices/${invoice.id}`, {
          method: "PATCH",
        }).catch(() => {});
        fetchInvoices();
      }
    }
  }

  async function handleDelete(invoice: Invoice) {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Invoice deleted");
      setDeleteTarget(null);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const printerStatus = (p: number) => {
    if (p === 2) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Printed</span>;
    if (p === 1) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Ready</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
  };

  const columns: Column<Invoice>[] = [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "invoiceDate", label: "Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "customerAccount", label: "Customer" },
    { key: "terms", label: "Terms" },
    { key: "printer", label: "Print Status", render: (row) => printerStatus(row.printer) },
    {
      key: "emailStatus",
      label: "Email",
      render: (row) => row.emailStatus === 1
        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Sent</span>
        : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Unsent</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleView(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSend(row)}
            disabled={sending === row.id || row.emailStatus === 1}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-40"
            title="Send Email"
          >
            {sending === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Invoices" subtitle="Generate, view and send customer invoices" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-500">{invoices.length} invoice(s) &mdash; {invoices.filter((i) => i.emailStatus === 0).length} unsent</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMassSend}
              disabled={massSending}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              {massSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Mass Send
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate All Invoices"}
            </button>
          </div>
        </div>

        <DataTable
          data={invoices}
          columns={columns}
          searchKeys={["invoiceNumber", "customerAccount"]}
          loading={loading}
          emptyMessage="No invoices yet. Import sales data and click 'Generate All Invoices'."
        />
      </div>

      {/* Invoice View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={`Invoice ${viewDetail?.invoiceNumber}`} size="xl">
        {viewDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-800 mb-2">Invoice Details</p>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-medium">Invoice #:</span> {viewDetail.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {viewDetail.invoiceDate}</p>
                  <p><span className="font-medium">Due:</span> {viewDetail.dueDate ?? "N/A"}</p>
                  <p><span className="font-medium">Terms:</span> {viewDetail.terms ?? "N/A"}</p>
                  <p><span className="font-medium">PO:</span> {viewDetail.poNumber ?? "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-2">Customer</p>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-medium">Account:</span> {viewDetail.customerAccount}</p>
                  <p><span className="font-medium">Email:</span> {viewDetail.customer?.customerEmail ?? "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-3">Job Lines ({viewDetail.sales.length})</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Job #", "Job Date", "Service", "Destination", "Items", "Weight", "Sub Total", "VAT", "Total"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.sales.map((s: any) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{s.jobNumber ?? "-"}</td>
                        <td className="px-3 py-2">{s.jobDate ?? "-"}</td>
                        <td className="px-3 py-2">{s.serviceType ?? "-"}</td>
                        <td className="px-3 py-2">{s.destination ?? "-"}</td>
                        <td className="px-3 py-2">{s.items ?? "-"}</td>
                        <td className="px-3 py-2">{s.weight ?? "-"}</td>
                        <td className="px-3 py-2">£{s.subTotal ?? "0"}</td>
                        <td className="px-3 py-2">£{s.vatAmount ?? "0"}</td>
                        <td className="px-3 py-2 font-medium">£{s.invoiceTotal ?? "0"}</td>
                      </tr>
                    ))}
                    {viewDetail.sales.length === 0 && (
                      <tr><td colSpan={9} className="px-3 py-4 text-center text-slate-400">No job lines</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setViewModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Close</button>
              <button
                onClick={() => { setViewModal(false); handleSend(viewDetail); }}
                disabled={viewDetail.emailStatus === 1}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {viewDetail.emailStatus === 1 ? "Already Sent" : "Send Email"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete invoice <strong>{deleteTarget?.invoiceNumber}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
