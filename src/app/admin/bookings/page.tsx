"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import DataTable, { Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Booking {
  id: string;
  jobRef?: string;
  collectionDate?: string;
  collectionTime?: string;
  collectionPostcode?: string;
  deliveryDate?: string;
  deliveryPostcode?: string;
  customerPrice?: number;
  driverCost?: number;
  miles?: number;
  numberOfItems?: number;
  weight?: number;
  jobStatus: number;
  podDataVerify: boolean;
  podSignature?: string;
  customer?: { name: string; accountNumber?: string };
  vehicle?: { name: string };
  driver?: { name: string; driverType: string };
  bookingType?: { name: string };
  viaAddresses?: { id: string; postcode?: string; viaType?: string; signedBy?: string }[];
}

function StatusBadge({ booking }: { booking: Booking }) {
  const isQuote = booking.bookingType?.name?.toLowerCase() === "quote";
  if (isQuote) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">Quote</span>;
  if (!booking.driver) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">No Driver</span>;
  const allViasPodded = !booking.viaAddresses?.length || booking.viaAddresses.every(v => v.signedBy);
  if (booking.podSignature && booking.podDataVerify && allViasPodded) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">Completed</span>;
  if (booking.podSignature && allViasPodded) return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">POD Received</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">Driver Allocated</span>;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterStatus !== "") params.set("status", filterStatus);
    const res = await fetch(`/api/bookings?${params}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleDelete(b: Booking) {
    try {
      const res = await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Booking deleted");
      setDeleteTarget(null);
      fetchBookings();
    } catch (e: any) { toast.error(e.message); }
  }

  const columns: Column<Booking>[] = [
    { key: "jobRef", label: "Job Ref", render: (r) => (
      <Link href={`/admin/bookings/${r.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">{r.jobRef || r.id.slice(-6).toUpperCase()}</Link>
    )},
    { key: "collectionDate", label: "Date", render: (r) => r.collectionDate ? r.collectionDate.split("-").reverse().join("-") : "—" },
    { key: "collectionTime", label: "Time", render: (r) => r.collectionTime || "—" },
    { key: "customer", label: "Customer", render: (r) => (
      <p className="font-medium whitespace-nowrap">{r.customer?.name || "—"}</p>
    )},
    { key: "collectionPostcode", label: "From", render: (r) => r.collectionPostcode || "—" },
    { key: "via1", label: "Via 1", render: (r) => r.viaAddresses?.[0]?.postcode || "—" },
    { key: "via2", label: "Via 2", render: (r) => r.viaAddresses?.[1]?.postcode || "—" },
    { key: "via3", label: "Via 3", render: (r) => r.viaAddresses?.[2]?.postcode || "—" },
    { key: "via4", label: "Via 4", render: (r) => r.viaAddresses?.[3]?.postcode || "—" },
    { key: "via5", label: "Via 5", render: (r) => r.viaAddresses?.[4]?.postcode || "—" },
    { key: "via6", label: "Via 6", render: (r) => r.viaAddresses?.[5]?.postcode || "—" },
    { key: "deliveryPostcode", label: "To", render: (r) => r.deliveryPostcode || "—" },
    { key: "driver", label: "Driver", render: (r) => r.driver?.name || <span className="text-rose-500 text-xs">Unassigned</span> },
    { key: "driverCost", label: "Driver Cost", render: (r) => r.driverCost ? `£${r.driverCost.toFixed(2)}` : "—" },
    { key: "vehicle", label: "Vehicle", render: (r) => r.vehicle?.name || "—" },
    { key: "customerPrice", label: "Total", render: (r) => r.customerPrice ? `£${r.customerPrice.toFixed(2)}` : "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge booking={r} /> },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <Link href={`/admin/bookings/${r.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
          <Eye className="w-4 h-4" />
        </Link>
        <Link href={`/admin/bookings/${r.id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
          <Pencil className="w-4 h-4" />
        </Link>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="flex-1">
      <Topbar title="Bookings" subtitle="Manage sameday transport bookings" />
      <div className="p-6 space-y-4">
        {/* Filters + Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="0">Active</option>
              <option value="1">Sent to Accounts</option>
            </select>
            {(filterDate || filterStatus) && (
              <button onClick={() => { setFilterDate(""); setFilterStatus(""); }}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Clear</button>
            )}
          </div>
          <Link href="/admin/bookings/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: bookings.length, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
            { label: "No Driver", value: bookings.filter(b => !b.driver).length, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
            { label: "In Progress", value: bookings.filter(b => b.driver && !b.podSignature).length, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Completed", value: bookings.filter(b => b.podSignature && b.podDataVerify).length, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
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
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> POD received</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Completed</span>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            data={bookings}
            columns={columns}
            searchKeys={["collectionPostcode", "deliveryPostcode"]}
            loading={loading}
            emptyMessage="No bookings found. Create your first booking."
            rowClassName={(b: Booking) => {
              const isQuote = b.bookingType?.name?.toLowerCase() === "quote";
              if (isQuote) return "bg-slate-50";
              if (b.podSignature && b.podDataVerify) return "bg-emerald-50 border-l-4 border-l-emerald-400";
              if (b.podSignature) return "bg-blue-50 border-l-4 border-l-blue-400";
              if (b.driver) return "bg-amber-50 border-l-4 border-l-amber-400";
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
