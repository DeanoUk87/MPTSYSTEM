"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Shield, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Permission { id: string; name: string; }
interface RoleRecord { id: string; name: string; permissions: { permission: Permission }[]; _count: { users: number }; }

// Display names for permission modules
const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  drivers: "Drivers",
  vehicles: "Vehicles",
  storage: "Storage Units",
  customers: "Customers",
  addresses: "Addresses",
  fuel: "Fuel Surcharges",
  map: "Map Routing",
  legacy: "History Records",
  settings: "Settings",
  users: "Users",
  roles: "Roles & Permissions",
  driver: "Driver Portal",
};

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

const MODULE_COLORS: Record<string, string> = {
  dashboard: "bg-blue-50 border-blue-200",
  bookings: "bg-emerald-50 border-emerald-200",
  drivers: "bg-amber-50 border-amber-200",
  vehicles: "bg-purple-50 border-purple-200",
  storage: "bg-cyan-50 border-cyan-200",
  customers: "bg-rose-50 border-rose-200",
  addresses: "bg-orange-50 border-orange-200",
  fuel: "bg-yellow-50 border-yellow-200",
  map: "bg-teal-50 border-teal-200",
  legacy: "bg-violet-50 border-violet-200",
  settings: "bg-slate-50 border-slate-200",
  users: "bg-indigo-50 border-indigo-200",
  roles: "bg-pink-50 border-pink-200",
  driver: "bg-lime-50 border-lime-200",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleRecord | null>(null);
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  const isAdmin = editTarget?.name === "admin" || name.toLowerCase() === "admin";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([fetch("/api/roles"), fetch("/api/permissions")]);
    if (rolesRes.ok) setRoles(await rolesRes.json());
    if (permsRes.ok) setPermissions(await permsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group permissions by module
  const grouped: { module: string; perms: Permission[] }[] = [];
  const groupMap: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const parts = p.name.split("_");
    const module = parts[0];
    if (!groupMap[module]) { groupMap[module] = []; grouped.push({ module, perms: groupMap[module] }); }
    groupMap[module].push(p);
  }

  function openCreate() {
    setEditTarget(null);
    setName("");
    setSelectedPerms(new Set());
    setModalOpen(true);
  }

  function openEdit(role: RoleRecord) {
    setEditTarget(role);
    setName(role.name);
    setSelectedPerms(new Set(role.permissions.map((p) => p.permission.id)));
    setModalOpen(true);
  }

  function togglePerm(id: string) {
    if (isAdmin) return;
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleModule(perms: Permission[]) {
    if (isAdmin) return;
    const allSelected = perms.every(p => selectedPerms.has(p.id));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      perms.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  function selectAll() {
    if (isAdmin) return;
    setSelectedPerms(new Set(permissions.map(p => p.id)));
  }

  function deselectAll() {
    if (isAdmin) return;
    setSelectedPerms(new Set());
  }

  async function handleSave() {
    setSaving(true);
    try {
      const permIds = isAdmin ? permissions.map(p => p.id) : [...selectedPerms];
      const url = editTarget ? `/api/roles/${editTarget.id}` : "/api/roles";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissionIds: permIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "Role updated" : "Role created");
      setModalOpen(false);
      fetchData();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(role: RoleRecord) {
    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Role deleted");
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<RoleRecord>[] = [
    { key: "name", label: "Role Name", render: (row) => (
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${row.name === "admin" ? "text-amber-500" : "text-slate-400"}`} />
        <span className="font-semibold">{row.name}</span>
        {row.name === "admin" && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Full Access</span>}
      </div>
    )},
    { key: "_count", label: "Users", render: (row) => <span className="font-medium">{row._count.users}</span> },
    { key: "permissions", label: "Permissions", render: (row) => (
      <span className="text-slate-500 text-xs">
        {row.name === "admin" ? <span className="text-amber-600 font-semibold">All permissions</span> : `${row.permissions.length} of ${permissions.length}`}
      </span>
    )},
    { key: "actions", label: "Actions", render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        {row.name !== "admin" && (
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
    )},
  ];

  const effectivePerms = isAdmin ? new Set(permissions.map(p => p.id)) : selectedPerms;
  const totalSelected = effectivePerms.size;

  return (
    <div className="flex-1">
      <Topbar title="Roles & Permissions" subtitle="Manage access control roles" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{roles.length} role(s)</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus className="w-4 h-4" />Add Role
          </button>
        </div>
        <DataTable data={roles} columns={columns} searchKeys={["name"]} loading={loading} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Role" : "Create Role"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              disabled={editTarget?.name === "admin"}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500" />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">Admin role automatically has all permissions</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Permissions <span className="text-slate-400 font-normal">({totalSelected} of {permissions.length} selected)</span></p>
              {!isAdmin && (
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Select All</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={deselectAll} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Deselect All</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {grouped.map(({ module, perms }) => {
                const allChecked = perms.every(p => effectivePerms.has(p.id));
                const someChecked = perms.some(p => effectivePerms.has(p.id));
                return (
                  <div key={module} className={`rounded-xl border p-3 ${MODULE_COLORS[module] ?? "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => toggleModule(perms)} disabled={isAdmin}
                        className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-blue-600 disabled:hover:text-slate-800 transition-colors">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-white transition-colors ${
                          allChecked ? "bg-blue-600 border-blue-600" : someChecked ? "bg-blue-300 border-blue-300" : "border-slate-300 bg-white"
                        }`}>
                          {allChecked && <Check className="w-3 h-3" />}
                          {someChecked && !allChecked && <div className="w-2 h-0.5 bg-white rounded" />}
                        </div>
                        {MODULE_LABELS[module] ?? module}
                      </button>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {perms.filter(p => effectivePerms.has(p.id)).length}/{perms.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map(p => {
                        const action = p.name.split("_").slice(1).join("_");
                        const checked = effectivePerms.has(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => togglePerm(p.id)} disabled={isAdmin}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              checked
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                            } ${isAdmin ? "cursor-default" : "cursor-pointer"}`}>
                            {checked && <span className="mr-1">✓</span>}
                            {ACTION_LABELS[action] ?? action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !name} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editTarget ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete role <strong>{deleteTarget?.name}</strong>? Users with this role will lose their permissions.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
