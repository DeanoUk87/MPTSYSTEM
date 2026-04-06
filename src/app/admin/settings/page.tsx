"use client";
import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Settings {
  companyName: string; logo?: string; companyAddress1?: string; companyAddress2?: string;
  state?: string; city?: string; postcode?: string; country?: string;
  phone?: string; fax?: string; cemail?: string; website?: string;
  primaryContact?: string; baseCurrency: string; vatNumber?: string;
  invoiceDueDate: number; invoiceDuePaymentBy?: string;
  messageTitle?: string; defaultMessage?: string; defaultMessage2?: string; sendLimit: number;
}

const fields: { key: keyof Settings; label: string; type?: string; rows?: number }[] = [
  { key: "companyName", label: "Company Name" },
  { key: "companyAddress1", label: "Address Line 1" },
  { key: "companyAddress2", label: "Address Line 2" },
  { key: "city", label: "City" },
  { key: "state", label: "State/County" },
  { key: "postcode", label: "Postcode" },
  { key: "country", label: "Country" },
  { key: "phone", label: "Phone" },
  { key: "fax", label: "Fax" },
  { key: "cemail", label: "Company Email (From Address)" },
  { key: "website", label: "Website" },
  { key: "primaryContact", label: "Primary Contact" },
  { key: "baseCurrency", label: "Base Currency" },
  { key: "vatNumber", label: "VAT Number" },
  { key: "invoiceDueDate", label: "Invoice Due Days", type: "number" },
  { key: "invoiceDuePaymentBy", label: "Payment Method" },
  { key: "sendLimit", label: "Email Send Limit (per batch)", type: "number" },
  { key: "messageTitle", label: "Invoice Email Subject" },
  { key: "defaultMessage", label: "Default Email Body 1", rows: 4 },
  { key: "defaultMessage2", label: "Default Email Body 2 (supports {invoice_number})", rows: 4 },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "", baseCurrency: "GBP", invoiceDueDate: 30, sendLimit: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d) setSettings(d);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading settings...
      </div>
    </div>
  );

  return (
    <div className="flex-1">
      <Topbar title="Settings" subtitle="Configure company details and system preferences" />
      <div className="p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">Company Details</h2>
            {fields.slice(0, 16).map(({ key, label, type, rows }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                {rows ? (
                  <textarea
                    value={String(settings[key] ?? "")}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    rows={rows}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type={type || "text"}
                    value={String(settings[key] ?? "")}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">Email Templates</h2>
            {fields.slice(16).map(({ key, label, type, rows }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                {rows ? (
                  <textarea
                    value={String(settings[key] ?? "")}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    rows={rows}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type={type || "text"}
                    value={String(settings[key] ?? "")}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
