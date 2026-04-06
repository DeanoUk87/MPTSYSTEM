"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Vehicle { id: string; name: string; costPerMile: number; driverId?: string; }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ name: "", costPerMile: "", driverId: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const [vRes, dRes] = await Promise.all([fetch("/api/vehicles"), fetch("/api/drivers?type=Driver")]);
    if (vRes.ok) setVehicles(await vRes.json());
    if (dRes.ok) setDrivers(await dRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  function openCreate() { setEditTarget(null); setForm({ name: "", costPerMile: "", driverId: "" }); setModalOpen(true); }
  function openEdit(v: Vehicle) {
    setEditTarget(v);
    setForm({ name: v.name, costPerMile: String(v.costPerMile), driverId: v.driverId || "" });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/vehicles/${editTarget.id}` : "/api/vehicles";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Vehicle updated" : "Vehicle created");
      setModalOpen(false);
      fetchVehicles();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(v: Vehicle) {
    try {
      const res = await fetch(`/api/vehicles/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Vehicle deleted");
      setDeleteTarget(null);
      fetchVehicles();
    } catch (e: any) { toast.error(e.message); }
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const columns: Column<Vehicle>[] = [
    { key: "name", label: "Vehicle Name" },
    { key: "costPerMile", label: "Default Rate/Mile", render: r => `£${r.costPerMile.toFixed(2)}` },
    { key: "actions", label: "Actions", render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex-1">
      <Topbar title="Vehicles" subtitle="Vehicle types and default rates" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{vehicles.length} vehicle type(s)</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />Add Vehicle
          </button>
        </div>
        <DataTable data={vehicles} columns={columns} searchKeys={["name"]} loading={loading} emptyMessage="No vehicles yet." />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Vehicle" : "Add Vehicle"}>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Small Van, Luton, Artic" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Default Rate per Mile (£)</label>
            <input type="number" step="0.01" min="0" value={form.costPerMile} onChange={e => setForm(f => ({ ...f, costPerMile: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Default Driver</label>
            <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className={inputCls}>
              <option value="">None</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editTarget ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete vehicle <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
