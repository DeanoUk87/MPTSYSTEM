"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Loader2, CheckCircle, Clock, AlertCircle, FileText, TrendingUp, ChevronLeft, ChevronRight, Download, Bell } from "lucide-react";
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
  extraCost?: number;
  cxDriverCost?: number;
  miles?: number;
  weight?: number;
  manualAmount?: number;
  manualDesc?: string;
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
  driverContact?: { driverName: string };
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
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">Driver Allocated</span>;
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
  const [tomorrowJobs, setTomorrowJobs] = useState<Booking[]>([]);
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [showPostcodeModal, setShowPostcodeModal] = useState(false);
  const [pcDateFrom, setPcDateFrom] = useState(() => todayStr());
  const [pcDateTo, setPcDateTo] = useState(() => todayStr());
  const [pcRows, setPcRows] = useState<Booking[] | null>(null);
  const [pcLoading, setPcLoading] = useState(false);

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

  // Fetch tomorrow's jobs without a driver
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    fetch(`/api/bookings?dateFrom=${tomorrow}&dateTo=${tomorrow}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Booking[]) => {
        const unassigned = data.filter(b => !b.driver && !b.secondMan && !b.cxDriver && b.bookingType?.name?.toLowerCase() !== "quote");
        setTomorrowJobs(unassigned);
      })
      .catch(() => {});
  }, []);

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

  async function loadPcData() {
    setPcLoading(true);
    try {
      const params = new URLSearchParams();
      if (pcDateFrom) params.set("dateFrom", pcDateFrom);
      if (pcDateTo) params.set("dateTo", pcDateTo);
      const res = await fetch(`/api/bookings?${params}`);
      if (res.ok) setPcRows(await res.json());
    } catch { /* silent */ } finally { setPcLoading(false); }
  }

  function exportPostcodesCSV(data: Booking[]) {
    if (!data.length) return;
    const rows = data.map(b => {
      const vias = b.viaAddresses?.map(v => v.postcode).filter(Boolean) ?? [];
      const allPostcodes = [b.collectionPostcode, ...vias, b.deliveryPostcode].filter(Boolean).join(" / ");
      const total = b.manualAmount ?? b.customerPrice ?? 0;
      const extraInfo = b.manualAmount && b.manualDesc ? b.manualDesc : (b.manualAmount ? "Manual amount" : "");
      return [
        b.jobRef || b.id.slice(-6).toUpperCase(),
        allPostcodes,
        b.miles ? b.miles.toFixed(1) : "",
        b.collectionDate ? b.collectionDate.split("-").reverse().join("/") : "",
        b.vehicle?.name ?? "",
        extraInfo,
        total ? total.toFixed(2) : "",
      ];
    });
    const headers = ["Job Ref", "Postcodes", "Mileage", "Date", "Vehicle", "Extra Cost Information", "Total"];
    const totalSum = data.reduce((sum, b) => sum + (b.manualAmount ?? b.customerPrice ?? 0), 0);
    const totalRow = ["", "", "", "", "", "Total", totalSum.toFixed(2)];
    const csv = [headers, ...rows, totalRow].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `postcodes-export-${pcDateFrom || "all"}.csv`;
    a.click();
  }

  function exportPostcodeTotalsCSV(data: Booking[]) {
    if (!data.length) return;
    const rows = data.map(b => {
      const viaCount = b.viaAddresses?.length ?? 0;
      return [b.jobRef || b.id.slice(-6).toUpperCase(), viaCount + 1];
    });
    const headers = ["Job Ref", "Postcode Total"];
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `postcode-totals-${pcDateFrom || "all"}.csv`;
    a.click();
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
      const contact = r.driverContact?.driverName;
      if (!name) return <span className="text-rose-500 text-xs">Unassigned</span>;
      return (
        <span className="whitespace-nowrap">
          {name}
          {contact && <span className="block text-xs text-slate-500">({contact})</span>}
        </span>
      );
    }},
    { key: "driverCost", label: "Driver Cost", render: (r) => { const cost = r.driverCost || r.extraCost || r.cxDriverCost; return cost ? `£${cost.toFixed(2)}` : "—"; } },
    { key: "vehicle", label: "Vehicle", render: (r) => r.vehicle?.name || "—" },
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
            <button onClick={() => { setPcRows(null); setShowPostcodeModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
              <Download className="w-4 h-4" /> Postcode Export
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg">Clear</button>
            )}
            {tomorrowJobs.length > 0 && (
              <button onClick={() => setShowTomorrowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors animate-pulse">
                <Bell className="w-4 h-4" />
                {tomorrowJobs.length} job{tomorrowJobs.length !== 1 ? "s" : ""} tomorrow — No Driver!
              </button>
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
            columns={columns.filter(c => (c.key !== "customerPrice" && c.key !== "driverCost") || has("bookings_financials"))}
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

      <Modal open={showTomorrowModal} onClose={() => setShowTomorrowModal(false)} title="Tomorrow's Jobs — No Driver Assigned" size="lg">
        <p className="text-sm text-slate-500 mb-4">{tomorrowJobs.length} booking{tomorrowJobs.length !== 1 ? "s" : ""} tomorrow without a driver assigned.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Job Ref", "Date", "Time", "Customer", "From", "Via", "To"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tomorrowJobs.map(b => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-rose-50">
                  <td className="px-3 py-2 font-mono font-semibold text-blue-600">
                    <Link href={`/admin/bookings/${b.id}`} onClick={() => setShowTomorrowModal(false)} className="hover:underline">
                      {b.jobRef || b.id.slice(-6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{b.collectionDate ? b.collectionDate.split("-").reverse().join("-") : "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{b.collectionTime ?? "—"}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap max-w-[120px] truncate">{b.customer?.name ?? "—"}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{b.collectionPostcode ?? "—"}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{b.viaAddresses?.map(v => v.postcode).filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{b.deliveryPostcode ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setShowTomorrowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">Close</button>
        </div>
      </Modal>

      <Modal open={showPostcodeModal} onClose={() => setShowPostcodeModal(false)} title="Postcode Export" size="xl">
        <div className="space-y-6">
          {/* Date range + load */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date From</label>
              <input type="date" value={pcDateFrom} onChange={e => setPcDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date To</label>
              <input type="date" value={pcDateTo} onChange={e => setPcDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={loadPcData} disabled={pcLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {pcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Load Data
            </button>
          </div>

          {pcRows === null && !pcLoading && (
            <p className="text-sm text-slate-400 text-center py-8">Select a date range and click Load Data</p>
          )}
          {pcRows !== null && pcRows.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No bookings found for this date range</p>
          )}

          {pcRows && pcRows.length > 0 && (<>

            {/* ── Option 1: Full postcode breakdown ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Option 1 — Postcodes &amp; Totals</h3>
                <button onClick={() => exportPostcodesCSV(pcRows)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Job Ref</th>
                      <th className="px-3 py-2 text-left font-medium">Postcodes</th>
                      <th className="px-3 py-2 text-right font-medium">Mileage</th>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Vehicle</th>
                      <th className="px-3 py-2 text-left font-medium">Extra Cost Information</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pcRows.map(b => {
                      const vias = b.viaAddresses?.map(v => v.postcode).filter(Boolean) ?? [];
                      const allPcs = [b.collectionPostcode, ...vias, b.deliveryPostcode].filter(Boolean);
                      const total = b.manualAmount ?? b.customerPrice ?? 0;
                      const extraInfo = b.manualAmount && b.manualDesc ? b.manualDesc : (b.manualAmount ? "Manual amount" : "");
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-semibold text-blue-600 whitespace-nowrap">
                            <Link href={`/admin/bookings/${b.id}`} onClick={() => setShowPostcodeModal(false)} className="hover:underline">
                              {b.jobRef || b.id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{allPcs.join(" / ") || "—"}</td>
                          <td className="px-3 py-2 text-right">{b.miles ? b.miles.toFixed(1) : "—"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{b.collectionDate ? b.collectionDate.split("-").reverse().join("/") : "—"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{b.vehicle?.name ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{extraInfo || "—"}</td>
                          <td className="px-3 py-2 text-right font-semibold">{total ? `£${total.toFixed(2)}` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-right font-semibold text-slate-600">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">
                        £{pcRows.reduce((s, b) => s + (b.manualAmount ?? b.customerPrice ?? 0), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ── Option 2: Postcode counts ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Option 2 — Postcode Totals</h3>
                <button onClick={() => exportPostcodeTotalsCSV(pcRows)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Job Ref</th>
                      <th className="px-3 py-2 text-right font-medium">Postcode Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pcRows.map(b => {
                      const vias = b.viaAddresses?.map(v => v.postcode).filter(Boolean) ?? [];
                      const allPcs = [b.collectionPostcode, ...vias, b.deliveryPostcode].filter(Boolean);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-semibold text-blue-600">
                            <Link href={`/admin/bookings/${b.id}`} onClick={() => setShowPostcodeModal(false)} className="hover:underline">
                              {b.jobRef || b.id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{allPcs.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>)}
        </div>
      </Modal>

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
