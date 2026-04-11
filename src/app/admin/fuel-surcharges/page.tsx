"use client";
import { useState, useEffect } from "react";
import { Loader2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface FuelSurcharge { id: string; price: number; percentage: number; }

export default function FuelSurchargesPage() {
  const [items, setItems] = useState<FuelSurcharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ price: "", percentage: "" });
  const [adding, setAdding] = useState(false);
  const [newData, setNewData] = useState({ price: "", percentage: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/fuel-surcharges");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: FuelSurcharge) {
    setEditId(item.id);
    setEditData({ price: String(item.price), percentage: String(item.percentage) });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/fuel-surcharges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(editData.price), percentage: parseFloat(editData.percentage) }),
    });
    if (res.ok) { toast.success("Updated"); setEditId(null); load(); }
    else toast.error("Failed to update");
    setSaving(false);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this fuel surcharge?")) return;
    const res = await fetch(`/api/fuel-surcharges/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); load(); }
    else toast.error("Failed to delete");
  }

  async function addItem() {
    if (!newData.price || !newData.percentage) { toast.error("Fill in all fields"); return; }
    setSaving(true);
    const res = await fetch("/api/fuel-surcharges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(newData.price), percentage: parseFloat(newData.percentage) }),
    });
    if (res.ok) { toast.success("Added"); setAdding(false); setNewData({ price: "", percentage: "" }); load(); }
    else toast.error("Failed to add");
    setSaving(false);
  }

  const inp = "px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32";

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fuel Surcharges</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage the fuel surcharge options shown on bookings</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Surcharge
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Diesel Price (p/litre)</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Surcharge %</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </td></tr>
            )}
            {!loading && items.length === 0 && !adding && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">No fuel surcharges configured</td></tr>
            )}
            {adding && (
              <tr className="bg-blue-50">
                <td className="px-5 py-3">
                  <input type="number" step="0.1" placeholder="e.g. 150" value={newData.price}
                    onChange={e => setNewData(p => ({ ...p, price: e.target.value }))} className={inp} autoFocus />
                </td>
                <td className="px-5 py-3">
                  <input type="number" step="0.1" placeholder="e.g. 5.5" value={newData.percentage}
                    onChange={e => setNewData(p => ({ ...p, percentage: e.target.value }))} className={inp} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={addItem} disabled={saving}
                      className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setAdding(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  {editId === item.id
                    ? <input type="number" step="0.1" value={editData.price}
                        onChange={e => setEditData(p => ({ ...p, price: e.target.value }))} className={inp} autoFocus />
                    : <span className="font-medium text-slate-800">{item.price}p</span>
                  }
                </td>
                <td className="px-5 py-3">
                  {editId === item.id
                    ? <input type="number" step="0.1" value={editData.percentage}
                        onChange={e => setEditData(p => ({ ...p, percentage: e.target.value }))} className={inp} />
                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {item.percentage}%
                      </span>
                  }
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {editId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} disabled={saving}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
