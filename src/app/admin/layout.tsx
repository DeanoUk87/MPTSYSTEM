"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("mp_sidebar_collapsed") === "true");
  }, []);

  function handleToggle(v: boolean) {
    setCollapsed(v);
    localStorage.setItem("mp_sidebar_collapsed", String(v));
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={`flex-1 min-h-screen flex flex-col transition-[margin] duration-200 ${collapsed ? "ml-16" : "ml-64"}`}>
        {children}
      </main>
    </div>
  );
}

