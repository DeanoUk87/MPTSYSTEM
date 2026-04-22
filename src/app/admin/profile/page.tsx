"use client";
import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import { ShieldCheck, ShieldOff, KeyRound, User } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  // 2FA setup state
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [saving, setSaving] = useState(false);

  // Disable confirm
  const [disableOpen, setDisableOpen] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const fetchMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.ok) {
      const data = await res.json();
      setMe(data);
      // Fetch 2FA status from users API
      if (data?.id) {
        const uRes = await fetch(`/api/users/${data.id}/2fa-status`);
        if (uRes.ok) {
          const u = await uRes.json();
          setTwoFaEnabled(u.twoFactorEnabled);
        }
      }
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  async function openSetup() {
    setSetupOpen(true);
    setQrDataUrl(null);
    setSecret(null);
    setToken("");
    setLoadingQr(true);
    try {
      const res = await fetch(`/api/users/${me.id}/2fa-setup`);
      const data = await res.json();
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
    } catch {
      toast.error("Failed to generate QR code");
      setSetupOpen(false);
    } finally {
      setLoadingQr(false);
    }
  }

  async function confirmSetup() {
    if (!secret) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${me.id}/2fa-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Verification failed"); return; }
      toast.success("Two-factor authentication enabled!");
      setSetupOpen(false);
      setTwoFaEnabled(true);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDisable() {
    try {
      const res = await fetch(`/api/users/${me.id}/2fa-setup`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Two-factor authentication disabled.");
      setDisableOpen(false);
      setTwoFaEnabled(false);
    } catch {
      toast.error("Failed to disable 2FA");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to change password"); return; }
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="My Profile" subtitle="Manage your account security" />
      <div className="p-6 space-y-6 max-w-2xl">

        {/* Account info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{me?.name ?? "—"}</p>
              <p className="text-sm text-slate-500">{me?.email ?? ""}</p>
              {me?.roles?.[0] && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {me.roles[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-800">Two-Factor Authentication</h2>
          </div>
          {twoFaEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-800">2FA is active</p>
                  <p className="text-xs text-indigo-600 mt-0.5">Your account requires a code from your authenticator app at each login.</p>
                </div>
              </div>
              <button onClick={() => setDisableOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors">
                <ShieldOff className="w-4 h-4" /> Disable 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <ShieldOff className="w-6 h-6 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">2FA is not enabled</p>
                  <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security using an authenticator app like Google Authenticator or Authy.</p>
                </div>
              </div>
              <button onClick={openSetup}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <ShieldCheck className="w-4 h-4" /> Set Up 2FA
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {[
              { label: "Current Password", key: "currentPassword" },
              { label: "New Password", key: "newPassword" },
              { label: "Confirm New Password", key: "confirmPassword" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input type="password" value={(pwForm as any)[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <button type="submit" disabled={pwSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {pwSaving ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal open={setupOpen} onClose={() => setSetupOpen(false)} title="Set Up Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            1. Install an authenticator app — <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong>.<br />
            2. Scan the QR code below (or enter the key manually).<br />
            3. Enter the 6-digit code shown in the app to confirm.
          </p>
          {loadingQr && <div className="text-center py-8 text-slate-400 text-sm">Generating QR code...</div>}
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <img src={qrDataUrl} alt="2FA QR Code" className="w-52 h-52 border border-slate-200 rounded-xl" />
              <p className="text-xs text-slate-400">Or enter this key manually into your app:</p>
              <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg font-mono tracking-wider break-all text-center w-full">
                {secret}
              </code>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter the 6-digit code from your app</label>
            <input type="text" inputMode="numeric" maxLength={6} value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSetupOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            <button onClick={confirmSetup} disabled={saving || token.length < 6}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Verifying..." : "Enable 2FA"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Disable confirm */}
      <Modal open={disableOpen} onClose={() => setDisableOpen(false)} title="Disable Two-Factor Authentication" size="sm">
        <p className="text-sm text-slate-600 mb-6">Are you sure you want to disable 2FA? Your account will only be protected by your password.</p>
        <div className="flex gap-3">
          <button onClick={() => setDisableOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={confirmDisable} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">Disable</button>
        </div>
      </Modal>
    </div>
  );
}
