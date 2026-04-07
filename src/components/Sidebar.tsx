"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Package, FileText, Settings,
  UserCog, Shield, Mail, Archive, LogOut, Building2, ChevronRight,
  Truck, Car, Thermometer, ClipboardList, ReceiptText
} from "lucide-react";
import clsx from "clsx";

const navGroups = [
  {
    label: "Transport",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Bookings", href: "/admin/bookings", icon: ClipboardList },
      { label: "Drivers", href: "/admin/drivers", icon: Truck },
      { label: "Vehicles", href: "/admin/vehicles", icon: Car },
      { label: "Storage Units", href: "/admin/storage", icon: Thermometer },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Accounts",
    items: [
      { label: "Sales", href: "/admin/sales", icon: Package },
      { label: "Invoices", href: "/admin/invoices", icon: ReceiptText },
      { label: "Archive", href: "/admin/archive", icon: Archive },
      { label: "Composer", href: "/admin/composer", icon: Mail },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Users", href: "/admin/users", icon: UserCog },
      { label: "Roles", href: "/admin/roles", icon: Shield },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">MP Booking</p>
          <p className="text-xs text-slate-400">Transport System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              // Only compute active state after mount to avoid SSR/client mismatch
              const active = mounted && (pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 opacity-70" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
