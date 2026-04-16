"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Settings,
  UserCog, Shield, LogOut, Building2,
  Truck, Car, Thermometer, ClipboardList,
  Fuel, BookMarked, Map, ChevronLeft, ChevronRight
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
      { label: "Addresses", href: "/admin/addresses", icon: BookMarked },
      { label: "Fuel Surcharges", href: "/admin/fuel-surcharges", icon: Fuel },
      { label: "Map Routing", href: "/admin/map-routing", icon: Map },
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: (v: boolean) => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);
  const [branding, setBranding] = useState<{ logo: string | null; menuLogo: string | null; companyName: string } | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!collapsed) setTooltip(null); }, [collapsed]);

  useEffect(() => {
    fetch("/api/branding").then(r => r.json()).then(d => setBranding(d)).catch(() => {});
  }, []);

  const showTip = (e: React.MouseEvent, label: string) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ label, y: r.top + r.height / 2 });
  };

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <aside className={clsx(
      "fixed top-0 left-0 h-screen bg-slate-900 text-white flex flex-col z-40 transition-[width] duration-200",
      collapsed ? "w-16" : "w-64 overflow-hidden"
    )}>
      {/* Logo + Toggle */}
      <div className={clsx(
        "flex items-center border-b border-slate-700/60 shrink-0",
        collapsed ? "px-3 py-4 justify-between" : "px-4 py-4 gap-3"
      )}>
        {/* Icon / square logo */}
        <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden", !branding?.menuLogo && "bg-blue-600")}>
          {branding?.menuLogo
            ? <img src={branding.menuLogo} alt="logo" className="w-full h-full object-contain" />
            : <Building2 className="w-5 h-5 text-white" />
          }
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            {branding?.logo
              ? <img src={branding.logo} alt={branding.companyName} className="h-8 max-w-[140px] object-contain" />
              : <>
                  <p className="font-bold text-sm leading-tight truncate">{branding?.companyName || "MP Booking"}</p>
                  <p className="text-xs text-slate-400">Transport System</p>
                </>
            }
          </div>
        )}
        <button
          onClick={() => onToggle(!collapsed)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className={clsx("flex-1 py-3 overflow-y-auto px-2 space-y-0.5", !collapsed && "overflow-x-hidden")}>
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "pt-2" : ""}>
            {collapsed
              ? <div className="border-t border-slate-700/40 mx-1 my-2" />
              : <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 mt-1">{group.label}</p>
            }
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = mounted && (pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onMouseEnter={collapsed ? (e) => showTip(e, item.label) : undefined}
                  onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
                  className={clsx(
                    "flex items-center rounded-lg text-sm font-medium transition-colors mb-0.5",
                    collapsed ? "justify-center p-3" : "gap-3 px-3 py-2",
                    active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && active && <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-700/60 shrink-0">
        <button
          onClick={handleSignOut}
          onMouseEnter={collapsed ? (e) => showTip(e as any, "Sign Out") : undefined}
          onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
          className={clsx(
            "flex items-center rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors",
            collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
    {collapsed && tooltip && (
      <div
        style={{ position: "fixed", top: tooltip.y, left: 68, transform: "translateY(-50%)", zIndex: 9999 }}
        className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white shadow-xl"
      >
        {tooltip.label}
      </div>
    )}
    </>
  );
}



