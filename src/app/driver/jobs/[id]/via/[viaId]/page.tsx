"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Camera, X, CheckCircle, AlertTriangle } from "lucide-react";

import { queueSubmission, filesToPhotoEntries, registerBackgroundSync } from "@/lib/offline-queue";

interface ViaAddress {
  id: string;
  name?: string;
  postcode?: string;
  contact?: string;
  phone?: string;
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
  chillUnit?: { unitType?: string; temperature?: string | null } | null,
  ambientUnit?: { unitType?: string; temperature?: string | null } | null,
): string {
  if (orders.length === 0) return "";
  const allTypes = orders.flatMap(o => o.types).map(t => t.toLowerCase());
  const needsChill = allTypes.some(t => t === "chill");
  const needsAmb   = allTypes.some(t => t === "amb");
  const hasPump    = allTypes.some(t => t === "pump");
  const hasStores  = allTypes.some(t => t === "stores");
  // Pump/stores only — no temperature reading needed
  if (!needsChill && !needsAmb) {
    if (hasPump && hasStores) return "Pump & Stores";
    if (hasPump)   return "Pump";
    if (hasStores) return "Stores";
    return "";
  }
  // Match by unitType value, not field name, in case units are stored in the wrong field
  const units = [chillUnit, ambientUnit].filter(Boolean);
  const actualChill = units.find(u => (u?.unitType || "").toLowerCase().startsWith("chill"));
  const actualAmb   = units.find(u => !(u?.unitType || "").toLowerCase().startsWith("chill"));
  const parts: string[] = [];
  if (needsChill && actualChill?.temperature != null) parts.push(`Chill: ${actualChill.temperature}\u00b0C`);
  if (needsAmb   && actualAmb?.temperature  != null) parts.push(`Amb: ${actualAmb.temperature}\u00b0C`);
  return parts.join(" / ");
}

