"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Driver {
  id: string; name: string; driverType: string; email?: string; phone?: string;
  address?: string; notes?: string;
  costPerMile: number; costPerMileWeekends: number; costPerMileOutOfHours: number;
  contacts?: { id: string; driverName: string; vehicleMake?: string; vehicleRegistration?: string; driverPhone?: string }[];
}

const emptyForm = { name: "", driverType: "Driver", email: "", phone: "", address: "", notes: "", costPerMile: "", costPerMileWeekends: "", costPerMileOutOfHours: "" };

const driverTypeVariant: Record<string, any> = { Driver: "success", SubContractor: "warning", CXDriver: "info" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [detailTarget, setDetailTarget] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/drivers");
    if (res.ok) setDrivers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  function openCreate() { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(d: Driver) {
    setEditTarget(d);
    setForm({ name: d.name, driverType: d.driverType, email: d.email || "", phone: d.phone || "", address: d.address || "", notes: d.notes || "", costPerMile: String(d.costPerMile), costPerMileWeekends: String(d.costPerMileWeekends), costPerMileOutOfHours: String(d.costPerMileOutOfHours) });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/drivers/${editTarget.id}` : "/api/drivers";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Driver updated" : "Driver created");
      setModalOpen(false);
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(d: Driver) {
    try {
      const res = await fetch(`/api/drivers/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Driver deleted");
      setDeleteTarget(null);
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<Driver>[] = [
    { key: "name", label: "Name" },
    { key: "driverType", label: "Type", render: (r) => <Badge variant={driverTypeVariant[r.driverType] || "default"}>{r.driverType}</Badge> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "costPerMile", label: "Rate/Mile", render: (r) => `£${r.costPerMile.toFixed(2)}` },
    { key: "costPerMileWeekends", label: "WE Rate", render: (r) => `£${r.costPerMileWeekends.toFixed(2)}` },
    { key: "contacts", label: "Contacts", render: (r) => (
      <button onClick={() => setDetailTarget(r)} className="text-blue-600 hover:underline text-sm">{r.contacts?.length || 0} contact(s)</button>
    )},
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex-1">
      <Topbar title="Drivers" subtitle="Manage drivers, subcontractors and CX drivers" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{drivers.length} driver(s)</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />Add Driver
          </button>
        </div>
        <DataTable data={drivers} columns={columns} searchKeys={["name", "email", "phone"]} loading={loading} emptyMessage="No drivers yet." />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Driver" : "Add Driver"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Driver Type</label>
              <select value={form.driverType} onChange={e => setForm(f => ({ ...f, driverType: e.target.value }))} className={inputCls}>
                <option value="Driver">Driver</option>
                <option value="SubContractor">SubContractor</option>
                <option value="CXDriver">CXDriver</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls + " resize-none"} /></div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rates (£ per mile)</p>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Normal</label><input type="number" step="0.01" min="0" value={form.costPerMile} onChange={e => setForm(f => ({ ...f, costPerMile: e.target.value }))} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Weekend / BH</label><input type="number" step="0.01" min="0" value={form.costPerMileWeekends} onChange={e => setForm(f => ({ ...f, costPerMileWeekends: e.target.value }))} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Out of Hours</label><input type="number" step="0.01" min="0" value={form.costPerMileOutOfHours} onChange={e => setForm(f => ({ ...f, costPerMileOutOfHours: e.target.value }))} className={inputCls} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editTarget ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title={`${detailTarget?.name} — Contacts`} size="md">
        {detailTarget?.contacts?.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No contacts</p>}
        <div className="space-y-2">
          {detailTarget?.contacts?.map(c => (
            <div key={c.id} className="p-3 border border-slate-200 rounded-lg text-sm">
              <p className="font-medium">{c.driverName}</p>
              {c.vehicleMake && <p className="text-slate-500">{c.vehicleMake} {c.vehicleRegistration}</p>}
              {c.driverPhone && <p className="text-slate-500">{c.driverPhone}</p>}
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete driver <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
