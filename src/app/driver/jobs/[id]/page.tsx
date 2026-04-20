"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { BottomNav } from "@/app/driver/BottomNav";

interface ViaAddress {
  id: string;
  name?: string;
  postcode?: string;
  notes?: string;
  signedBy?: string | null;
  podTime?: string | null;
}

interface Job {
  id: string;
  jobRef?: string;
  collectionName?: string;
  collectionPostcode?: string;
  collectionAddress1?: string;
  collectionNotes?: string;
  deliveryName?: string;
  deliveryPostcode?: string;
  deliveryAddress1?: string;
  deliveryNotes?: string;
  jobNotes?: string;
  officeNotes?: string;
  purchaseOrder?: string;
  miles?: number;
  collectionDate?: string;
  collectionTime?: string;
  driverConfirmCollectionAt?: string | null;
  podSignature?: string | null;
  chillUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  ambientUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  customer?: { name: string } | null;
  viaAddresses?: ViaAddress[];
}

function jobRefDisplay(job: Job) {
  if (job.jobRef) {
    const parts = job.jobRef.split("-");
    return parts.length > 1 ? parts[parts.length - 1] : job.jobRef;
  }
  return job.id.slice(-8).toUpperCase();
}

function UnitCard({ unit }: { unit: { unitNumber: string; unitType?: string; temperature?: string | null } }) {
  const isChill = (unit.unitType || "").toLowerCase().startsWith("chill");
  return (
    <div className={`rounded-xl px-3 py-2 text-xs ${
      isChill ? "bg-blue-900/50 border border-blue-500/30" : "bg-amber-900/50 border border-amber-500/30"
    }`}>
      <p className="font-bold text-white leading-tight">{unit.unitNumber}</p>
      <p className={`mt-0.5 ${isChill ? "text-blue-300" : "text-amber-300"}`}>{isChill ? "Chill" : "Ambient"}</p>
      <p className="text-gray-500 mt-0.5">{unit.temperature != null ? `${unit.temperature}°C` : "—°C"}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/driver/jobs/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error("Job not found");
        return r.json();
      })
      .then(data => { setJob(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">{error || "Job not found"}</p>
        <button onClick={() => router.back()} className="text-blue-400 text-sm">Go back</button>
      </div>
    );
  }

  const vias = job.viaAddresses ?? [];
  const allViasDelivered = vias.every(v => !!v.signedBy);
  const isCollected = !!job.driverConfirmCollectionAt;
  const isDelivered = !!job.podSignature;

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <button onClick={() => router.push("/driver/jobs")} className="flex items-center gap-1 text-gray-400 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white">Job detail</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Job ref + unit cards */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Job Ref */}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Job Ref</p>
              <p className="font-bold text-white text-3xl leading-tight">{jobRefDisplay(job)}</p>
              {isDelivered && (
                <span className="mt-2 inline-block px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-full">Completed</span>
              )}
            </div>
            {/* Right: Unit cards */}
            {[job.chillUnit, job.ambientUnit].filter(Boolean).length > 0 && (
              <div className="flex gap-2 shrink-0">
                {[job.chillUnit, job.ambientUnit].filter(Boolean).map((u, i) => (
                  <UnitCard key={i} unit={u!} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Route info card */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Collection from</span>
            <span className="text-white font-medium text-right">{job.collectionName || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Postcode</span>
            <span className="text-white font-medium">{job.collectionPostcode || "—"}</span>
          </div>
          {vias.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Via stops</span>
              <span className="text-blue-400 font-medium">{vias.length} stop{vias.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="border-t border-white/5 pt-2 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery to</span>
              <span className="text-white font-medium text-right">{job.deliveryName || "—"}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Postcode</span>
              <span className="text-white font-medium">{job.deliveryPostcode || "—"}</span>
            </div>
          </div>
        </div>

        {/* Collected orders */}
        {(() => {
          const allOrders: { ref: string; types: string[] }[] = [];
          const parseSrc = (raw: string | undefined | null) => {
            if (!raw?.includes("---ORDERS---")) return;
            try {
              const parsed = JSON.parse(raw.split("---ORDERS---")[1] || "[]");
              parsed.forEach((o: any) => allOrders.push({
                ref: o.ref || "",
                types: Array.isArray(o.types) ? o.types : o.type ? [o.type] : [],
              }));
            } catch { /* ignore */ }
          };
          parseSrc(job.deliveryNotes);
          job.viaAddresses?.forEach((v) => parseSrc((v as any).notes));
          if (allOrders.length === 0) return null;
          return (
            <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Collected Orders</h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allOrders.map((o, i) => (
                  <span key={i} className="px-2 py-1 bg-orange-900/50 border border-orange-500/40 text-orange-300 rounded-full text-xs font-medium">
                    {o.ref}{o.types.length > 0 ? ` · ${o.types.join(" & ")}` : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Delivery stages */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Delivery stages</h2>

          {/* Collection stage */}
          <Link href={isCollected ? "#" : `/driver/jobs/${job.id}/collect`}
            className={`flex items-center gap-3 py-3 ${isCollected ? "pointer-events-none" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCollected ? "bg-emerald-500" : "border-2 border-gray-600"}`}>
              {isCollected ? <CheckCircle className="w-5 h-5 text-white" /> : <Circle className="w-4 h-4 text-gray-600" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Collection</p>
              <p className="text-sm text-white">{job.collectionPostcode || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {isCollected
                ? <span className="px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs rounded-full">Collected</span>
                : <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded-full">Not Collected</span>
              }
              {!isCollected && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </div>
          </Link>

          {/* Via stages */}
          {vias.map((via, i) => {
            const viaDelivered = !!via.signedBy;
            const prevDone = i === 0 ? isCollected : !!vias[i - 1]?.signedBy;
            return (
              <div key={via.id}>
                <div className="w-0.5 h-4 bg-gray-700 ml-4" />
                <Link href={prevDone && !viaDelivered ? `/driver/jobs/${job.id}/via/${via.id}` : "#"}
                  className={`flex items-center gap-3 py-3 ${!prevDone || viaDelivered ? "pointer-events-none opacity-60" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${viaDelivered ? "bg-emerald-500" : "border-2 border-gray-600"}`}>
                    {viaDelivered ? <CheckCircle className="w-5 h-5 text-white" /> : <Circle className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Via {i + 1}</p>
                    <p className="text-sm text-white">{via.name} · {via.postcode || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {viaDelivered
                      ? <span className="px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs rounded-full">Delivered</span>
                      : <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded-full">Pending</span>
                    }
                    {prevDone && !viaDelivered && <ChevronRight className="w-4 h-4 text-gray-600" />}
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Final delivery stage */}
          <div className="w-0.5 h-4 bg-gray-700 ml-4" />
          <Link href={(isCollected && allViasDelivered && !isDelivered) ? `/driver/jobs/${job.id}/deliver` : "#"}
            className={`flex items-center gap-3 py-3 ${!(isCollected && allViasDelivered && !isDelivered) ? "pointer-events-none opacity-60" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDelivered ? "bg-emerald-500" : "border-2 border-gray-600"}`}>
              {isDelivered ? <CheckCircle className="w-5 h-5 text-white" /> : <Circle className="w-4 h-4 text-gray-600" />}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Final Delivery</p>
              <p className="text-sm text-white">{job.deliveryPostcode || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {isDelivered
                ? <span className="px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs rounded-full">Delivered</span>
                : <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded-full">Pending</span>
              }
              {(isCollected && allViasDelivered && !isDelivered) && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </div>
          </Link>
        </div>

        {/* Notes sections */}
        <BottomNav active="jobs" />
        {(() => {
          const collText = job.collectionNotes?.trim();
          const delivText = job.deliveryNotes?.split("---ORDERS---")[0].trim();
          const viaNotesItems = (job.viaAddresses || []).map((v, i) => ({
            label: `Via ${i + 1} notes`,
            text: (v as any).notes?.split("---ORDERS---")[0].trim(),
          })).filter(x => x.text);
          const hasNotes = collText || delivText || viaNotesItems.length > 0 || job.jobNotes || job.officeNotes;
          if (!hasNotes) return null;
          return (
            <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Notes</h2>
              {collText && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Collection notes</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{collText}</p>
                </div>
              )}
              {delivText && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Delivery notes</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{delivText}</p>
                </div>
              )}
              {viaNotesItems.map((vn, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1">{vn.label}</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{vn.text}</p>
                </div>
              ))}
              {job.jobNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Job notes</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{job.jobNotes}</p>
                </div>
              )}
              {job.officeNotes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Office notes</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{job.officeNotes}</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
