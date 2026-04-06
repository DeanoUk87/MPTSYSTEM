"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface StorageUnit {
  id: string; unitNumber: string; imei?: string; unitSize?: string; unitType?: string;
  availability: string; calibrationDate?: string; trackable: number; jobId?: string;
  currentDriver?: { name: string };
}

const emptyForm = { unitNumber: "", imei: "", unitSize: "", unitType: "chill", availability: "Yes", calibrationDate: "" };

export default function StoragePage() {
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StorageUnit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StorageUnit | null>(null);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/storage");
    if (res.ok) setUnits(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  function openCreate() { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(u: StorageUnit) {
    setEditTarget(u);
    setForm({ unitNumber: u.unitNumber, imei: u.imei || "", unitSize: u.unitSize || "", unitType: u.unitType || "chill", availability: u.availability, calibrationDate: u.calibrationDate || "" });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.unitNumber) { toast.error("Unit number is required"); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/storage/${editTarget.id}` : "/api/storage";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Unit updated" : "Unit created");
      setModalOpen(false);
      fetchUnits();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(u: StorageUnit) {
    try {
      const res = await fetch(`/api/storage/${u.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Unit deleted");
      setDeleteTarget(null);
      fetchUnits();
    } catch (e: any) { toast.error(e.message); }
  }

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const columns: Column<StorageUnit>[] = [
    { key: "unitNumber", label: "Unit #" },
    { key: "unitType", label: "Type", render: r => (
      <Badge variant={r.unitType === "chill" ? "info" : "warning"}>{r.unitType || "—"}</Badge>
    )},
    { key: "unitSize", label: "Size" },
    { key: "availability", label: "Status", render: r => (
      <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium",
        r.availability === "Yes" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      )}>
        {r.availability === "Yes" ? "In Store" : "Assigned"}
      </span>
    )},
    { key: "currentDriver", label: "Current Driver", render: r => r.currentDriver?.name || "—" },
    { key: "imei", label: "IMEI", render: r => r.imei ? <span className="font-mono text-xs">{r.imei}</span> : "—" },
    { key: "calibrationDate", label: "Calibration", render: r => r.calibrationDate || "—" },
    { key: "trackable", label: "Tracking", render: r => r.trackable ? (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Live</span>
    ) : <span className="text-slate-400 text-xs">Off</span> },
    { key: "actions", label: "Actions", render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const inStore = units.filter(u => u.availability === "Yes").length;
  const assigned = units.filter(u => u.availability === "No").length;

  return (
    <div className="flex-1">
      <Topbar title="Storage Units" subtitle="Temperature-controlled unit management" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{units.length} total</span>
            <span className="text-emerald-600">{inStore} in store</span>
            <span className="text-amber-600">{assigned} assigned</span>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />Add Unit
          </button>
        </div>
        <DataTable data={units} columns={columns} searchKeys={["unitNumber", "imei", "unitType"]} loading={loading} emptyMessage="No storage units yet." />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Unit" : "Add Unit"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Unit Number *</label><input type="text" value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))} className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">IMEI</label><input type="text" value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} className={inputCls + " font-mono"} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Unit Type</label>
              <select value={form.unitType} onChange={e => setForm(f => ({ ...f, unitType: e.target.value }))} className={inputCls}>
                <option value="chill">Chill</option>
                <option value="ambient">Ambient</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Size</label><input type="text" value={form.unitSize} onChange={e => setForm(f => ({ ...f, unitSize: e.target.value }))} className={inputCls} placeholder="e.g. Large, Small" /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Availability</label>
              <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} className={inputCls}>
                <option value="Yes">In Store (Available)</option>
                <option value="No">Assigned (Unavailable)</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Calibration Date</label><input type="date" value={form.calibrationDate} onChange={e => setForm(f => ({ ...f, calibrationDate: e.target.value }))} className={inputCls} /></div>
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
        <p className="text-slate-600 text-sm mb-6">Delete unit <strong>{deleteTarget?.unitNumber}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
