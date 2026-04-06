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
  collectionDate?: string;
  collectionTime?: string;
  collectionPostcode?: string;
  deliveryDate?: string;
  deliveryPostcode?: string;
  customerPrice?: number;
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
}

function StatusBadge({ booking }: { booking: Booking }) {
  const isQuote = booking.bookingType?.name?.toLowerCase() === "quote";
  if (isQuote) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Quote</span>;
  if (!booking.driver) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">No Driver</span>;
  if (booking.podSignature && booking.podDataVerify) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Completed</span>;
  if (booking.podSignature) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">POD Received</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">In Progress</span>;
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
    { key: "collectionDate", label: "Collection", render: (r) => (
      <div>
        <p className="font-medium">{r.collectionDate || "—"}</p>
        <p className="text-xs text-slate-400">{r.collectionTime}</p>
      </div>
    )},
    { key: "customer", label: "Customer", render: (r) => (
      <div>
        <p className="font-medium">{r.customer?.name || "—"}</p>
        <p className="text-xs text-slate-400">{r.customer?.accountNumber}</p>
      </div>
    )},
    { key: "collectionPostcode", label: "From → To", render: (r) => (
      <span className="text-sm">{r.collectionPostcode || "—"} → {r.deliveryPostcode || "—"}</span>
    )},
    { key: "vehicle", label: "Vehicle", render: (r) => r.vehicle?.name || "—" },
    { key: "driver", label: "Driver", render: (r) => r.driver?.name || <span className="text-rose-500 text-xs">Unassigned</span> },
    { key: "miles", label: "Miles", render: (r) => r.miles ? `${r.miles.toFixed(1)}` : "—" },
    { key: "customerPrice", label: "Price", render: (r) => r.customerPrice ? `£${r.customerPrice.toFixed(2)}` : "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge booking={r} /> },
    { key: "actions", label: "Actions", render: (r) => (
      <div className="flex items-center gap-1">
        <Link href={`/admin/bookings/${r.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
          <Eye className="w-4 h-4" />
        </Link>
        <Link href={`/admin/bookings/${r.id}?edit=1`} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
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

        <DataTable
          data={bookings}
          columns={columns}
          searchKeys={["collectionPostcode", "deliveryPostcode"]}
          loading={loading}
          emptyMessage="No bookings found. Create your first booking."
        />
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
