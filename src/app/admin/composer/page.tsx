"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Trash2, Send, Eye, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";

interface ComposerMessage {
  id: string; title: string; message: string; messageType?: string;
  fromEmail?: string; createdAt: string;
  messageBy?: { name: string };
  _count: { messagesStatus: number };
}

const emptyForm = { title: "", message: "", messageType: "", fromEmail: "" };

export default function ComposerPage() {
  const [messages, setMessages] = useState<ComposerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<ComposerMessage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComposerMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/composer");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/composer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Create failed");
      toast.success("Message created and queued for sending");
      setModalOpen(false);
      setForm(emptyForm);
      fetchMessages();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function handleSend(id: string) {
    setSending(id);
    try {
      const res = await fetch(`/api/composer/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      toast.success(`Sent ${data.sent} message(s). Failed: ${data.failed}. Remaining: ${data.remaining}`);
      fetchMessages();
    } catch (e: any) { toast.error(e.message); } finally { setSending(null); }
  }

  async function handleDelete(msg: ComposerMessage) {
    try {
      const res = await fetch(`/api/composer/${msg.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Message deleted");
      setDeleteTarget(null);
      fetchMessages();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<ComposerMessage>[] = [
    { key: "title", label: "Subject" },
    { key: "messageType", label: "Type" },
    { key: "messageBy", label: "Created By", render: (row) => row.messageBy?.name ?? "—" },
    { key: "_count", label: "Recipients", render: (row) => (
      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{row._count.messagesStatus}</span>
    )},
    { key: "createdAt", label: "Created", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: "actions", label: "Actions", render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setViewTarget(row); setViewModal(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => handleSend(row.id)} disabled={sending === row.id} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-40">
          {sending === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
        <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="flex-1">
      <Topbar title="Admin Composer" subtitle="Compose and send mass notices to customers" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{messages.length} message(s)</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus className="w-4 h-4" />Compose Message
          </button>
        </div>
        <DataTable data={messages} columns={columns} searchKeys={["title", "messageType"]} loading={loading}
          emptyMessage="No messages composed yet." />
      </div>

      {/* Compose Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Compose Mass Notice" size="lg">
        <div className="space-y-4">
          {[
            { label: "Subject *", key: "title", required: true },
            { label: "From Email", key: "fromEmail" },
            { label: "Message Type", key: "messageType" },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input type="text" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message Body (HTML) *</label>
            <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={6} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <p className="text-xs text-slate-400">Message will be queued for all customers. Click Send to dispatch in batches.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.title || !form.message} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={viewTarget?.title ?? "Message"} size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="text-sm space-y-1 text-slate-600">
              <p><span className="font-medium">Subject:</span> {viewTarget.title}</p>
              <p><span className="font-medium">Type:</span> {viewTarget.messageType ?? "N/A"}</p>
              <p><span className="font-medium">From:</span> {viewTarget.fromEmail ?? "Default"}</p>
              <p><span className="font-medium">Recipients:</span> {viewTarget._count.messagesStatus}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: viewTarget.message }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setViewModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Close</button>
              <button onClick={() => { setViewModal(false); handleSend(viewTarget.id); }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Batch
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete message <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