function orderTypeLabel(types: string[]): string {
  if (types.length === 0) return "";
  const allTypes = types.map(t => t.toLowerCase());
  const hasChill = allTypes.includes("chill");
  const hasAmb   = allTypes.includes("amb");
  const hasPump  = allTypes.includes("pump");
  const hasStores = allTypes.includes("stores");
  if (hasChill && hasAmb)   return "Chill & Ambient";
  if (hasChill)             return "Chill";
  if (hasAmb)               return "Ambient";
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

  const [recipientAnswer, setRecipientAnswer] = useState<"yes" | "no" | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [time, setTime] = useState(now);
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  const [offlineQueued, setOfflineQueued] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingAutoTemp, setPendingAutoTemp] = useState("");

  // Multiple photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const cameraRef = useRef<HTMLInputElement>(null);
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

  function handleCameraCapture(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...newFiles]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    // Reset input so the same photo can be added again if needed
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!params?.id || !params?.viaId || !signedBy.trim()) {
      setError("Signed by name is required.");
      return;
    }
    if (recipientAnswer === null) {
      setError("Please confirm if this delivery is to the recipient.");
      return;
    }
    if (photos.length === 0) {
      setError("A photo of the paperwork is required before completing this delivery.");
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
      if (via?.postcode) fd.append("postcode", via.postcode);
      for (const photo of photos) {
        fd.append("photo", photo);
      }

      const res = await fetch(`/api/driver/jobs/${params.id}/via/${params.viaId}`, { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit via delivery");
      }
      setShowModal(false);
      setDone(true);
    } catch (e: any) {
      // If offline, save to queue and show success to driver
      if (!navigator.onLine || e?.message === "Failed to fetch" || e instanceof TypeError) {
        try {
          const fields: Record<string, string> = {
            signedBy: signedBy.trim(),
            time,
            relationship,
            temperature: pendingAutoTemp,
            notes,
            ...(via?.postcode ? { postcode: via.postcode } : {}),
          };
          const photoEntries = photos.length > 0 ? await filesToPhotoEntries(photos) : undefined;
          await queueSubmission({
            id: `via-${params.viaId}-${Date.now()}`,
            url: `/api/driver/jobs/${params.id}/via/${params.viaId}`,
            jobId: params.id,
            type: "via",
            fields,
            photos: photoEntries,
            queuedAt: Date.now(),
          });
          await registerBackgroundSync();
          setShowModal(false);
          setOfflineQueued(true);
          setDone(true);
        } catch {
          setError("No signal. Could not save offline — please try again.");
          setShowModal(false);
        }
      } else {
        setError(e.message);
        setShowModal(false);
      }
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
        {offlineQueued ? (
          <div className="bg-amber-900/40 border border-amber-500/50 rounded-2xl p-6 text-center w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-amber-900/60 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <p className="font-bold text-white text-xl mb-1">Saved Offline</p>
            <p className="text-gray-400 text-sm">No signal detected. Your delivery confirmation has been saved and will be sent automatically when you have signal.</p>
          </div>
        ) : (
          <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-2xl p-6 text-center w-full max-w-sm">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-white text-xl mb-1">Via Delivery Complete</p>
            <p className="text-gray-400 text-sm">Delivery at {via.name || via.postcode} has been recorded.</p>
          </div>
        )}
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
          {via.contact && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Contact</span>
              <span className="text-white font-medium text-right">{via.contact}</span>
            </div>
          )}
          {via.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Telephone</span>
              <a href={`tel:${via.phone}`} className="text-blue-400 font-medium">{via.phone}</a>
            </div>
          )}
        </div>

        {/* Via notes */}
        {via.notes?.split("---ORDERS---")[0].trim() && (
          <div className="bg-[#1c1c2e] rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Via Notes</p>
            <p className="text-sm text-gray-300 leading-relaxed">{via.notes.split("---ORDERS---")[0].trim()}</p>
          </div>
        )}

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

        {/* POD photo — required */}
        <div className={`rounded-2xl p-4 space-y-3 ${photos.length === 0 ? "bg-[#1c1c2e] border border-red-500/40" : "bg-[#1c1c2e]"}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Paperwork Photo <span className="text-red-400">*</span></h2>
            {photos.length === 0 && (
              <span className="text-xs text-red-400 font-medium">Required</span>
            )}
            {photos.length > 0 && (
              <span className="text-xs text-emerald-400 font-medium">{photos.length} photo{photos.length > 1 ? "s" : ""} added</span>
            )}
          </div>
          {photos.length === 0 && (
            <p className="text-xs text-red-300/80">You must take a photo of the delivery paperwork before completing.</p>
          )}

          {/* Photo thumbnails grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`POD photo ${i + 1}`} className="w-full h-full rounded-xl object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Take photo button — always visible so driver can keep adding photos */}
          <button
            onClick={() => cameraRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium ${
              photos.length === 0 ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}>
            <Camera className="w-4 h-4" />
            {photoPreviews.length === 0 ? "Take Photo of Paperwork" : "Take Another Photo"}
          </button>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleCameraCapture(e.target.files)}
          />
        </div>

        {/* Proof Of Delivery */}
        <div className="bg-[#1c1c2e] rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-white">Proof Of Delivery</h2>
          <p className="text-sm text-gray-400">Confirm this delivery is to the Recipient</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setRecipientAnswer("yes"); if (!signedBy.trim()) setSignedBy(via?.name || ""); }}
              className={`flex-1 py-3 rounded-xl font-semibold text-base transition-colors ${recipientAnswer === "yes" ? "bg-emerald-600 text-white" : "bg-[#0a0a14] border border-white/10 text-gray-300"}`}>
              Yes
            </button>
            <button
              onClick={() => setRecipientAnswer("no")}
              className={`flex-1 py-3 rounded-xl font-semibold text-base transition-colors ${recipientAnswer === "no" ? "bg-red-600 text-white" : "bg-[#0a0a14] border border-white/10 text-gray-300"}`}>
              No
            </button>
          </div>
          {recipientAnswer !== null && (
            <div className="space-y-4 pt-2">
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
              {recipientAnswer === "no" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Relationship to recipient</label>
                  <input type="text" value={relationship} onChange={e => setRelationship(e.target.value)}
                    placeholder="e.g. Manager, Staff member"
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600" />
                </div>
              )}
            </div>
          )}
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

            {/* POD Summary */}
            <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">POD Details</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Recipient</span>
                <span className="text-white font-medium">{signedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time</span>
                <span className="text-white font-medium">{time}</span>
              </div>
              {photos.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Photos</span>
                  <span className="text-white font-medium">{photos.length} attached</span>
                </div>
              )}
              {recipientAnswer === "no" && relationship && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Relationship</span>
                  <span className="text-white font-medium">{relationship}</span>
                </div>
              )}
            </div>

            {pendingAutoTemp && (
              ["pump", "stores", "pump & stores"].includes(pendingAutoTemp.toLowerCase()) ? (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-1">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Delivery Type</p>
                  <p className="text-white font-bold text-lg">{pendingAutoTemp}</p>
                </div>
              ) : (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 space-y-1">
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Auto Temperature Reading</p>
                  <p className="text-white font-bold text-lg">{pendingAutoTemp}</p>
                  <p className="text-xs text-gray-500">Automatically recorded from your unit sensor — no manual entry needed.</p>
                </div>
              )
            )}

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
