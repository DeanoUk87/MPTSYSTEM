"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Camera, FolderOpen, X, CheckCircle, AlertTriangle } from "lucide-react";

interface ViaAddress {
  id: string;
  name?: string;
  postcode?: string;
  notes?: string;
  signedBy?: string | null;
}

interface Job {
  id: string;
  jobRef?: string;
  chillUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  ambientUnit?: { unitNumber: string; unitType?: string; temperature?: string | null } | null;
  viaAddresses?: ViaAddress[];
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

type Order = { ref: string; types: string[] };

function parseOrders(raw: string | undefined): Order[] {
  if (!raw?.includes("---ORDERS---")) return [];
  try {
    const parsed = JSON.parse(raw.split("---ORDERS---")[1] || "[]");
    return parsed.map((o: any) => ({
      ref: o.ref || "",
      types: Array.isArray(o.types) ? o.types : o.type ? [o.type] : [],
    }));
  } catch { return []; }
}

function buildAutoTemp(
  orders: Order[],
  chillUnit?: { temperature?: string | null } | null,
  ambientUnit?: { temperature?: string | null } | null,
): string {
  if (orders.length === 0) return "";
  const allTypes = orders.flatMap(o => o.types).map(t => t.toLowerCase());
  const needsChill = allTypes.some(t => t === "chill");
  const needsAmb   = allTypes.some(t => t === "amb");
  const parts: string[] = [];
  if (needsChill && chillUnit?.temperature != null)   parts.push(`Chill: ${chillUnit.temperature}\u00b0C`);
  if (needsAmb   && ambientUnit?.temperature != null) parts.push(`Amb: ${ambientUnit.temperature}\u00b0C`);
  return parts.join(" / ");
}

function orderTypeLabel(types: string[]): string {
  if (types.length === 0) return "";
  const allTypes = types.map(t => t.toLowerCase());
  const hasChill = allTypes.includes("chill");
  const hasAmb   = allTypes.includes("amb");
  const hasPump  = allTypes.includes("pump");
  const hasStores = allTypes.includes("stores");
  if (hasChill && hasAmb)   return "Chill \u2744\ufe0f & Ambient \uD83C\uDF21";
  if (hasChill)             return "Chill \u2744\ufe0f";
  if (hasAmb)               return "Ambient \uD83C\uDF21";
  if (hasPump && hasStores) return "Pump & Stores";
  if (hasPump)              return "Pump";
  if (hasStores)            return "Stores";
  return types.join(" & ");
}

export default function ViaDeliverPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [via, setVia] = useState<ViaAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [signedBy, setSignedBy] = useState("");
  const [time, setTime] = useState(now);
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingAutoTemp, setPendingAutoTemp] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams<{ id: string; viaId: string }>();

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/driver/jobs/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: Job | null) => {
        if (!data) { router.back(); return; }
        setJob(data);
        const v = data.viaAddresses?.find(v => v.id === params.viaId) ?? null;
        if (!v) { router.back(); return; }
        setVia(v);
        if (v.signedBy) setDone(true);
        setLoading(false);
      })
      .catch(() => router.back());
  }, [params?.id, params?.viaId, router]);

  function handleFile(file: File | null) {
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit() {
    if (!params?.id || !params?.viaId || !signedBy.trim()) {
      setError("Signed by name is required.");
      return;
    }
    setError("");
    const orders = parseOrders(via?.notes);
    const autoTemp = buildAutoTemp(orders, job?.chillUnit, job?.ambientUnit);
    setPendingOrders(orders);
    setPendingAutoTemp(autoTemp);
    setShowModal(true);
  }

  async function doSubmit() {
    if (!params?.id || !params?.viaId) return;
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("signedBy", signedBy.trim());
      fd.append("time", time);
      fd.append("relationship", relationship);
      fd.append("temperature", pendingAutoTemp);
      fd.append("notes", notes);
      if (photo) fd.append("photo", photo);

      const res = await fetch(`/api/driver/jobs/${params.id}/via/${params.viaId}`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit via delivery");
      }
      setShowModal(false);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
      setShowModal(false);
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

  if (!job || !via) return null;

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6 gap-6">
        <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-2xl p-6 text-center w-full max-w-sm">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-white text-xl mb-1">Via Delivery Complete</p>
          <p className="text-gray-400 text-sm">Delivery at {via.name || via.postcode} has been recorded.</p>
        </div>
        <button onClick={() => router.push(`/driver/jobs/${params.id}`)}
          className="w-full max-w-sm bg-blue-600 text-white font-semibold py-4 rounded-2xl text-base">
          Back to Job
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-10">
      <div className="px-5 pt-10 pb-5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 mb-5">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Via Delivery</p>
            <p className="font-bold text-white text-3xl leading-tight">
              {job.jobRef ? job.jobRef.split("-").pop() : job.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 pt-1">
            {[job.chillUnit, job.ambientUnit].filter(Boolean).map((u, i) => (
              <UnitCard key={i} unit={u!} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Via / Delivery info */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery to</span>
            <span className="text-white font-bold text-right">{via.name || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Postcode</span>
            <span className="text-white font-bold">{via.postcode || "—"}</span>
          </div>
          {via.notes?.split("---ORDERS---")[0].trim() && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-300">{via.notes.split("---ORDERS---")[0].trim()}</p>
            </div>
          )}
        </div>

        {/* Collected orders for this via */}
        {(() => {
          const orders = parseOrders(via.notes);
          if (orders.length === 0) return null;
          return (
            <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Order Number(s)</h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {orders.map((o, i) => (
                  <span key={i} className="px-2 py-1 bg-orange-900/50 border border-orange-500/40 text-orange-300 rounded-full text-xs font-medium">
                    {o.ref}{o.types.length > 0 ? ` · ${orderTypeLabel(o.types)}` : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* POD photo */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold text-white">Proof of delivery</h2>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="POD preview" className="w-full rounded-xl object-cover max-h-52" />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium">
                <Camera className="w-4 h-4" /> Use camera
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0a0a14] border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-medium">
                <FolderOpen className="w-4 h-4" /> Choose files
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          <input ref={fileRef} type="file" accept="image/*,application/pdf"
            className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
        </div>

        {/* Recipient details */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-white">Recipient details</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Recipient name <span className="text-red-400">*</span></label>
            <input type="text" value={signedBy} onChange={e => setSignedBy(e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Delivery time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Relationship to recipient</label>
            <input type="text" value={relationship} onChange={e => setRelationship(e.target.value)}
              placeholder="e.g. Manager, Staff member"
              className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600" />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4">
          <label className="block text-xs text-gray-500 mb-1.5">Notes for office</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={3} placeholder="Any additional notes..."
            className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600 resize-none" />
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 rounded-xl p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed">
          Complete Via Delivery
        </button>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#1c1c2e] rounded-t-3xl w-full max-w-lg p-6 space-y-5 pb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Confirm Via Delivery</p>
                <p className="text-xs text-gray-400">Please review and confirm before submitting</p>
              </div>
            </div>

            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">You are confirming delivery of:</p>
                <div className="space-y-2">
                  {pendingOrders.map((o, i) => (
                    <div key={i} className="bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                      <p className="text-white font-semibold">{o.ref}</p>
                      {o.types.length > 0 && (
                        <span className="text-xs text-orange-300 bg-orange-900/40 border border-orange-500/30 rounded-full px-2 py-0.5">
                          {orderTypeLabel(o.types)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm">Please confirm you have completed this via delivery and all details are correct.</p>
            )}

            {pendingAutoTemp ? (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 space-y-1">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Auto Temperature Reading</p>
                <p className="text-white font-bold text-lg">{pendingAutoTemp}</p>
                <p className="text-xs text-gray-500">Automatically recorded from your unit sensor \u2014 no manual entry needed.</p>
              </div>
            ) : pendingOrders.some(o => o.types.some(t => ["pump","stores"].includes(t.toLowerCase()))) ? (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-400">No temperature reading required for this order type.</p>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-900/40 border border-red-500/40 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-300 font-semibold text-base">
                Cancel
              </button>
              <button onClick={doSubmit} disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-base disabled:opacity-50">
                {saving ? "Submitting..." : "Confirm & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
