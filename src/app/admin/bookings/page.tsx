"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Loader2, CheckCircle, Clock, AlertCircle, FileText, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { usePermissions } from "@/lib/use-permissions";

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string;
  collectionTime?: string;
  collectionName?: string;
  collectionAddress1?: string;
  collectionPostcode?: string;
  deliveryName?: string;
  deliveryAddress1?: string;
  deliveryPostcode?: string;
  purchaseOrder?: string;
  customerPrice?: number;
  driverCost?: number;
  miles?: number;
  numberOfItems?: number;
  weight?: number;
  jobStatus: number;
  podDataVerify: boolean;
  podSignature?: string;
  podUpload?: string;
  podDate?: string;
  customer?: { name: string; accountNumber?: string };
  vehicle?: { name: string };
  driver?: { name: string; driverType: string };
  secondMan?: { name: string };
  cxDriver?: { name: string };
  bookingType?: { name: string };
  viaAddresses?: { id: string; postcode?: string; viaType?: string; name?: string; address1?: string; city?: string; signedBy?: string }[];
}

function StatusBadge({ booking }: { booking: Booking }) {
  const isQuote = booking.bookingType?.name?.toLowerCase() === "quote";
  if (isQuote) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">Quote</span>;
  const hasDriver = !!(booking.driver || booking.secondMan || booking.cxDriver);
  if (!hasDriver) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>;
  const allViasPodded = !booking.viaAddresses?.length || booking.viaAddresses.every(v => v.signedBy);
  if (booking.podSignature && booking.podDataVerify && allViasPodded) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">Completed</span>;
  if (booking.podSignature && allViasPodded) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">POD Received</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">Driver Allocated</span>;
}

