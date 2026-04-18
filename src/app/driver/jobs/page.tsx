"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { BottomNav } from "../BottomNav";

interface ViaAddress { id: string; signedBy?: string | null; }

interface Job {
  id: string;
  jobRef?: string;
  collectionTime?: string;
  collectionPostcode?: string;
  deliveryPostcode?: string;
  miles?: number;
  podSignature?: string | null;
  driverConfirmCollectionAt?: string | null;
  chillUnit?: { unitNumber: string } | null;
  ambientUnit?: { unitNumber: string } | null;
  viaAddresses?: ViaAddress[];
}

function UnitPills({ job }: { job: Job }) {
  return (
    <span className="flex gap-1.5">
      {job.chillUnit && (
        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
          MPT{job.chillUnit.unitNumber} Chill
        </span>
      )}
      {job.ambientUnit && (
        <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
          MPT{job.ambientUnit.unitNumber} Ambient
        </span>
      )}
    </span>
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
            const viaCount = job.viaAddresses?.length ?? 0;
            return (
              <div key={job.id}
                className={`bg-[#1c1c2e] rounded-2xl p-4 border ${isCompleted ? "border-emerald-500/50" : "border-white/5"}`}>
                {/* Job ref + unit pills */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Job Ref</p>
                    <p className="font-bold text-white text-lg leading-tight">{job.jobRef || job.id.slice(-8).toUpperCase()}</p>
                  </div>
                  {isCompleted && (
                    <span className="px-2.5 py-1 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-full">
                      Completed
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <UnitPills job={job} />
                </div>

                {/* Route info */}
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                  <span className="font-medium">{job.collectionPostcode || "—"}</span>
                  {viaCount > 0 && (
                    <>
                      <span className="text-gray-600">·</span>
                      <span className="text-blue-400 text-xs font-medium">{viaCount} Via</span>
                    </>
                  )}
                  <span className="text-gray-600">→</span>
                  <span className="font-medium">{job.deliveryPostcode || "—"}</span>
                </div>

                {job.miles != null && (
                  <p className="text-xs text-gray-500 mb-3">{job.miles} miles</p>
                )}

                <Link href={`/driver/jobs/${job.id}`}
                  className="flex items-center gap-1 text-blue-400 text-sm font-medium">
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
