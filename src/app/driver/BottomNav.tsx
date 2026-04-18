"use client";
import Link from "next/link";
import { Home, ClipboardList, User } from "lucide-react";

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
