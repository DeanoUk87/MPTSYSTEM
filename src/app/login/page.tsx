"use client";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCaptchaText(len = 5) {
  return Array.from({ length: len }, () =>
    CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  ).join("");
}

function CaptchaCanvas({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, W, H);

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `hsl(${Math.random() * 360},40%,60%)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 1, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${Math.random() * 360},40%,55%)`;
      ctx.fill();
    }

    // Characters
    const charW = W / text.length;
    text.split("").forEach((ch, i) => {
      ctx.save();
      const cx = charW * i + charW / 2;
      const cy = H / 2 + (Math.random() * 8 - 4);
      ctx.translate(cx, cy);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.font = `bold ${22 + Math.random() * 6}px monospace`;
      ctx.fillStyle = `hsl(${Math.random() * 60 + 200},60%,30%)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={48}
      className="rounded-xl border border-slate-200 select-none"
      style={{ userSelect: "none", pointerEvents: "none" }}
    />
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<{ logo: string | null; companyName: string } | null>(null);
  const [captchaText, setCaptchaText] = useState(() => generateCaptchaText());
  const [captchaInput, setCaptchaInput] = useState("");
  // 2FA state
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState("");
  const [otpInput, setOtpInput] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptchaText(generateCaptchaText());
    setCaptchaInput("");
  }, []);

  useEffect(() => {
    fetch("/api/branding").then(r => r.json()).then(d => setBranding(d)).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (captchaInput.trim().toUpperCase() !== captchaText) {
      toast.error("Incorrect security code, please try again");
      refreshCaptcha();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid email/username or password");
      } else if (data.twoFactor) {
        // 2FA required — show authenticator code input
        setTwoFactorPending(true);
        setTwoFactorUserId(data.userId);
      } else {
        router.push(data.redirectTo || callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: twoFactorUserId, token: otpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid code");
        if (data.error?.includes("expired") || data.error?.includes("attempts")) {
          setTwoFactorPending(false);
          setTwoFactorUserId("");
          setOtpInput("");
          refreshCaptcha();
        }
      } else {
        router.push(data.redirectTo || callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
            {branding?.logo ? (
              <div className="flex justify-center mb-4">
                <img src={branding.logo} alt={branding.companyName} className="h-16 max-w-[200px] object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            {!branding?.logo && <h1 className="text-2xl font-bold text-white">{branding?.companyName || "MP Booking System"}</h1>}
            <p className="text-blue-200 text-sm mt-1">Sameday Transport Management</p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              {twoFactorPending ? "Two-Factor Verification" : "Sign in to your account"}
            </h2>

            {twoFactorPending ? (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
              <p className="text-sm text-slate-500">Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code for this account.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Authenticator Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    placeholder="000000"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying..." : "Verify"}
                </button>
                <button type="button" onClick={() => { setTwoFactorPending(false); setTwoFactorUserId(""); setOtpInput(""); refreshCaptcha(); }}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 py-1">
                  ← Back to login
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="admin@mpbooking.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Security Code
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <CaptchaCanvas text={captchaText} />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    title="Refresh code"
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Type the characters above"
                  required
                  autoComplete="off"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          {branding?.companyName || "MP Transport Ltd"} &copy; {new Date().getFullYear()}
        </p>
      </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
