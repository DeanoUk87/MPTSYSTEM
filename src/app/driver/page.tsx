"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ClipboardList, User, CheckCircle, Package } from "lucide-react";

export function BottomNav({ active }: { active: "home" | "jobs" | "profile" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#13131f] border-t border-white/10 flex z-50">
      <Link href="/driver" className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${active === "home" ? "text-blue-400" : "text-gray-500"}`}>
        <Home className="w-5 h-5" />
        <span>Home</span>
      </Link>
      <Link href="/driver/jobs" className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${active === "jobs" ? "text-blue-400" : "text-gray-500"}`}>
        <ClipboardList className="w-5 h-5" />
        <span>Jobs</span>
      </Link>
      <Link href="/driver/profile" className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${active === "profile" ? "text-blue-400" : "text-gray-500"}`}>
        <User className="w-5 h-5" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}

export default function DriverHomePage() {
  const [me, setMe] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then(r => r.ok ? r.json() : null),
      fetch("/api/driver/jobs").then(r => r.ok ? r.json() : []),
    ]).then(([user, jobList]) => {
      if (!user?.dcontactId) { router.push("/login"); return; }
      setMe(user);
      setJobs(Array.isArray(jobList) ? jobList : []);
      setLoading(false);
    }).catch(() => router.push("/login"));
  }, [router]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = jobs.filter((j: any) => j.podSignature).length;

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-20">
      {/* Blue hero card */}
      <div className="bg-blue-600 px-5 pt-12 pb-8 rounded-b-3xl">
        <p className="text-blue-200 text-sm mb-1">{dateStr}</p>
        <h1 className="text-2xl font-bold mb-5">Welcome {me?.name}</h1>
        <Link href="/driver/jobs"
          className="block w-full bg-white text-blue-600 font-semibold text-center py-3.5 rounded-2xl text-base">
          View today&apos;s jobs
        </Link>
      </div>

      <div className="px-4 py-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-300">Today&apos;s overview</h2>

        <div className="bg-[#1c1c2e] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assigned Jobs</p>
            <p className="text-4xl font-bold text-white">{jobs.length}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-full">
              On duty
            </span>
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <CheckCircle className="w-3.5 h-3.5" />
                {completedCount} completed
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#1c1c2e] rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-base text-white">How it works</h3>
          {[
            { n: 1, text: "Open Jobs to see all deliveries assigned to you with unit MPT number." },
            { n: 2, text: "Tap a job to view full details, record notes and upload proof of delivery photos." },
            { n: 3, text: "Mark the job as delivered by submitting POD information so the office can see real-time status updates." },
          ].map(({ n, text }) => (
            <div key={n} className="flex gap-3">
              <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white">{n}</span>
              <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="bg-[#1c1c2e] rounded-2xl p-6 text-center">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No jobs assigned for today.</p>
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
