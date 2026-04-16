"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Download, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { usePermissions } from "@/lib/use-permissions";

interface Customer {
  id: string;
  name: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  address2?: string;
  address3?: string;
  city?: string;
  postcode?: string;
  notes?: string;
  contact?: string;
  poNumber?: string;
  poEmail?: string;
  deadMileage?: number;
  jobRefStart?: number;
  hasLoginAccess?: boolean;
  _count?: { bookings: number };
}

const emptyForm = {
  name: "", accountNumber: "", email: "", phone: "",
  address: "", address2: "", address3: "", city: "", postcode: "",
  notes: "", contact: "", poNumber: "", poEmail: "", deadMileage: "0",
  jobRefStart: "1",
};

const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function CustomersPage() {
  const { has } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [credsModal, setCredsModal] = useState<{ name: string; username: string; password: string } | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/customers");
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function openCreate() {
    setEditTarget(null);
    // Generate random 6-char account number like Laravel does
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({ ...emptyForm, accountNumber: randomId });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditTarget(c);
    setForm({
      name: c.name, accountNumber: c.accountNumber || "",
      email: c.email || "", phone: c.phone || "",
      address: c.address || "", address2: c.address2 || "",
      address3: c.address3 || "", city: c.city || "", postcode: c.postcode || "",
      notes: c.notes || "", contact: c.contact || "",
      poNumber: c.poNumber || "", poEmail: c.poEmail || "",
      deadMileage: String(c.deadMileage ?? 0),
      jobRefStart: String(c.jobRefStart ?? 1),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Customer name is required"); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/customers/${editTarget.id}` : "/api/customers";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Customer updated" : "Customer created");
      setModalOpen(false);
      fetchCustomers();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(c: Customer) {
    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer deleted");
      setDeleteTarget(null);
      fetchCustomers();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleGrantAccess(c: Customer) {
    setLoginLoading(c.id);
    try {
      const res = await fetch(`/api/customers/${c.id}/access`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setCredsModal({ name: c.name, username: data.username, password: data.password });
      fetchCustomers();
    } catch (e: any) { toast.error(e.message); } finally { setLoginLoading(null); }
  }

  function exportCSV() {
    if (!customers.length) return;
    const headers = ["Name", "Account", "Email", "Phone", "City", "Postcode", "Contact"];
    const rows = customers.map(c => [c.name, c.accountNumber ?? "", c.email ?? "", c.phone ?? "", c.city ?? "", c.postcode ?? "", c.contact ?? ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "customers.csv"; a.click();
  }

  const columns: Column<Customer>[] = [
    { key: "name", label: "Customer Name" },
    { key: "accountNumber", label: "Account #", render: r => r.accountNumber ? <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.accountNumber}</span> : <span className="text-slate-300">—</span> },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "contact", label: "Contact" },
    { key: "_count", label: "Jobs", render: r => <span className="font-medium">{r._count?.bookings ?? 0}</span> },
    {
      key: "actions", label: "Actions",
      render: r => (
        <div className="flex items-center gap-1">
          {has("customers_access") && (
          <button
            onClick={() => handleGrantAccess(r)}
            disabled={loginLoading === r.id}
            title={r.hasLoginAccess ? "Reset portal login credentials" : "Grant portal login access"}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              r.hasLoginAccess
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {loginLoading === r.id ? "..." : r.hasLoginAccess ? "🔓 Login" : "🔒 Login"}
          </button>
          )}
          {has("customers_rates") && (
          <Link href={`/admin/customers/${r.id}`}
            className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
            Rates
          </Link>
          )}
          {has("customers_edit") && (
            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600"><Pencil className="w-4 h-4" /></button>
          )}
          {has("customers_delete") && (
            <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Customers" subtitle="Manage customer accounts, contacts and rates" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{customers.length} customer(s)</p>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        </div>

        <DataTable data={customers} columns={columns} searchKeys={["name", "accountNumber", "email", "phone"]}
          loading={loading} emptyMessage="No customers yet. Add your first customer." />
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Customer" : "Add Customer"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name <span className="text-rose-500">*</span></label>
              <input type="text" value={form.name} onChange={e => set("name", e.target.value)} className={inp} placeholder="Company or customer name" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Account Number</label>
              <input type="text" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} className={inp + " font-mono uppercase"} placeholder="e.g. ABC123" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => set("phone", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name</label>
              <input type="text" value={form.contact} onChange={e => set("contact", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address Line 1</label>
              <input type="text" value={form.address} onChange={e => set("address", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address Line 2</label>
              <input type="text" value={form.address2} onChange={e => set("address2", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address Line 3</label>
              <input type="text" value={form.address3} onChange={e => set("address3", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => set("city", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Postcode</label>
              <input type="text" value={form.postcode} onChange={e => set("postcode", e.target.value.toUpperCase())} className={inp + " uppercase"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default PO Number</label>
              <input type="text" value={form.poNumber} onChange={e => set("poNumber", e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PO Email</label>
              <input type="email" value={form.poEmail} onChange={e => set("poEmail", e.target.value)} className={inp} />
            </div>
            {has("customers_jobref") && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Job Ref Start Number</label>
              <input type="number" min="1" value={form.jobRefStart} onChange={e => set("jobRefStart", e.target.value)} className={inp} />
              <p className="text-xs text-slate-400 mt-0.5">First job ref number for this customer (e.g. 1 = ACC-00001)</p>
            </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Internal Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className={inp + " resize-none"} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editTarget ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete customer <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>

      {/* Portal Credentials Modal */}
      <Modal open={!!credsModal} onClose={() => setCredsModal(null)} title="Portal Login Credentials" size="sm">
        {credsModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Portal access granted for <strong>{credsModal.name}</strong>. Share these credentials securely:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Username:</span><span className="font-semibold text-slate-800">{credsModal.username}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Password:</span><span className="font-semibold text-slate-800">{credsModal.password}</span></div>
            </div>
            <p className="text-xs text-amber-600">This password won't be shown again. Copy it now.</p>
            <button onClick={() => setCredsModal(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Done</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
