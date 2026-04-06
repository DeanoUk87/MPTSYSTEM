"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Permission { id: string; name: string; }
interface RoleRecord { id: string; name: string; permissions: { permission: Permission }[]; _count: { users: number }; }

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleRecord | null>(null);
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.all([fetch("/api/roles"), fetch("/api/permissions")]);
    if (rolesRes.ok) setRoles(await rolesRes.json());
    if (permsRes.ok) setPermissions(await permsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditTarget(null);
    setName("");
    setSelectedPerms([]);
    setModalOpen(true);
  }

  function openEdit(role: RoleRecord) {
    setEditTarget(role);
    setName(role.name);
    setSelectedPerms(role.permissions.map((p) => p.permission.id));
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editTarget ? `/api/roles/${editTarget.id}` : "/api/roles";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissionIds: selectedPerms }),
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
    { key: "name", label: "Role Name" },
    { key: "_count", label: "Users", render: (row) => <span className="font-medium">{row._count.users}</span> },
    { key: "permissions", label: "Permissions", render: (row) => (
      <span className="text-slate-500 text-xs">{row.permissions.length} permissions</span>
    )},
    { key: "actions", label: "Actions", render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  // Group permissions by module
  const grouped = permissions.reduce((acc: Record<string, Permission[]>, p) => {
    const [module] = p.name.split("_");
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Permissions</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(grouped).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{module}</p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(p.id)}
                          onChange={(e) => setSelectedPerms((s) => e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id))}
                          className="rounded"
                        />
                        <span className="text-xs text-slate-600">{p.name.replace(`${module}_`, "")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
        <p className="text-slate-600 text-sm mb-6">Delete role <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
