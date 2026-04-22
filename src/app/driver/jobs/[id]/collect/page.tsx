"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface Job {
  id: string;
  jobRef?: string;
  collectionName?: string;
  collectionPostcode?: string;
  collectionContact?: string;
  collectionPhone?: string;
  collectionNotes?: string;
  chillUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  ambientUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  driverConfirmCollectionAt?: string | null;
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

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CollectPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [time, setTime] = useState(now);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/driver/jobs/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { router.back(); return; }
        setJob(data);
        if (data.driverConfirmCollectionAt) setConfirmed(true);
        setLoading(false);
      })
      .catch(() => router.back());
  }, [params?.id, router]);

  async function handleConfirm() {
    if (!params?.id) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/jobs/${params.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to confirm collection");
      }
      setConfirmed(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-10">
      <div className="px-5 pt-10 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">Collection</p>
            <p className="text-3xl font-bold text-white leading-tight">
              {job.jobRef ? job.jobRef.split("-").pop() : job.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end pt-1 shrink-0">
            {job.chillUnit && <UnitCard unit={job.chillUnit} />}
            {job.ambientUnit && <UnitCard unit={job.ambientUnit} />}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Collection info */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Collection From</span>
            <span className="text-white font-bold text-right">{job.collectionName || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Postcode</span>
            <span className="text-white font-bold">{job.collectionPostcode || "—"}</span>
          </div>
          {job.collectionContact && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Contact</span>
              <span className="text-white font-medium text-right">{job.collectionContact}</span>
            </div>
          )}
          {job.collectionPhone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Telephone</span>
              <a href={`tel:${job.collectionPhone}`} className="text-blue-400 font-medium">{job.collectionPhone}</a>
            </div>
          )}
        </div>

        {/* Collection notes */}
        {job.collectionNotes && (
          <div className="bg-[#1c1c2e] rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Collection Notes</p>
            <p className="text-sm text-gray-300 leading-relaxed">{job.collectionNotes}</p>
          </div>
        )}

        {/* Success state */}
        {confirmed ? (
          <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-400">Collection Confirmed</p>
              <p className="text-sm text-gray-400">Collection has been recorded at {time}</p>
            </div>
          </div>
        ) : (
          /* Confirm form */
          <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-4">
            <h2 className="font-semibold text-white">Confirm collection time</h2>
            <p className="text-xs text-gray-400 leading-relaxed">By confirming, you agree that you have collected the goods for this job, The storage units are correct and you are ready to start the delivery(s)</p>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Collection time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Confirming..." : "Confirm Collection"}
            </button>
          </div>
        )}

        {confirmed && (
          <button
            onClick={() => router.back()}
            className="w-full bg-[#1c1c2e] border border-white/10 text-white font-semibold py-4 rounded-2xl text-base">
            Back to Job
          </button>
        )}
      </div>
    </div>
  );
}