// Searchable dropdown for customers/drivers
function SearchPick({ placeholder, onPick, onClear, picked }: {
  placeholder: string;
  onPick: (item: any) => void;
  onClear: () => void;
  picked: { id: string; label: string } | null;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const isDriver = placeholder.toLowerCase().includes("driver");
    const url = isDriver ? `/api/drivers?q=${encodeURIComponent(q)}` : `/api/customers?q=${encodeURIComponent(q)}`;
    fetch(url).then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : (data.customers ?? data.drivers ?? []);
      setResults(arr.slice(0, 10));
      setOpen(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [q, placeholder]);

  if (picked) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
        <span>{picked.label}</span>
        <button type="button" onClick={onClear} className="ml-1 text-blue-400 hover:text-blue-700 font-bold text-base leading-none">×</button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
      />
      {loading && <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 animate-spin text-slate-400" />}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {results.map((r: any) => (
            <button key={r.id} type="button"
              onMouseDown={() => { onPick(r); setQ(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0">
              <span className="font-medium">{r.name}</span>
              {r.accountNumber && <span className="ml-1.5 text-xs text-slate-400">{r.accountNumber}</span>}
              {r.driverType && <span className="ml-1.5 text-xs text-slate-400">{r.driverType}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const { has } = usePermissions();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  const [filterDateFrom, setFilterDateFrom] = useState(() => todayStr());
  const [filterDateTo, setFilterDateTo] = useState(() => todayStr());
  const [filterStatus, setFilterStatus] = useState("");
  const [pickedCustomer, setPickedCustomer] = useState<{ id: string; label: string } | null>(null);
  const [pickedDriver, setPickedDriver] = useState<{ id: string; label: string } | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(80);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(0);
  // pending = what user is building; applied = what's fetched
  const [appliedFilters, setAppliedFilters] = useState<{
    dateFrom: string; dateTo: string; status: string; customerId: string; driverId: string;
  }>(() => { const t = todayStr(); return { dateFrom: t, dateTo: t, status: "", customerId: "", driverId: "" }; });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedFilters.dateFrom) params.set("dateFrom", appliedFilters.dateFrom);
    if (appliedFilters.dateTo) params.set("dateTo", appliedFilters.dateTo);
    if (appliedFilters.status !== "") params.set("status", appliedFilters.status);
    if (appliedFilters.customerId) params.set("customerId", appliedFilters.customerId);
    if (appliedFilters.driverId) params.set("driverId", appliedFilters.driverId);
    const res = await fetch(`/api/bookings?${params}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [appliedFilters]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Load refresh interval from settings
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      const secs = s?.bookingRefreshInterval ?? 80;
      setRefreshInterval(secs);
      if (secs > 0) { countdownRef.current = secs; setCountdown(secs); }
    });
  }, []);

  // Auto-refresh interval + 1-second countdown ticker
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const tick = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        countdownRef.current = refreshInterval;
        setCountdown(refreshInterval);
        fetchBookings();
      }
    }, 1_000);
    return () => clearInterval(tick);
  }, [refreshInterval, fetchBookings]);

  // Load refresh interval from settings
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      const secs = s?.bookingRefreshInterval ?? 80;
      setRefreshInterval(secs);
      if (secs > 0) { countdownRef.current = secs; setCountdown(secs); }
    });
  }, []);

  // Auto-refresh interval + countdown
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const tick = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        countdownRef.current = refreshInterval;
        setCountdown(refreshInterval);
        fetchBookings();
      }
    }, 1_000);
    return () => clearInterval(tick);
  }, [refreshInterval, fetchBookings]);

  function applyFilters() {
    setAppliedFilters({
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      status: filterStatus,
      customerId: pickedCustomer?.id ?? "",
      driverId: pickedDriver?.id ?? "",
    });
  }

  function clearFilters() {
    const t = todayStr();
    setFilterDateFrom(t); setFilterDateTo(t); setFilterStatus("");
    setPickedCustomer(null); setPickedDriver(null);
    setAppliedFilters({ dateFrom: t, dateTo: t, status: "", customerId: "", driverId: "" });
  }

  function navigateDay(dir: 1 | -1) {
    const base = filterDateFrom || todayStr();
    const d = new Date(base + "T00:00:00");
    d.setDate(d.getDate() + dir);
    const next = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setFilterDateFrom(next);
    setFilterDateTo(next);
    setAppliedFilters(prev => ({ ...prev, dateFrom: next, dateTo: next }));
  }

  function openReport(type: "financial" | "driver") {
    const params = new URLSearchParams();
    if (appliedFilters.dateFrom) params.set("dateFrom", appliedFilters.dateFrom);
    if (appliedFilters.dateTo) params.set("dateTo", appliedFilters.dateTo);
    if (appliedFilters.customerId) params.set("customerId", appliedFilters.customerId);
    if (appliedFilters.driverId) params.set("driverId", appliedFilters.driverId);
    if (pickedCustomer) params.set("customerName", pickedCustomer.label);
    if (pickedDriver) params.set("driverName", pickedDriver.label);
    window.open(`/admin/bookings/report-${type}?${params}`, "_blank");
  }

  async function handleDelete(b: Booking) {
    try {
      const res = await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Booking deleted");
      setDeleteTarget(null);
      fetchBookings();
    } catch (e: any) { toast.error(e.message); }
  }

  const hasFilters = appliedFilters.dateFrom || appliedFilters.dateTo || appliedFilters.customerId || appliedFilters.driverId || appliedFilters.status;
  const canOpenReport = !!(appliedFilters.dateFrom || appliedFilters.dateTo || appliedFilters.customerId || appliedFilters.driverId);

  const columns: Column<Booking>[] = [
    { key: "jobRef", label: "Job Ref", render: (r) => (
      <Link href={`/admin/bookings/${r.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{r.jobRef || r.id.slice(-6).toUpperCase()}</Link>
    )},
    { key: "collectionDate", label: "Date", render: (r) => r.collectionDate ? r.collectionDate.split("-").reverse().join("-") : "—" },
    { key: "collectionTime", label: "Time", render: (r) => r.collectionTime || "—" },
    { key: "customer", label: "Customer", render: (r) => (
      <p className="font-medium whitespace-nowrap max-w-[120px] truncate">{r.customer?.name || "—"}</p>
    )},
    { key: "collectionPostcode", label: "From", render: (r) => r.collectionPostcode || "—" },
    { key: "via1", label: "Via 1", render: (r) => r.viaAddresses?.[0]?.postcode || "—" },
    { key: "via2", label: "Via 2", render: (r) => r.viaAddresses?.[1]?.postcode || "—" },
    { key: "via3", label: "Via 3", render: (r) => r.viaAddresses?.[2]?.postcode || "—" },
    { key: "via4", label: "Via 4", render: (r) => r.viaAddresses?.[3]?.postcode || "—" },
    { key: "via5", label: "Via 5", render: (r) => r.viaAddresses?.[4]?.postcode || "—" },
    { key: "via6", label: "Via 6", render: (r) => r.viaAddresses?.[5]?.postcode || "—" },
    { key: "deliveryPostcode", label: "To", render: (r) => r.deliveryPostcode || "—" },
    { key: "driver", label: "Driver", render: (r) => {
      const name = r.driver?.name || r.secondMan?.name || r.cxDriver?.name;
      return name ? <span className="whitespace-nowrap">{name}</span> : <span className="text-rose-500 text-xs">Unassigned</span>;
    }},
    { key: "customerPrice", label: "Total", render: (r) => r.customerPrice ? `£${r.customerPrice.toFixed(2)}` : "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge booking={r} /> },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        {has("bookings_view") && (
          <Link href={`/admin/bookings/${r.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
            <Eye className="w-4 h-4" />
          </Link>
        )}
        {has("bookings_edit") && (
          <Link href={`/admin/bookings/${r.id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <Pencil className="w-4 h-4" />
          </Link>
        )}
        {has("bookings_delete") && (
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="flex-1">
      <Topbar title="Bookings" subtitle="Manage sameday transport bookings" />
      <div className="p-6 space-y-4">
        {/* Filters + Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center flex-wrap gap-2">
            <button onClick={() => navigateDay(-1)} title="Previous day"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Date from</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                onClick={e => { try { (e.target as any).showPicker?.(); } catch {} }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">to</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                onClick={e => { try { (e.target as any).showPicker?.(); } catch {} }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
            </div>
            <button onClick={() => navigateDay(1)} title="Next day"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
            <SearchPick placeholder="Search customer..." onPick={r => setPickedCustomer({ id: r.id, label: r.name })} onClear={() => setPickedCustomer(null)} picked={pickedCustomer} />
            <SearchPick placeholder="Search driver / subcon..." onPick={r => setPickedDriver({ id: r.id, label: r.name })} onClear={() => setPickedDriver(null)} picked={pickedDriver} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="0">Active</option>
              <option value="1">Sent to Accounts</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              View / Filter Results
            </button>
            <button onClick={() => openReport("financial")} disabled={!canOpenReport}
              className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${!has("bookings_financials") ? "hidden" : ""}`}>
              <TrendingUp className="w-4 h-4" /> Financial Report
            </button>
            <button onClick={() => openReport("driver")} disabled={!canOpenReport || !appliedFilters.driverId}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <FileText className="w-4 h-4" /> Driver Statement
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg">Clear</button>
            )}
            <div className="ml-auto flex items-center gap-3">
              {refreshInterval > 0 && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Refreshes in {countdown}s
                </span>
              )}
              <Link href="/admin/bookings/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> New Booking
              </Link>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: bookings.length, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
            { label: "No Driver", value: bookings.filter(b => !b.driver && !b.secondMan && !b.cxDriver).length, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
            { label: "In Progress", value: bookings.filter(b => (b.driver || b.secondMan || b.cxDriver) && !b.podSignature).length, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Completed", value: bookings.filter(b => b.podSignature && b.podDataVerify).length, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", color.split(" ")[1])}>
                <Icon className={clsx("w-5 h-5", color.split(" ")[0])} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Colour legend */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> No driver</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> Driver allocated</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> POD received</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Completed</span>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            data={bookings}
            columns={columns.filter(c => c.key !== "customerPrice" || has("bookings_financials"))}
            compact
            searchKeys={["collectionPostcode", "deliveryPostcode"]}
            loading={loading}
            emptyMessage="No bookings found. Create your first booking."          defaultSortKey="createdAt"
          defaultSortDir="desc"            rowClassName={(b: Booking) => {
              const isQuote = b.bookingType?.name?.toLowerCase() === "quote";
              const allViasPodded = !b.viaAddresses?.length || b.viaAddresses.every(v => v.signedBy);
              if (isQuote) return "bg-slate-50";
              if (b.podSignature && b.podDataVerify && allViasPodded) return "bg-blue-50 border-l-4 border-l-blue-400";
              if (b.podSignature && allViasPodded) return "bg-emerald-50 border-l-4 border-l-emerald-400";
              if (b.driver || b.secondMan || b.cxDriver) return "bg-amber-50 border-l-4 border-l-amber-400";
              return "bg-rose-50 border-l-4 border-l-rose-400";
            }}
          />
        </div>
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 text-sm mb-6">Delete booking for <strong>{deleteTarget?.customer?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={() => deleteTarget && handleDelete(deleteTarget)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
