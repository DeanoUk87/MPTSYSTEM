"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { Plus, Pencil, Trash2, Users, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface DriverContact {
  id: string; driverName: string; vehicleMake?: string;
  vehicleRegistration?: string; driverPhone?: string;
}

interface Driver {
  id: string; name: string; driverType: string;
  email?: string; phone?: string; notes?: string;
  costPerMile: number; costPerMileWeekends: number; costPerMileOutOfHours: number;
  contacts?: DriverContact[];
}

const emptyDriverForm = {
  name: "", driverType: "Driver", email: "", phone: "", notes: "",
  costPerMile: "", costPerMileWeekends: "", costPerMileOutOfHours: "",
};

const emptyContactForm = {
  driverName: "", vehicleMake: "", vehicleRegistration: "", driverPhone: "",
};

const typeVariant: Record<string, any> = { Driver: "success", SubContractor: "warning", CXDriver: "info" };
const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Driver modal
  const [driverModal, setDriverModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState(emptyDriverForm);
  const [savingDriver, setSavingDriver] = useState(false);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);

  // Contacts modal
  const [contactsModal, setContactsModal] = useState(false);
  const [contactsDriver, setContactsDriver] = useState<Driver | null>(null);
  const [contactModal, setContactModal] = useState(false);
  const [editContact, setEditContact] = useState<DriverContact | null>(null);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [savingContact, setSavingContact] = useState(false);
  const [viewContactModal, setViewContactModal] = useState(false);
  const [viewContact, setViewContact] = useState<DriverContact | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/drivers");
    if (res.ok) setDrivers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  // Refresh contacts driver when drivers list updates
  useEffect(() => {
    if (contactsDriver) {
      const updated = drivers.find(d => d.id === contactsDriver.id);
      if (updated) setContactsDriver(updated);
    }
  }, [drivers]);

  function openCreateDriver() {
    setEditDriver(null);
    setDriverForm(emptyDriverForm);
    setDriverModal(true);
  }

  function openEditDriver(d: Driver) {
    setEditDriver(d);
    setDriverForm({
      name: d.name, driverType: d.driverType,
      email: d.email || "", phone: d.phone || "",
      notes: d.notes || "",
      costPerMile: String(d.costPerMile),
      costPerMileWeekends: String(d.costPerMileWeekends),
      costPerMileOutOfHours: String(d.costPerMileOutOfHours),
    });
    setDriverModal(true);
  }

  async function saveDriver() {
    if (!driverForm.name) { toast.error("Name is required"); return; }
    setSavingDriver(true);
    try {
      const url = editDriver ? `/api/drivers/${editDriver.id}` : "/api/drivers";
      const res = await fetch(url, {
        method: editDriver ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editDriver ? "Driver updated" : "Driver created");
      setDriverModal(false);
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); } finally { setSavingDriver(false); }
  }

  async function handleDeleteDriver(d: Driver) {
    try {
      const res = await fetch(`/api/drivers/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Driver deleted");
      setDeleteDriver(null);
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); }
  }

  function openContacts(d: Driver) {
    setContactsDriver(d);
    setContactsModal(true);
  }

  function openAddContact() {
    setEditContact(null);
    setContactForm(emptyContactForm);
    setContactModal(true);
  }

  function openEditContact(c: DriverContact) {
    setEditContact(c);
    setContactForm({
      driverName: c.driverName, vehicleMake: c.vehicleMake || "",
      vehicleRegistration: c.vehicleRegistration || "", driverPhone: c.driverPhone || "",
    });
    setContactModal(true);
  }

  async function saveContact() {
    if (!contactForm.driverName || !contactsDriver) return;
    setSavingContact(true);
    try {
      const url = editContact
        ? `/api/drivers/${contactsDriver.id}/contacts/${editContact.id}`
        : `/api/drivers/${contactsDriver.id}/contacts`;
      const res = await fetch(url, {
        method: editContact ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editContact ? "Contact updated" : "Contact added");
      setContactModal(false);
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); } finally { setSavingContact(false); }
  }

  async function deleteContact(contactId: string) {
    if (!contactsDriver) return;
    try {
      const res = await fetch(`/api/drivers/${contactsDriver.id}/contacts/${contactId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Contact removed");
      fetchDrivers();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<Driver>[] = [
    { key: "name", label: "Name" },
    { key: "driverType", label: "Type", render: r => <Badge variant={typeVariant[r.driverType] || "default"}>{r.driverType}</Badge> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "costPerMile", label: "Normal Rate", render: r => `£${r.costPerMile.toFixed(2)}/mi` },
    { key: "costPerMileWeekends", label: "WE Rate", render: r => `£${r.costPerMileWeekends.toFixed(2)}/mi` },
    { key: "costPerMileOutOfHours", label: "OOH Rate", render: r => `£${r.costPerMileOutOfHours.toFixed(2)}/mi` },
    {
      key: "contacts", label: "Contacts",
      render: r => (r.driverType === "SubContractor" || r.driverType === "CXDriver") ? (
        <button onClick={() => openContacts(r)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 font-medium">
          <Users className="w-3 h-3" /> {r.contacts?.length ?? 0} driver(s)
        </button>
      ) : <span className="text-slate-300 text-xs">—</span>
    },
    {
      key: "actions", label: "Actions",
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditDriver(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setDeleteDriver(r)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Drivers" subtitle="Manage drivers, subcontractors and CX drivers" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{drivers.length} driver(s)</p>
          <button onClick={openCreateDriver} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        </div>
        <DataTable data={drivers} columns={columns} searchKeys={["name", "email", "phone"]} loading={loading} />
      </div>

      {/* ── Driver Create/Edit Modal ── */}
      <Modal open={driverModal} onClose={() => setDriverModal(false)} title={editDriver ? "Edit Driver" : "Add Driver"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input type="text" value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={driverForm.driverType} onChange={e => setDriverForm(f => ({ ...f, driverType: e.target.value }))} className={inp}>
                <option value="Driver">Driver</option>
                <option value="SubContractor">SubContractor</option>
                <option value="CXDriver">CXDriver</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={driverForm.email} onChange={e => setDriverForm(f => ({ ...f, email: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input type="text" value={driverForm.phone} onChange={e => setDriverForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={driverForm.notes} onChange={e => setDriverForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp + " resize-none"} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-t pt-3">Rates (£ per mile)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "costPerMile", l: "Normal" },
              { k: "costPerMileWeekends", l: "Weekend / BH" },
              { k: "costPerMileOutOfHours", l: "Out of Hours" },
            ].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{l}</label>
                <input type="number" step="0.01" min="0" value={(driverForm as any)[k]}
                  onChange={e => setDriverForm(f => ({ ...f, [k]: e.target.value }))} className={inp} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDriverModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={saveDriver} disabled={savingDriver} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {savingDriver ? "Saving..." : editDriver ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Contacts List Modal ── */}
      <Modal open={contactsModal} onClose={() => setContactsModal(false)}
        title={`${contactsDriver?.name} — Driver Contacts`} size="lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{contactsDriver?.contacts?.length ?? 0} contact(s) under this {contactsDriver?.driverType}</p>
            <button onClick={openAddContact}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
              <Plus className="w-3 h-3" /> Add Driver
            </button>
          </div>

          {(contactsDriver?.contacts?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No drivers added yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Driver Name", "Vehicle Make", "Registration", "Phone", ""].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contactsDriver?.contacts?.map((c: DriverContact) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{c.driverName}</td>
                    <td className="px-3 py-2 text-slate-600">{c.vehicleMake || "—"}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{c.vehicleRegistration || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{c.driverPhone || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setViewContact(c); setViewContactModal(true); }}
                          className="p-1 rounded hover:bg-blue-50 text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEditContact(c)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteContact(c.id)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* ── Add/Edit Contact Modal ── */}
      <Modal open={contactModal} onClose={() => setContactModal(false)}
        title={editContact ? "Edit Driver Contact" : "Add Driver Contact"} size="md">
        <div className="space-y-3">
          {[
            { k: "driverName", l: "Driver Name *" },
            { k: "vehicleMake", l: "Vehicle Make" },
            { k: "vehicleRegistration", l: "Vehicle Registration" },
            { k: "driverPhone", l: "Driver Phone" },
          ].map(({ k, l }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{l}</label>
              <input type="text" value={(contactForm as any)[k]}
                onChange={e => setContactForm(f => ({ ...f, [k]: e.target.value }))}
                className={inp + (k === "vehicleRegistration" ? " uppercase font-mono" : "")} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setContactModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={saveContact} disabled={savingContact || !contactForm.driverName}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {savingContact ? "Saving..." : editContact ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Contact Detail Modal ── */}
      <Modal open={viewContactModal} onClose={() => setViewContactModal(false)} title="Driver Contact Details" size="sm">
        {viewContact && (
          <div className="space-y-3 text-sm">
            {[
              ["Driver Name", viewContact.driverName],
              ["Vehicle Make", viewContact.vehicleMake],
              ["Registration", viewContact.vehicleRegistration],
              ["Phone", viewContact.driverPhone],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-slate-400 w-32 shrink-0">{label}:</span>
                <span className="font-medium text-slate-700">{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <button onClick={() => setViewContactModal(false)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal open={!!deleteDriver} onClose={() => setDeleteDriver(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete driver <strong>{deleteDriver?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteDriver(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteDriver && handleDeleteDriver(deleteDriver)}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
