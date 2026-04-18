"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { BottomNav } from "../BottomNav";

export default function DriverProfilePage() {
  const [me, setMe] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (!user?.dcontactId) { router.push("/login"); return; }
        setMe(user);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-20">
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
      </div>

      <div className="px-4 space-y-4">
        {me && (
          <div className="bg-[#1c1c2e] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{me.name}</p>
              <p className="text-gray-500 text-sm">Driver</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-[#1c1c2e] border border-red-500/30 text-red-400 font-semibold py-4 rounded-2xl text-base">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
