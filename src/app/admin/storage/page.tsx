"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { Plus, Pencil, Trash2, Thermometer, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface StorageUnit {
  id: string; unitNumber: string; imei?: string; unitSize?: string; unitType?: string;
  availability: string; calibrationDate?: string; trackable: number; jobId?: string;
  currentDriver?: { name: string };
  assignedDriverName?: string | null;
  isDriverContact?: boolean;
}

const emptyForm = { unitNumber: "", imei: "", unitSize: "", unitType: "chill", availability: "Yes", calibrationDate: "", trackable: 0 };

export default function StoragePage() {
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempData, setTempData] = useState<Record<string, any>>({});
  const [tempLoading, setTempLoading] = useState(false);
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

  async function fetchTemperatures() {
    setTempLoading(true);
    try {
      const res = await fetch("/api/storage/temperature");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, any> = {};
        data.forEach((d: any) => { map[d.id] = d; });
        setTempData(map);
      }
    } finally { setTempLoading(false); }
  }

  // Auto-refresh temperatures every 60s
  useEffect(() => {
    fetchTemperatures();
    const interval = setInterval(fetchTemperatures, 60000);
    return () => clearInterval(interval);
  }, []);

  function openCreate() { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(u: StorageUnit) {
    setEditTarget(u);
    setForm({ unitNumber: u.unitNumber, imei: u.imei || "", unitSize: u.unitSize || "", unitType: u.unitType || "chill", availability: u.availability, calibrationDate: u.calibrationDate || "", trackable: u.trackable ?? 0 });
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
    { key: "currentDriver", label: "Current Driver", render: r => {
      if (r.assignedDriverName) return <span title={r.isDriverContact ? "Driver Contact" : "Driver"}>{r.assignedDriverName}{r.isDriverContact ? <span className="ml-1 text-xs text-purple-500">(contact)</span> : null}</span>;
      return r.currentDriver?.name || "—";
    }},
    { key: "imei", label: "IMEI", render: r => r.imei ? <span className="font-mono text-xs">{r.imei}</span> : "—" },
    { key: "calibrationDate", label: "Calibration", render: r => r.calibrationDate || "—" },
    { key: "trackable", label: "Temp / Tracking", render: r => {
      const td = tempData[r.id];
      if (r.trackable && td?.temperature != null) {
        const temp = parseFloat(td.temperature);
        const color = temp < 0 ? "text-blue-700 bg-blue-50" : temp < 5 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50";
        return (
          <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold", color)}>
            <Thermometer className="w-3 h-3" />{td.temperature}°C
          </span>
        );
      }
      return r.trackable
        ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Live</span>
        : <span className="text-slate-400 text-xs">Off</span>;
    }},
    { key: "actions", label: "Actions", render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  const inStore = units.filter(u => u.availability === "Yes").length;
  const assigned = units.filter(u => u.availability === "No").length;

  // Temperature range checks
  const tempAlerts = units.filter(u => {
    if (!u.trackable) return false;
    const td = tempData[u.id];
    if (!td?.temperature) return false;
    const temp = parseFloat(td.temperature);
    const type = (u.unitType || "chill").toLowerCase();
    if (type === "chill") return temp < 2 || temp > 8;
    if (type === "ambient") return temp < 15 || temp > 25;
    if (type === "frozen") return temp < -25 || temp > -18;
    return false;
  }).map(u => {
    const td = tempData[u.id];
    const temp = parseFloat(td.temperature);
    const type = (u.unitType || "chill").toLowerCase();
    const range = type === "chill" ? "2–8°C" : type === "frozen" ? "-25 to -18°C" : "15–25°C";
    return { unit: u, temp, range };
  });

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

        {/* GPS API info */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <Thermometer className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Live GPS temperature:</span> add <code className="bg-blue-100 px-1 rounded">LIVE_DEVICE_API=your_gpslive_key</code> to your <code className="bg-blue-100 px-1 rounded">.env</code> file on the server (gpslive.co.uk API key). Without it, demo temperatures are generated for units that have an IMEI set.
          </div>
        </div>

        {/* Temperature alerts */}
        {tempAlerts.length > 0 && (
          <div className="space-y-2">
            {tempAlerts.map(({ unit, temp, range }) => (
              <div key={unit.id} className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                <Thermometer className="w-4 h-4 text-rose-600 shrink-0" />
                <span><strong>{unit.unitNumber}</strong> ({unit.unitType}) — temperature <strong>{temp.toFixed(1)}°C</strong> is outside the expected range <strong>{range}</strong></span>
                {(unit.assignedDriverName || unit.currentDriver?.name) && <span className="ml-auto text-xs text-rose-600 shrink-0">{unit.isDriverContact ? "Driver Contact" : "Driver"}: {unit.assignedDriverName || unit.currentDriver?.name}</span>}
              </div>
            ))}
          </div>
        )}
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
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">Live Temperature Tracking</p>
              <p className="text-xs text-slate-400 mt-0.5">Auto-enabled when an IMEI is set. Requires LIVE_DEVICE_API in .env for real data.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, trackable: f.trackable ? 0 : 1 }))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.trackable ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-300"}`}
            >
              {form.trackable ? "✓ Enabled" : "Disabled"}
            </button>
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
