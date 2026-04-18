"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";

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

function UnitPills({ job }: { job: Job }) {
  const units = [
    job.chillUnit,
    job.ambientUnit,
  ].filter(Boolean) as { unitNumber: string; unitType?: string; temperature?: string | null }[];
  return (
    <>
      {units.map((u, i) => {
        const isChill = (u.unitType || "").toLowerCase().startsWith("chill");
        return (
          <span key={i} className={`px-2.5 py-1 text-white text-xs font-semibold rounded-full ${
            isChill ? "bg-blue-600" : "bg-amber-500"
          }`}>
            {u.unitNumber} {isChill ? "Chill" : "Ambient"}{u.temperature != null ? ` · ${u.temperature}°C` : ""}
          </span>
        );
      })}
    </>
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
    <div className="min-h-screen bg-[#0a0a14] pb-10">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white">Job detail</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Job ref + unit pills */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Job Ref</p>
          <p className="font-bold text-white text-2xl mb-3">{job.jobRef || job.id.slice(-8).toUpperCase()}</p>
          <div className="flex flex-wrap gap-1.5">
            <UnitPills job={job} />
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
          {job.miles != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Miles</span>
              <span className="text-white font-medium">{job.miles}</span>
            </div>
          )}
        </div>

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
        {(job.collectionNotes || job.deliveryNotes || job.jobNotes || job.officeNotes) && (
          <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Notes</h2>
            {job.collectionNotes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Collection notes</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{job.collectionNotes.split("---ORDERS---")[0].trim()}</p>
              </div>
            )}
            {job.deliveryNotes && job.deliveryNotes.split("---ORDERS---")[0].trim() && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivery notes</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{job.deliveryNotes.split("---ORDERS---")[0].trim()}</p>
              </div>
            )}
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
        )}
      </div>
    </div>
  );
}
