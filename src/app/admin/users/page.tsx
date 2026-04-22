"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, UserCheck, UserX, ShieldCheck, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";

interface Role { id: string; name: string; }
interface UserRecord {
  id: string; name: string; email: string; username?: string;
  userStatus: number; createdAt: string; twoFactorEnabled: boolean;
  roles: Role[];
}

const emptyForm = { name: "", email: "", username: "", password: "", roleId: "", userStatus: 1 };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  // 2FA setup state
  const [twoFaTarget, setTwoFaTarget] = useState<UserRecord | null>(null);
  const [twoFaQr, setTwoFaQr] = useState<string | null>(null);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([fetch("/api/users"), fetch("/api/roles")]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (rolesRes.ok) setRoles(await rolesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user: UserRecord) {
    setEditTarget(user);
    setForm({ name: user.name, email: user.email, username: user.username ?? "", password: "", roleId: user.roles[0]?.id ?? "", userStatus: user.userStatus });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editTarget ? `/api/users/${editTarget.id}` : "/api/users";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(editTarget ? "User updated" : "User created");
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserRecord) {
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function open2faSetup(user: UserRecord) {
    setTwoFaTarget(user);
    setTwoFaQr(null);
    setTwoFaSecret(null);
    setTwoFaToken("");
    if (!user.twoFactorEnabled) {
      setTwoFaLoading(true);
      try {
        const res = await fetch(`/api/users/${user.id}/2fa-setup`);
        const data = await res.json();
        setTwoFaQr(data.qrDataUrl);
        setTwoFaSecret(data.secret);
      } catch { toast.error("Failed to generate QR code"); }
      finally { setTwoFaLoading(false); }
    }
  }

  async function confirm2faSetup() {
    if (!twoFaTarget || !twoFaSecret) return;
    setTwoFaLoading(true);
    try {
      const res = await fetch(`/api/users/${twoFaTarget.id}/2fa-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: twoFaSecret, token: twoFaToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Verification failed"); return; }
      toast.success("2FA enabled successfully");
      setTwoFaTarget(null);
      fetchData();
    } catch { toast.error("Network error"); }
    finally { setTwoFaLoading(false); }
  }

  async function disable2fa(user: UserRecord) {
    try {
      const res = await fetch(`/api/users/${user.id}/2fa-setup`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disable 2FA");
      toast.success("2FA disabled");
      setTwoFaTarget(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<UserRecord>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "username", label: "Username" },
    { key: "roles", label: "Role", render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {row.roles[0]?.name ?? "No Role"}
      </span>
    )},
    { key: "userStatus", label: "Status", render: (row) => row.userStatus === 1
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><UserCheck className="w-3 h-3" />Active</span>
      : <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700"><UserX className="w-3 h-3" />Inactive</span>
    },
    { key: "twoFactorEnabled", label: "2FA", render: (row) => row.twoFactorEnabled
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700"><ShieldCheck className="w-3 h-3" />On</span>
      : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><ShieldOff className="w-3 h-3" />Off</span>
    },
    { key: "actions", label: "Actions", render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => open2faSetup(row)} title="Configure 2FA"
          className={`p-1.5 rounded-lg transition-colors ${row.twoFactorEnabled ? "hover:bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-400"}`}>
          <ShieldCheck className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex-1">
      <Topbar title="Users" subtitle="Manage system user accounts" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{users.length} user(s)</p>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus className="w-4 h-4" />Add User
          </button>
        </div>
        <DataTable data={users} columns={columns} searchKeys={["name", "email", "username"]} loading={loading} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit User" : "Add User"}>
        <div className="space-y-4">
          {[
            { label: "Full Name *", key: "name", required: true },
            { label: "Email *", key: "email", required: true },
            { label: "Username", key: "username" },
            { label: editTarget ? "New Password (leave blank to keep)" : "Password *", key: "password", type: "password", required: !editTarget },
          ].map(({ label, key, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type || "text"}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No Role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.userStatus} onChange={(e) => setForm((f) => ({ ...f, userStatus: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
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
        <p className="text-slate-600 text-sm mb-6">Delete user <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal open={!!twoFaTarget} onClose={() => setTwoFaTarget(null)} title={twoFaTarget?.twoFactorEnabled ? "Manage 2FA" : "Set Up Two-Factor Authentication"}>
        {twoFaTarget?.twoFactorEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-800">2FA is enabled for {twoFaTarget.name}</p>
                <p className="text-xs text-indigo-600 mt-0.5">They must use their authenticator app to log in.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTwoFaTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Close</button>
              <button onClick={() => disable2fa(twoFaTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">
                Disable 2FA
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Scan the QR code below with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator), then enter the 6-digit code to confirm.
            </p>
            {twoFaLoading && <div className="text-center py-8 text-slate-400 text-sm">Generating QR code...</div>}
            {twoFaQr && (
              <div className="flex flex-col items-center gap-3">
                <img src={twoFaQr} alt="2FA QR Code" className="w-48 h-48 border border-slate-200 rounded-xl" />
                <p className="text-xs text-slate-400">Or enter this key manually:</p>
                <code className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-mono tracking-wider break-all text-center">{twoFaSecret}</code>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
              <input type="text" inputMode="numeric" maxLength={6} value={twoFaToken}
                onChange={e => setTwoFaToken(e.target.value)}
                placeholder="000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTwoFaTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={confirm2faSetup} disabled={twoFaLoading || !twoFaToken}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {twoFaLoading ? "Verifying..." : "Enable 2FA"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
