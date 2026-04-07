"use client";
import { useState, useEffect, use } from "react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import { ArrowLeft, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateModal, setRateModal] = useState(false);
  const [editRate, setEditRate] = useState<any>(null);
  const [rateForm, setRateForm] = useState({ vehicleId: "", ratePerMile: "", ratePerMileWeekends: "", ratePerMileOutOfHours: "" });
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [custForm, setCustForm] = useState<any>({});

  async function loadAll() {
    setLoading(true);
    const [cRes, vRes, rRes] = await Promise.all([
      fetch(`/api/customers/${id}`),
      fetch("/api/vehicles"),
      fetch(`/api/vehicle-rates?customerId=${id}`),
    ]);
    if (cRes.ok) {
      const c = await cRes.json();
      setCustomer(c);
      setCustForm({
        name: c.name, accountNumber: c.accountNumber || "", email: c.email || "",
        phone: c.phone || "", address: c.address || "", address2: c.address2 || "",
        address3: c.address3 || "", city: c.city || "", postcode: c.postcode || "",
        contact: c.contact || "", poNumber: c.poNumber || "", poEmail: c.poEmail || "",
        deadMileage: String(c.deadMileage ?? 0), notes: c.notes || "",
      });
    }
    if (vRes.ok) setVehicles(await vRes.json());
    if (rRes.ok) setRates(await rRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [id]);

  function openAddRate() {
    setEditRate(null);
    setRateForm({ vehicleId: "", ratePerMile: "", ratePerMileWeekends: "", ratePerMileOutOfHours: "" });
    setRateModal(true);
  }

  function openEditRate(r: any) {
    setEditRate(r);
    setRateForm({
      vehicleId: r.vehicleId,
      ratePerMile: String(r.ratePerMile),
      ratePerMileWeekends: String(r.ratePerMileWeekends),
      ratePerMileOutOfHours: String(r.ratePerMileOutOfHours),
    });
    setRateModal(true);
  }

  async function handleSaveRate() {
    if (!rateForm.vehicleId) { toast.error("Select a vehicle"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/vehicle-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id, ...rateForm }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Rate saved");
      setRateModal(false);
      loadAll();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDeleteRate(rateId: string) {
    try {
      const res = await fetch(`/api/vehicle-rates?id=${rateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Rate deleted");
      loadAll();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleSaveCustomer() {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Customer updated");
      setEditModal(false);
      loadAll();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );
  if (!customer) return <div className="flex-1 flex items-center justify-center"><p className="text-slate-500">Customer not found</p></div>;

  // Vehicles not yet assigned a rate
  const usedVehicleIds = rates.map((r: any) => r.vehicleId);
  const availableVehicles = vehicles.filter((v: any) => !usedVehicleIds.includes(v.id) || editRate?.vehicleId === v.id);

  return (
    <div className="flex-1">
      <Topbar title={customer.name} subtitle={customer.accountNumber ? `Account: ${customer.accountNumber}` : "Customer Detail"} />
      <div className="p-6 space-y-6 max-w-4xl">

        <div className="flex items-center justify-between">
          <Link href="/admin/customers" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back to customers
          </Link>
          <button onClick={() => setEditModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Pencil className="w-3 h-3" /> Edit Customer
          </button>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            ["Email", customer.email], ["Phone", customer.phone],
            ["Contact", customer.contact], ["City", customer.city],
            ["Postcode", customer.postcode], ["PO Number", customer.poNumber],
            ["Dead Mileage", customer.deadMileage ? `${customer.deadMileage} mi` : null],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-medium text-slate-700">{value as string}</p>
            </div>
          ))}
          {customer.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-slate-400">Notes</p>
              <p className="text-slate-600">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Vehicle Rates */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">Vehicle Rates</h2>
              <p className="text-xs text-slate-400 mt-0.5">Per-mile rates charged to this customer per vehicle type</p>
            </div>
            <button onClick={openAddRate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Rate
            </button>
          </div>

          {rates.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-400 text-sm">No vehicle rates set yet.</p>
              <p className="text-slate-400 text-xs mt-1">Add a rate for each vehicle type this customer uses.</p>
              <button onClick={openAddRate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Add First Rate
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Vehicle", "Normal Rate", "Weekend / BH", "Out of Hours", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((r: any) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.vehicle?.name}</td>
                    <td className="px-4 py-3 text-emerald-700 font-mono">£{r.ratePerMile.toFixed(4)}/mi</td>
                    <td className="px-4 py-3 text-amber-700 font-mono">£{r.ratePerMileWeekends.toFixed(4)}/mi</td>
                    <td className="px-4 py-3 text-purple-700 font-mono">£{r.ratePerMileOutOfHours.toFixed(4)}/mi</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditRate(r)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRate(r.id)} className="p-1.5 hover:bg-rose-50 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Rate Modal */}
      <Modal open={rateModal} onClose={() => setRateModal(false)} title={editRate ? "Edit Vehicle Rate" : "Add Vehicle Rate"}>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Vehicle <span className="text-rose-500">*</span></label>
            <select value={rateForm.vehicleId}
              onChange={e => setRateForm(f => ({ ...f, vehicleId: e.target.value }))}
              disabled={!!editRate}
              className={inp}>
              <option value="">— Select vehicle —</option>
              {availableVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {availableVehicles.length === 0 && !editRate && (
              <p className="text-xs text-amber-600 mt-1">All vehicles already have rates. <Link href="/admin/vehicles" className="underline">Add a new vehicle</Link></p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Normal (£/mi)</label>
              <input type="number" step="0.0001" min="0" placeholder="e.g. 1.25"
                value={rateForm.ratePerMile}
                onChange={e => setRateForm(f => ({ ...f, ratePerMile: e.target.value }))}
                className={inp} />
              <p className="text-xs text-slate-400 mt-0.5">Weekday</p>
            </div>
            <div>
              <label className={lbl}>Weekend / BH (£/mi)</label>
              <input type="number" step="0.0001" min="0" placeholder="e.g. 1.50"
                value={rateForm.ratePerMileWeekends}
                onChange={e => setRateForm(f => ({ ...f, ratePerMileWeekends: e.target.value }))}
                className={inp} />
              <p className="text-xs text-slate-400 mt-0.5">Weekend / Bank Holiday</p>
            </div>
            <div>
              <label className={lbl}>Out of Hours (£/mi)</label>
              <input type="number" step="0.0001" min="0" placeholder="e.g. 1.75"
                value={rateForm.ratePerMileOutOfHours}
                onChange={e => setRateForm(f => ({ ...f, ratePerMileOutOfHours: e.target.value }))}
                className={inp} />
              <p className="text-xs text-slate-400 mt-0.5">Evening / overnight</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            Enter the rate in pounds per mile, e.g. <strong>1.25</strong> = £1.25/mile. Use up to 4 decimal places for precision.
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setRateModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleSaveRate} disabled={saving || !rateForm.vehicleId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editRate ? "Update Rate" : "Add Rate"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Customer" size="lg">
        <div className="grid grid-cols-2 gap-3">
          {[
            { k: "name", l: "Customer Name *" }, { k: "accountNumber", l: "Account Number" },
            { k: "email", l: "Email" }, { k: "phone", l: "Phone" },
            { k: "contact", l: "Contact Name" }, { k: "address", l: "Address 1" },
            { k: "address2", l: "Address 2" }, { k: "address3", l: "Address 3" },
            { k: "city", l: "City" }, { k: "postcode", l: "Postcode" },
            { k: "poNumber", l: "PO Number" }, { k: "poEmail", l: "PO Email" },
            { k: "deadMileage", l: "Dead Mileage" },
          ].map(({ k, l }) => (
            <div key={k}>
              <label className={lbl}>{l}</label>
              <input type="text" value={custForm[k] || ""}
                onChange={e => setCustForm((f: any) => ({ ...f, [k]: e.target.value }))}
                className={inp} />
            </div>
          ))}
          <div className="col-span-2">
            <label className={lbl}>Notes</label>
            <textarea value={custForm.notes || ""} onChange={e => setCustForm((f: any) => ({ ...f, notes: e.target.value }))}
              rows={3} className={inp + " resize-none"} />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setEditModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={handleSaveCustomer} disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
