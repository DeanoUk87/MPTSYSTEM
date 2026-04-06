import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "amber" | "rose" | "purple";
  trend?: string;
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-600", text: "text-blue-600" },
  green: { bg: "bg-emerald-50", icon: "bg-emerald-600", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-600", text: "text-amber-600" },
  rose: { bg: "bg-rose-50", icon: "bg-rose-600", text: "text-rose-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-600" },
};

export default function StatCard({ title, value, icon: Icon, color = "blue", trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={clsx("rounded-xl p-5 flex items-center gap-4 border border-slate-200 bg-white")}>
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", c.bg)}>
        <Icon className={clsx("w-6 h-6", c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
