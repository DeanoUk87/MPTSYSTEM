"use client";
import { useState, useEffect, use } from "react";
import Topbar from "@/components/Topbar";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, User, Truck, Package, CheckCircle, XCircle, Pencil, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Booking {
  id: string;
  collectionDate?: string; collectionTime?: string; collectionName?: string;
  collectionAddress1?: string; collectionAddress2?: string; collectionArea?: string;
  collectionCountry?: string; collectionPostcode?: string; collectionContact?: string;
  collectionPhone?: string; collectionNotes?: string;
  deliveryDate?: string; deliveryTime?: string; deliveryName?: string;
  deliveryAddress1?: string; deliveryAddress2?: string; deliveryArea?: string;
  deliveryCountry?: string; deliveryPostcode?: string; deliveryContact?: string;
  deliveryPhone?: string; deliveryNotes?: string;
  customer?: any; vehicle?: any; driver?: any; secondMan?: any; cxDriver?: any;
  bookingType?: any; chillUnit?: any; ambientUnit?: any;
  customerPrice?: number; miles?: number; driverCost?: number; extraCost?: number;
  cxDriverCost?: number; extraCost2?: number; extraCost2Label?: string;
  numberOfItems?: number; weight?: number; purchaseOrder?: string; bookedBy?: string;
  jobNotes?: string; officeNotes?: string; weekend: number; jobStatus: number;
  podSignature?: string; podTime?: string; podDate?: string; podDataVerify: boolean;
  podRelationship?: string; driverNote?: string; deliveredTemperature?: string;
  hideTrackingTemperature: boolean; hideTrackingMap: boolean;
  jobRef?: string;
  viaAddresses?: any[];
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 min-w-32">{label}:</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function formatDate(s?: string) {
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function AddressBlock({ title, prefix, data }: { title: string; prefix: string; data: Booking }) {
  const addr = [
    (data as any)[`${prefix}Name`],
    (data as any)[`${prefix}Address1`],
    (data as any)[`${prefix}Address2`],
    (data as any)[`${prefix}Area`],
    (data as any)[`${prefix}Postcode`],
    (data as any)[`${prefix}Country`],
  ].filter(Boolean).join(", ");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="text-sm text-slate-600 space-y-1">
        <p>{formatDate((data as any)[`${prefix}Date`])} {(data as any)[`${prefix}Time`]}</p>
        <p>{addr || "No address"}</p>
        {(data as any)[`${prefix}Contact`] && <p>Contact: {(data as any)[`${prefix}Contact`]} {(data as any)[`${prefix}Phone`] ? `· ${(data as any)[`${prefix}Phone`]}` : ""}</p>}
        {(data as any)[`${prefix}Notes`]?.split("---ORDERS---")[0] && <p className="text-amber-600">Note: {(data as any)[`${prefix}Notes`].split("---ORDERS---")[0]}</p>}
        {(data as any)[`${prefix}Notes`]?.includes("---ORDERS---") && (() => {
          try {
            const orders = JSON.parse((data as any)[`${prefix}Notes`].split("---ORDERS---")[1] || "[]");
            return orders.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {orders.map((o: any, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">{o.ref} · {o.type}</span>
                ))}
              </div>
            ) : null;
          } catch { return null; }
        })()}
      </div>
    </div>
  );
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => { setBooking(d); setLoading(false); });
  }, [id]);

  async function handleVerifyPod() {
    if (!booking) return;
    setVerifying(true);
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, podDataVerify: !booking.podDataVerify }),
      });
      setBooking(b => b ? { ...b, podDataVerify: !b.podDataVerify } : b);
      toast.success(booking.podDataVerify ? "POD verification removed" : "POD verified");
    } catch { toast.error("Failed to update"); } finally { setVerifying(false); }
  }

  async function toggleField(field: "hideTrackingTemperature" | "hideTrackingMap") {
    if (!booking) return;
    const newVal = !booking[field];
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, [field]: newVal }),
      });
      setBooking(b => b ? { ...b, [field]: newVal } : b);
      toast.success(newVal ? "Hidden on customer view" : "Visible on customer view");
    } catch { toast.error("Failed to update"); }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  if (!booking) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-slate-500">Booking not found.</p>
    </div>
  );

  const profit = ((booking.customerPrice || 0) + (booking.extraCost2 || 0)) -
    ((booking.driverCost || 0) + (booking.extraCost || 0) + (booking.cxDriverCost || 0));

  return (
    <div className="flex-1">
      <Topbar title={`Booking #${booking.jobRef || id.slice(-8).toUpperCase()}`} subtitle={booking.customer?.name} />
      <div className="p-6 space-y-4 max-w-5xl">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/bookings" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back to bookings
          </Link>
          <Link href={`/admin/bookings/${id}/edit`}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Pencil className="w-3 h-3" /> Edit
          </Link>
        </div>

        {/* Status bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {booking.driver ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
            <span className="text-sm">{booking.driver ? `Driver: ${booking.driver.name}` : "No driver assigned"}</span>
          </div>
          <div className="flex items-center gap-2">
            {booking.podSignature ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
            <span className="text-sm">{booking.podSignature ? "POD Received" : "Awaiting POD"}</span>
          </div>
          {booking.podSignature && (
            <button onClick={handleVerifyPod} disabled={verifying}
              className={clsx("flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                booking.podDataVerify ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              )}>
              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {booking.podDataVerify ? "✓ POD Verified" : "Mark as Verified"}
            </button>
          )}
          <span className={clsx("ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium",
            booking.jobStatus === 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}>
            {booking.jobStatus === 1 ? "Sent to Accounts" : "Active"}
          </span>
        </div>

        {/* Customer view tracking toggles */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Customer View:</span>
          <button
            onClick={() => toggleField("hideTrackingTemperature")}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              booking.hideTrackingTemperature
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            {booking.hideTrackingTemperature ? "🌡️ Temp Tracking OFF" : "🌡️ Temp Tracking ON"}
          </button>
          <button
            onClick={() => toggleField("hideTrackingMap")}
            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              booking.hideTrackingMap
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            {booking.hideTrackingMap ? "🗺️ Map Tracking OFF" : "🗺️ Map Tracking ON"}
          </button>
        </div>

        {/* Addresses + Via stops — collection left, via(s) middle, delivery right */}
        {(booking.viaAddresses?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-3 gap-4 items-start">
            <AddressBlock title="Collection" prefix="collection" data={booking} />
            <div className="space-y-3">
              {booking.viaAddresses?.map((v: any, idx: number) => (
                <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-1 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">Via {booking.viaAddresses!.length > 1 ? idx + 1 : ""}</h3>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{v.viaType}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {[v.name, v.address1, v.address2, v.area, v.postcode].filter(Boolean).join(", ") || "No address"}
                  </p>
                  {v.contact && <p className="text-xs text-slate-400">Contact: {v.contact}{v.phone ? ` · ${v.phone}` : ""}</p>}
                  {v.viaDate && <p className="text-xs text-slate-400">{formatDate(v.viaDate)} {v.viaTime}</p>}
                  {v.signedBy && <p className="text-xs text-emerald-600">✓ POD: {v.signedBy}</p>}
                  {v.notes?.split("---ORDERS---")[0] && <p className="text-xs text-amber-600">{v.notes.split("---ORDERS---")[0]}</p>}
                  {v.notes?.includes("---ORDERS---") && (() => {
                    try {
                      const orders = JSON.parse(v.notes.split("---ORDERS---")[1] || "[]");
                      return orders.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {orders.map((o: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">{o.ref} · {o.type}</span>
                          ))}
                        </div>
                      ) : null;
                    } catch { return null; }
                  })()}
                </div>
              ))}
            </div>
            <AddressBlock title="Delivery" prefix="delivery" data={booking} />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <AddressBlock title="Collection" prefix="collection" data={booking} />
            <AddressBlock title="Delivery" prefix="delivery" data={booking} />
          </div>
        )}

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Job info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-blue-600" />Job Details</h3>
            <InfoRow label="Customer" value={booking.customer?.name} />
            <InfoRow label="Account" value={booking.customer?.accountNumber} />
            <InfoRow label="PO Number" value={booking.purchaseOrder} />
            <InfoRow label="Booked By" value={booking.bookedBy} />
            <InfoRow label="Type" value={booking.bookingType?.name || "Standard"} />
            <InfoRow label="Items" value={booking.numberOfItems} />
            <InfoRow label="Weight" value={booking.weight ? `${booking.weight} kg` : undefined} />
            <InfoRow label="Vehicle" value={booking.vehicle?.name} />
            <InfoRow label="Miles" value={booking.miles ? `${booking.miles.toFixed(1)} mi` : undefined} />
            {booking.jobNotes && <p className="text-xs text-amber-600 mt-2">Driver Note: {booking.jobNotes}</p>}
            {booking.officeNotes && <p className="text-xs text-slate-400 mt-1">Office: {booking.officeNotes}</p>}
          </div>

          {/* Financials */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600" />Drivers & Financials</h3>
            <InfoRow label="Driver" value={booking.driver?.name} />
            <InfoRow label="Driver Cost" value={booking.driverCost ? `£${booking.driverCost.toFixed(2)}` : undefined} />
            <InfoRow label="Second Man" value={booking.secondMan?.name} />
            <InfoRow label="2nd Man Cost" value={booking.extraCost ? `£${booking.extraCost.toFixed(2)}` : undefined} />
            <InfoRow label="CX Driver" value={booking.cxDriver?.name} />
            <InfoRow label="CX Cost" value={booking.cxDriverCost ? `£${booking.cxDriverCost.toFixed(2)}` : undefined} />
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
              <InfoRow label="Customer Price" value={booking.customerPrice ? `£${booking.customerPrice.toFixed(2)}` : undefined} />
              {booking.extraCost2 && <InfoRow label={booking.extraCost2Label || "Extra Charge"} value={`£${booking.extraCost2.toFixed(2)}`} />}
              <div className={clsx("flex gap-2 text-sm font-semibold", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                <span className="min-w-32">Margin:</span>
                <span>£{profit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* POD */}
        {(booking.podSignature || booking.viaAddresses?.some((v: any) => v.signedBy)) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />Proof of Delivery
            </h3>
            {booking.podSignature && (
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <InfoRow label="Signed By" value={booking.podSignature} />
                <InfoRow label="Relationship" value={booking.podRelationship} />
                <InfoRow label="POD Date" value={formatDate(booking.podDate)} />
                <InfoRow label="POD Time" value={booking.podTime} />
                <InfoRow label="Temperature" value={booking.deliveredTemperature} />
                {booking.driverNote && <InfoRow label="Driver Note" value={booking.driverNote} />}
              </div>
            )}
            {booking.viaAddresses?.map((v: any, idx: number) => v.signedBy ? (
              <div key={v.id} className="border-t border-slate-100 pt-3 mt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Via {idx + 1} POD</p>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <InfoRow label="Signed By" value={v.signedBy} />
                  <InfoRow label="Relationship" value={v.podRelationship} />
                  <InfoRow label="POD Date" value={formatDate(v.podDate)} />
                  <InfoRow label="POD Time" value={v.podTime} />
                  <InfoRow label="Temperature" value={v.deliveredTemp} />
                </div>
              </div>
            ) : null)}
          </div>
        )}

        {/* Units */}
        {(booking.chillUnit || booking.ambientUnit) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Temperature Units</h3>
            <div className="flex gap-4 text-sm flex-wrap">
              {[booking.chillUnit, booking.ambientUnit]
                .filter((u, i, arr) => u && arr.findIndex((x: any) => x?.id === u.id) === i)
                .map((u: any) => (
                  <span key={u.id} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    {u.unitType ? u.unitType.charAt(0).toUpperCase() + u.unitType.slice(1) : "Unit"}: {u.unitNumber}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
