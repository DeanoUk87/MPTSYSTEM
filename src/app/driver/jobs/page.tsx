"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { BottomNav } from "../BottomNav";

interface ViaAddress { id: string; postcode?: string; signedBy?: string | null; }
interface Unit { unitNumber: string; unitType?: string; }

interface Job {
  id: string;
  jobRef?: string;
  collectionTime?: string;
  collectionPostcode?: string;
  deliveryPostcode?: string;
  miles?: number;
  podSignature?: string | null;
  driverConfirmCollectionAt?: string | null;
  chillUnit?: Unit | null;
  ambientUnit?: Unit | null;
  viaAddresses?: ViaAddress[];
}

function jobRefDisplay(job: Job) {
  if (job.jobRef) {
    const parts = job.jobRef.split("-");
    return parts.length > 1 ? parts[parts.length - 1] : job.jobRef;
  }
  return job.id.slice(-8).toUpperCase();
}

function UnitCard({ unit }: { unit: Unit }) {
  const isChill = (unit.unitType || "").toLowerCase().startsWith("chill");
  return (
    <div className={`rounded-xl px-3 py-2 text-xs ${isChill ? "bg-blue-900/50 border border-blue-500/30" : "bg-amber-900/50 border border-amber-500/30"}`}>
      <p className="font-bold text-white leading-tight">{unit.unitNumber}</p>
      <p className={`mt-0.5 ${isChill ? "text-blue-300" : "text-amber-300"}`}>{isChill ? "Chill" : "Ambient"}</p>
      <p className="text-gray-500 mt-0.5">—°C</p>
    </div>
  );
}

export default function DriverJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(user => {
      if (!user?.dcontactId) { router.push("/login"); return; }
    }).catch(() => router.push("/login"));

    fetch("/api/driver/jobs")
      .then(r => r.ok ? r.json() : [])
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <h1 className="text-2xl font-bold text-white">Today&apos;s jobs</h1>
        <p className="text-gray-500 text-sm mt-1">{today} · {jobs.length} job{jobs.length !== 1 ? "s" : ""} assigned</p>
      </div>

      <div className="px-4 space-y-3">
        {jobs.length === 0 ? (
          <div className="bg-[#1c1c2e] rounded-2xl p-8 text-center mt-6">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No jobs assigned for today.</p>
          </div>
        ) : (
          jobs.map(job => {
            const isCompleted = !!job.podSignature;
            const units = [job.chillUnit, job.ambientUnit].filter(Boolean) as Unit[];
            const vias = job.viaAddresses || [];
            return (
              <div key={job.id}
                className={`bg-[#1c1c2e] rounded-2xl p-4 border ${isCompleted ? "border-emerald-500/50" : "border-white/5"}`}>

                {/* Top row: Job Ref (left) + Unit cards (right) */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Job Ref</p>
                    <p className="font-bold text-white text-2xl leading-tight">{jobRefDisplay(job)}</p>
                    {isCompleted && (
                      <span className="mt-1 inline-block px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  {units.length > 0 && (
                    <div className="flex gap-2 shrink-0">
                      {units.map((u, i) => <UnitCard key={i} unit={u} />)}
                    </div>
                  )}
                </div>

                {/* Route info */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Collection</span>
                    <span className="font-bold text-white">{job.collectionPostcode || "—"}</span>
                  </div>
                  {vias.map((v, i) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Via{vias.length > 1 ? ` ${i + 1}` : ""}</span>
                      <span className="font-bold text-white">{v.postcode || "—"}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="font-bold text-white">{job.deliveryPostcode || "—"}</span>
                  </div>
                  {job.miles != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Miles</span>
                      <span className="text-gray-300">{job.miles}</span>
                    </div>
                  )}
                </div>

                <Link href={`/driver/jobs/${job.id}`}
                  className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium">
                  View Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>

      <BottomNav active="jobs" />
    </div>
  );
}
