"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { ShieldCheck, ChevronLeft, ChevronRight, CheckCircle2, XCircle, LogIn } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  detail: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LOGIN_SUCCESS: { label: "Login Success", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  LOGIN_FAIL:    { label: "Login Failed",  color: "bg-red-100 text-red-700",     icon: <XCircle className="w-3 h-3" /> },
};

function actionBadge(action: string) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: "bg-slate-100 text-slate-700", icon: <LogIn className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-log?page=${p}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setPages(data.pages ?? 1);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-7 h-7 text-slate-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
              <p className="text-sm text-slate-500">{total} events recorded</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading…</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No audit events yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Event</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">IP Address</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-GB")}
                      </td>
                      <td className="px-4 py-3">{actionBadge(log.action)}</td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <div className="font-medium text-slate-800">{log.user.name}</div>
                            <div className="text-xs text-slate-400">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <span className="text-sm text-slate-500">Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
