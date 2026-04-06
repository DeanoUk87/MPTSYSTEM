"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Download, Upload, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  customerAccount: string;
  customerEmail: string;
  customerEmailBcc?: string;
  customerPhone?: string;
  termsOfPayment?: string;
  poNumber?: string;
}

const emptyCustomer: Omit<Customer, "id"> = {
  customerAccount: "",
  customerEmail: "",
  customerEmailBcc: "",
  customerPhone: "",
  termsOfPayment: "",
  poNumber: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/customers");
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyCustomer);
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditTarget(customer);
    setForm({
      customerAccount: customer.customerAccount,
      customerEmail: customer.customerEmail,
      customerEmailBcc: customer.customerEmailBcc ?? "",
      customerPhone: customer.customerPhone ?? "",
      termsOfPayment: customer.termsOfPayment ?? "",
      poNumber: customer.poNumber ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editTarget ? `/api/customers/${editTarget.id}` : "/api/customers";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Customer updated" : "Customer created");
      setModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer deleted");
      setDeleteTarget(null);
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function exportCSV() {
    if (!customers.length) return;
    const headers = ["Account", "Email", "BCC Email", "Phone", "Terms", "PO Number"];
    const rows = customers.map((c) => [
      c.customerAccount, c.customerEmail, c.customerEmailBcc ?? "",
      c.customerPhone ?? "", c.termsOfPayment ?? "", c.poNumber ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Customer>[] = [
    { key: "customerAccount", label: "Account" },
    { key: "customerEmail", label: "Email" },
    { key: "customerPhone", label: "Phone" },
    { key: "termsOfPayment", label: "Terms" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
            <Pencil className="w-4 h-4" />
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
      <Topbar title="Customers" subtitle="Manage customer accounts and contact details" />
      <div className="p-6 space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{customers.length} customer(s) total</p>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        <DataTable
          data={customers}
          columns={columns}
          searchKeys={["customerAccount", "customerEmail", "customerPhone"]}
          loading={loading}
          emptyMessage="No customers found. Add your first customer above."
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Customer" : "Add Customer"}
      >
        <div className="space-y-4">
          {[
            { label: "Account Code *", key: "customerAccount", required: true },
            { label: "Email Address *", key: "customerEmail", required: true },
            { label: "BCC Email", key: "customerEmailBcc" },
            { label: "Phone Number", key: "customerPhone" },
            { label: "Terms of Payment", key: "termsOfPayment" },
            { label: "PO Number", key: "poNumber" },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.customerAccount || !form.customerEmail}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : editTarget ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">
          Are you sure you want to delete customer <strong>{deleteTarget?.customerAccount}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
