"use client";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, X, ArrowLeft, ExternalLink } from "lucide-react";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const s = String(d).slice(0, 10); // take YYYY-MM-DD part
  const [y, m, day] = s.split("-");
  return `${day}-${m}-${y}`;
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Unassigned", color: "bg-red-100 text-red-700" },
  1: { label: "Assigned",   color: "bg-yellow-100 text-yellow-700" },
  2: { label: "Collected",  color: "bg-blue-100 text-blue-700" },
  3: { label: "Delivered",  color: "bg-emerald-100 text-emerald-700" },
};

function StatusBadge({ booking }: { booking: any }) {
  if (booking.pod_signature && booking.pod_date)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">POD Received</span>;
  const hasDriver = booking.driver;
  if (!hasDriver)
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">Driver Allocated</span>;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-500 w-40 shrink-0">{label}</span>
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

export default function LegacyPage() {
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

  // Handle browser back button when in detail view
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
      const res = await fetch(`/api/legacy/bookings?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
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

  useEffect(() => { fetchJobs(1); }, []);

  // ── Detail view ─────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selected) {
    const b = selected;
    const podFiles: string[] = !b.pod_upload ? [] :
      b.pod_upload.startsWith("[") ? (() => { try { return JSON.parse(b.pod_upload); } catch { return []; } })() : [b.pod_upload];

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button onClick={goBack}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to search results
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Legacy Job</p>
            <h1 className="text-3xl font-bold text-slate-900">{b.job_ref}</h1>
            <p className="text-slate-500 mt-1">{b.customer_name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge booking={b} />
            <span className="text-xs text-slate-400">{fmtDate(b.collection_date)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Collection">
            <Row label="Name"     value={b.collection_name} />
            <Row label="Address"  value={[b.collection_address1, b.collection_address2, b.collection_area].filter(Boolean).join(", ")} />
            <Row label="Postcode" value={b.collection_postcode} />
            <Row label="Contact"  value={b.collection_contact} />
            <Row label="Phone"    value={b.collection_phone} />
            <Row label="Date"     value={fmtDate(b.collection_date)} />
            <Row label="Time"     value={b.collection_time} />
            <Row label="Notes"    value={b.collection_notes} />
          </Section>

          <Section title="Delivery">
            <Row label="Name"     value={b.delivery_name} />
            <Row label="Address"  value={[b.delivery_address1, b.delivery_address2, b.delivery_area].filter(Boolean).join(", ")} />
            <Row label="Postcode" value={b.delivery_postcode} />
            <Row label="Contact"  value={b.delivery_contact} />
            <Row label="Phone"    value={b.delivery_phone} />
            <Row label="Date"     value={fmtDate(b.delivery_date)} />
            <Row label="Time"     value={b.delivery_time} />
            <Row label="Notes"    value={b.delivery_notes} />
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Job Info">
            <Row label="Purchase Order" value={b.purchase_order} />
            <Row label="Booked By"      value={b.booked_by} />
            <Row label="Vehicle"        value={b.vehicle_name} />
            <Row label="Driver"         value={b.driver_name} />
            <Row label="Second Man"     value={b.second_man_name} />
            <Row label="CX Driver"      value={b.cxdriver_name} />
            <Row label="Items"          value={b.number_of_items != null ? String(b.number_of_items) : null} />
            <Row label="Weight"         value={b.weight != null ? `${b.weight} kg` : null} />
            <Row label="Job Notes"      value={b.job_notes} />
            <Row label="Office Notes"   value={b.office_notes} />
          </Section>

          <Section title="Financials">
            <Row label="Customer Price"    value={b.customer_price != null ? `£${parseFloat(b.customer_price).toFixed(2)}` : null} />
            <Row label="Driver Cost"       value={b.driver_cost != null ? `£${parseFloat(b.driver_cost).toFixed(2)}` : null} />
            <Row label="Extra Cost"        value={b.extra_cost != null ? `£${parseFloat(b.extra_cost).toFixed(2)}` : null} />
            <Row label="CX Driver Cost"    value={b.cxdriver_cost != null ? `£${parseFloat(b.cxdriver_cost).toFixed(2)}` : null} />
            <Row label="Manual Amount"     value={b.manual_amount != null ? `£${parseFloat(b.manual_amount).toFixed(2)}` : null} />
            <Row label="Manual Desc"       value={b.manual_desc} />
            <Row label="Extra Cost 2"      value={b.extra_cost2 != null ? `£${parseFloat(b.extra_cost2).toFixed(2)}` : null} />
            <Row label="Fuel Surcharge %"  value={b.fuel_surcharge_percent != null ? `${b.fuel_surcharge_percent}%` : null} />
            <Row label="Invoice Number"    value={b.invoice_number} />
          </Section>
        </div>

        {/* POD */}
        <Section title="Proof of Delivery">
          {b.pod_signature ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Row label="Signed By"    value={b.pod_signature} />
                <Row label="Relationship" value={b.pod_relationship} />
                <Row label="POD Date"     value={fmtDate(b.pod_date)} />
                <Row label="POD Time"     value={b.pod_time} />
                <Row label="Temperature"  value={b.delivered_temperature} />
                <Row label="Driver Note"  value={b.driver_note} />
              </div>
              {podFiles.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {podFiles.map((f: string, i: number) => (
                      <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {b.pod_mobile && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">POD Signature Image</p>
                  <img src={b.pod_mobile} alt="POD signature" className="max-w-xs border border-slate-200 rounded-lg" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No POD recorded</p>
          )}
        </Section>

        {/* Vias */}
        {selected.vias?.length > 0 && (
          <Section title={`Via Stops (${selected.vias.length})`}>
            <div className="space-y-4">
              {selected.vias.map((v: any, i: number) => (
                <div key={v.via_id} className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Via {i + 1} — {v.via_type || "Stop"}</p>
                  <Row label="Name"     value={v.name} />
                  <Row label="Address"  value={[v.address1, v.address2, v.area].filter(Boolean).join(", ")} />
                  <Row label="Postcode" value={v.postcode} />
                  <Row label="Date"     value={v.via_date} />
                  <Row label="Time"     value={v.via_time} />
                  <Row label="Notes"    value={v.notes} />
                  {v.signed_by && <>
                    <hr className="border-slate-100" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Via POD</p>
                    <Row label="Signed By"    value={v.signed_by} />
                    <Row label="Relationship" value={v.pod_relationship} />
                    <Row label="Temperature"  value={v.delivered_temperature} />
                    {v.via_pod_mobile && <img src={v.via_pod_mobile} alt="Via POD" className="max-w-xs border border-slate-200 rounded-lg mt-1" />}
                  </>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  }

  // ── List / search view ───────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Legacy Records</h1>
        <p className="text-slate-500 text-sm mt-1">Read-only access to the historical job database</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchJobs(1)}
              placeholder="Job ref, customer, postcode, PO…"
              className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {search && (
              <button onClick={() => { setSearch(""); }} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
          {error.includes("LEGACY_DB") && (
            <p className="mt-1 text-red-600">Add <code className="bg-red-100 px-1 rounded">LEGACY_DB_HOST</code>, <code className="bg-red-100 px-1 rounded">LEGACY_DB_USER</code>, <code className="bg-red-100 px-1 rounded">LEGACY_DB_PASS</code>, and <code className="bg-red-100 px-1 rounded">LEGACY_DB_NAME</code> to your environment variables.</p>
          )}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
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
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Job Ref</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Date</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Time</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap" style={{width:"100px"}}>Customer</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">From</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 1</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 2</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 3</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 4</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 5</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Via 6</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">To</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap" style={{width:"100px"}}>Driver</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Driver Cost</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap" style={{width:"90px"}}>Vehicle</th>
                  <th className="px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((b: any) => {
                  const hasPod = b.pod_signature && b.pod_date;
                  const hasDriver = !!b.driver;
                  const rowCls = hasPod
                    ? "bg-emerald-50 border-l-4 border-l-emerald-400"
                    : hasDriver
                    ? "bg-amber-50 border-l-4 border-l-amber-400"
                    : "bg-rose-50 border-l-4 border-l-rose-400";
                  return (
                    <tr key={b.job_ref} onClick={() => openDetail(b.job_ref)}
                      className={`${rowCls} hover:opacity-80 cursor-pointer transition-opacity`}>
                      <td className="px-3 py-2 font-mono font-semibold text-blue-700 whitespace-nowrap text-xs">{b.job_ref}</td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap text-xs">{fmtDate(b.collection_date)}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">{b.collection_time || "—"}</td>
                      <td className="px-3 py-2 text-slate-800 text-xs font-medium" style={{maxWidth:"100px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.customer || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-xs">{b.collection_postcode || "—"}</td>
                      {[0,1,2,3,4,5].map(i => (
                        <td key={i} className="px-3 py-2 text-slate-500 font-mono text-xs">{b.vias?.[i] || <span className="text-slate-200">—</span>}</td>
                      ))}
                      <td className="px-3 py-2 text-slate-600 font-mono text-xs">{b.delivery_postcode || "—"}</td>
                      <td className="px-3 py-2 text-slate-700 text-xs" style={{maxWidth:"100px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.driver || <span className="text-rose-500">Unassigned</span>}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">{b.driver_cost_total > 0 ? `£${parseFloat(b.driver_cost_total).toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs" style={{maxWidth:"90px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.vehicle || "—"}</td>
                      <td className="px-3 py-2"><StatusBadge booking={b} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          No results. Use the search above to find historical jobs.
        </div>
      )}
    </div>
  );
}
