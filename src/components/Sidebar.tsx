"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Settings,
  UserCog, Shield, LogOut, Building2,
  Truck, Car, Thermometer, ClipboardList,
  Fuel, BookMarked, Map, ChevronLeft, ChevronRight, Archive, ShieldCheck, UserCircle
} from "lucide-react";
import clsx from "clsx";

const navGroups = [
  {
    label: "Transport",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, perm: "dashboard_view" },
      { label: "Bookings", href: "/admin/bookings", icon: ClipboardList, perm: "bookings_view" },
      { label: "Drivers", href: "/admin/drivers", icon: Truck, perm: "drivers_view" },
      { label: "Vehicles", href: "/admin/vehicles", icon: Car, perm: "vehicles_view" },
      { label: "Storage Units", href: "/admin/storage", icon: Thermometer, perm: "storage_view" },
      { label: "Customers", href: "/admin/customers", icon: Users, perm: "customers_view" },
      { label: "Addresses", href: "/admin/addresses", icon: BookMarked, perm: "addresses_view" },
      { label: "Fuel Surcharges", href: "/admin/fuel-surcharges", icon: Fuel, perm: "fuel_view" },
      { label: "Map Routing", href: "/admin/map-routing", icon: Map, perm: "map_view" },
      { label: "History Records", href: "/admin/legacy", icon: Archive, perm: "legacy_view" },
    ],
  },

  {
    label: "Admin",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings, perm: "settings_view" },
      { label: "Users", href: "/admin/users", icon: UserCog, perm: "users_view" },
      { label: "Roles", href: "/admin/roles", icon: Shield, perm: "roles_view" },
      { label: "Audit Log", href: "/admin/audit-log", icon: ShieldCheck, perm: "settings_view" },
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
  const [userPerms, setUserPerms] = useState<Set<string> | null>(null); // null = loading
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!collapsed) setTooltip(null); }, [collapsed]);

  useEffect(() => {
    fetch("/api/branding").then(r => r.json()).then(d => setBranding(d)).catch(() => {});
    // Fetch current user's permissions from JWT
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d?.roles?.includes("admin")) setUserPerms(null); // admin sees all (null = no filtering)
      else if (d?.permissions) setUserPerms(new Set(d.permissions));
      else setUserPerms(new Set());
    }).catch(() => setUserPerms(new Set()));
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
        {navGroups.map((group, gi) => {
          // Filter items by permission — if userPerms is null (still loading or admin), show all
          const visibleItems = userPerms === null
            ? group.items
            : group.items.filter(item => !item.perm || userPerms.has(item.perm));
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.label} className={gi > 0 ? "pt-2" : ""}>
            {collapsed
              ? <div className="border-t border-slate-700/40 mx-1 my-2" />
              : <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1 mt-1">{group.label}</p>
            }
            {visibleItems.map((item) => {
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
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-700/60 shrink-0">
        <Link
          href="/admin/profile"
          onMouseEnter={collapsed ? (e) => showTip(e as any, "My Profile") : undefined}
          onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
          className={clsx(
            "flex items-center rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors mb-1",
            collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
          )}
        >
          <UserCircle className="w-4 h-4 shrink-0" />
          {!collapsed && "My Profile"}
        </Link>
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



