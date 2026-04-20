"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, X, ArrowLeft, ExternalLink, LogOut, Loader2 } from "lucide-react";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-");
  return `${day}-${m}-${y}`;
}

function StatusBadge({ booking }: { booking: any }) {
  if (booking.pod_signature && booking.pod_date)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">POD Received</span>;
  if (booking.driver)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">Driver Allocated</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

export default function PortalLegacyPage() {
  const router = useRouter();
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage]         = useState(1);
  const [results, setResults]   = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noLink, setNoLink]     = useState(false);

  useEffect(() => {
    function onPopState() { setSelected(null); }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function openDetail(jobRef: string) {
    window.history.pushState({ jobRef }, "", window.location.pathname + "?job=" + jobRef);
    setDetailLoading(true);
    setSelected(null);
    fetch(`/api/legacy/bookings/${encodeURIComponent(jobRef)}`)
      .then(r => r.json())
      .then(data => { if (data.error) throw new Error(data.error); setSelected(data); })
      .catch((e: any) => setError(e.message))
      .finally(() => setDetailLoading(false));
  }

  function goBack() {
    window.history.back();
    setSelected(null);
  }

  async function fetchJobs(pg = 1) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (search)   params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo)   params.set("dateTo", dateTo);
      const res = await fetch(`/api/portal/legacy/bookings?${params}`);
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { setError("Not a customer account."); setLoading(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      if (data.total === 0 && pg === 1 && !search && !dateFrom && !dateTo) setNoLink(true);
      else setNoLink(false);
      setResults(data.bookings || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(pg);
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => { fetchJobs(1); }, []);

  // ── Loading ───────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────
  if (selected) {
    const b = selected;
    const podFiles: string[] = !b.pod_upload ? [] :
      b.pod_upload.startsWith("[") ? (() => { try { return JSON.parse(b.pod_upload); } catch { return []; } })() : [b.pod_upload];

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/portal")}
              className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Portal
            </button>
            <div>
              <p className="text-sm font-bold">Legacy Job — {b.job_ref}</p>
              <p className="text-blue-200 text-xs">{fmtDate(b.collection_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge booking={b} />
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-6 space-y-4">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to results
          </button>

          <div className="grid grid-cols-2 gap-4">
            <Section title="Collection">
              <Row label="Name"     value={b.collection_name} />
              <Row label="Address"  value={[b.collection_address1, b.collection_address2, b.collection_area].filter(Boolean).join(", ")} />
              <Row label="Postcode" value={b.collection_postcode} />
              <Row label="Date"     value={fmtDate(b.collection_date)} />
              <Row label="Time"     value={b.collection_time} />
              <Row label="Notes"    value={b.collection_notes} />
            </Section>
            <Section title="Delivery">
              <Row label="Name"     value={b.delivery_name} />
              <Row label="Address"  value={[b.delivery_address1, b.delivery_address2, b.delivery_area].filter(Boolean).join(", ")} />
              <Row label="Postcode" value={b.delivery_postcode} />
              <Row label="Date"     value={fmtDate(b.delivery_date)} />
              <Row label="Time"     value={b.delivery_time} />
              <Row label="Notes"    value={b.delivery_notes} />
            </Section>
          </div>

          <Section title="Job Info">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <Row label="Purchase Order" value={b.purchase_order} />
              <Row label="Vehicle"        value={b.vehicle_name} />
              <Row label="Driver"         value={b.driver_name} />
              <Row label="Items"          value={b.number_of_items != null ? String(b.number_of_items) : null} />
              <Row label="Weight"         value={b.weight != null ? `${b.weight} kg` : null} />
              <Row label="Job Notes"      value={b.job_notes} />
            </div>
          </Section>

          <Section title="Proof of Delivery">
            {b.pod_signature ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <Row label="Signed By"    value={b.pod_signature} />
                  <Row label="Relationship" value={b.pod_relationship} />
                  <Row label="POD Date"     value={fmtDate(b.pod_date)} />
                  <Row label="POD Time"     value={b.pod_time} />
                  <Row label="Temperature"  value={b.delivered_temperature} />
                </div>
                {podFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {podFiles.map((f: string, i: number) => (
                        <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                          <ExternalLink className="w-3 h-3" /> Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {b.pod_mobile && (
                  <img src={b.pod_mobile} alt="POD signature" className="max-w-xs border border-slate-200 rounded-lg" />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No POD recorded</p>
            )}
          </Section>

          {selected.vias?.length > 0 && (
            <Section title={`Via Stops (${selected.vias.length})`}>
              <div className="space-y-4">
                {selected.vias.map((v: any, i: number) => (
                  <div key={v.via_id} className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Via {i + 1} — {v.via_type || "Stop"}</p>
                    <Row label="Name"     value={v.name} />
                    <Row label="Address"  value={[v.address1, v.address2, v.area].filter(Boolean).join(", ")} />
                    <Row label="Postcode" value={v.postcode} />
                    <Row label="Notes"    value={v.notes} />
                    {v.signed_by && <>
                      <hr className="border-slate-100" />
                      <Row label="Signed By"    value={v.signed_by} />
                      <Row label="Relationship" value={v.pod_relationship} />
                      <Row label="Temperature"  value={v.delivered_temperature} />
                    </>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/portal")}
            className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
          </button>
          <div>
            <p className="text-sm font-bold leading-none">Legacy Records</p>
            <p className="text-blue-200 text-xs mt-0.5">Historical jobs from the old system</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white border border-blue-500 hover:border-blue-300 px-3 py-1.5 rounded-lg transition">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchJobs(1)}
                placeholder="Job ref, postcode, purchase order…"
                className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => fetchJobs(1)} disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {noLink && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-amber-700 font-medium">No legacy records linked to your account.</p>
            <p className="text-amber-600 text-sm mt-1">Please contact us if you believe this is incorrect.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && !noLink && results.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-slate-200 p-14 text-center">
            <p className="text-slate-400">No jobs found for this search.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">{total.toLocaleString()} result{total !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => fetchJobs(page - 1)} disabled={page <= 1 || loading}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-slate-600">Page {page} of {pages}</span>
                <button onClick={() => fetchJobs(page + 1)} disabled={page >= pages || loading}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {["Job Ref", "Date", "Time", "Collection", "Via 1", "Via 2", "Via 3", "Via 4", "Via 5", "Via 6", "Delivery", "Status"].map(h => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((b: any) => {
                    const hasPod = b.pod_signature && b.pod_date;
                    const rowCls = hasPod
                      ? "bg-emerald-50 hover:bg-emerald-100"
                      : b.driver
                        ? "bg-amber-50 hover:bg-amber-100"
                        : "hover:bg-slate-50";
                    return (
                      <tr key={b.job_ref} className={`cursor-pointer transition-colors ${rowCls}`}
                        onClick={() => openDetail(b.job_ref)}>
                        <td className="px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">{b.job_ref}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-700">{fmtDate(b.collection_date)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-slate-500">{b.collection_time || "—"}</td>
                        <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">{b.collection_postcode || "—"}</td>
                        {[0,1,2,3,4,5].map(i => (
                          <td key={i} className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap">
                            {b.vias[i] ?? <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">{b.delivery_postcode || "—"}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><StatusBadge booking={b} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
