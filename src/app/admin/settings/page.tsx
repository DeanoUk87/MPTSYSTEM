"use client";
import { useState, useEffect, useRef } from "react";
import Topbar from "@/components/Topbar";
import { Save, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface Settings {
  companyName: string; logo?: string; menuLogo?: string;
  companyAddress1?: string; companyAddress2?: string;
  state?: string; city?: string; postcode?: string; country?: string;
  phone?: string; fax?: string; cemail?: string; website?: string;
  primaryContact?: string; baseCurrency: string; vatNumber?: string;
  invoiceDueDate: number; invoiceDuePaymentBy?: string;
  messageTitle?: string; defaultMessage?: string; defaultMessage2?: string; sendLimit: number;
  bookingRefreshInterval: number;
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
  { key: "bookingRefreshInterval", label: "Booking Dashboard Auto-Refresh (seconds, 0 to disable)", type: "number" },
  { key: "messageTitle", label: "Invoice Email Subject" },
  { key: "defaultMessage", label: "Default Email Body 1", rows: 4 },
  { key: "defaultMessage2", label: "Default Email Body 2 (supports {invoice_number})", rows: 4 },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "", baseCurrency: "GBP", invoiceDueDate: 30, sendLimit: 50, bookingRefreshInterval: 80,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const menuLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/branding").then(r => r.json()),
    ])
      .then(([s, b]) => {
        if (s && !s.error) {
          setSettings(prev => ({
            ...prev,
            ...s,
            logo: b?.logo ?? undefined,
            menuLogo: b?.menuLogo ?? undefined,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function handleLogoChange(field: "logo" | "menuLogo", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast.error("Logo must be under 500 KB"); return; }
    const b64 = await readFileAsBase64(file);
    setSettings(s => ({ ...s, [field]: b64 }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { logo, menuLogo, ...textSettings } = settings;
      const [res, brandRes] = await Promise.all([
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(textSettings),
        }),
        fetch("/api/branding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: logo ?? null, menuLogo: menuLogo ?? null }),
        }),
      ]);
      const data = await res.json();
      const brandData = await brandRes.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      if (!brandRes.ok) throw new Error(brandData?.error || "Logo save failed");
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

          {/* Branding */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">Branding &amp; Logo</h2>
            <p className="text-xs text-slate-500">Upload your company logo (PNG/JPG, max 500 KB). The main logo appears on the login page, PDF job sheets, and driver statements. The nav icon appears in the sidebar.</p>

            {/* Main logo */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Main Logo <span className="text-slate-400">(login page, PDF)</span></p>
              <div className="flex items-center gap-4">
                {settings.logo ? (
                  <div className="relative">
                    <img src={settings.logo} alt="Logo" className="h-12 max-w-[180px] object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    <button type="button" onClick={() => setSettings(s => ({ ...s, logo: undefined }))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-12 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoChange("logo", e)} />
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5" /> {settings.logo ? "Replace" : "Upload"}
                  </button>
                </div>
              </div>
            </div>

            {/* Nav / menu icon */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Navigation Icon <span className="text-slate-400">(sidebar, square format recommended)</span></p>
              <div className="flex items-center gap-4">
                {settings.menuLogo ? (
                  <div className="relative">
                    <img src={settings.menuLogo} alt="Nav icon" className="w-10 h-10 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    <button type="button" onClick={() => setSettings(s => ({ ...s, menuLogo: undefined }))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-10 h-10 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                    <Upload className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <input ref={menuLogoRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoChange("menuLogo", e)} />
                  <button type="button" onClick={() => menuLogoRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5" /> {settings.menuLogo ? "Replace" : "Upload"}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
