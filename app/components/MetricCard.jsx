"use client";

export default function MetricCard({
  label,
  value,
  hint,
  trend,
  variant = "default",
  loading = false,
}) {
  const palette = {
    default: "from-slate-900 to-slate-700",
    accent: "from-amber-500 to-orange-400",
    success: "from-emerald-500 to-emerald-600",
    danger: "from-rose-500 to-rose-600",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="relative z-10 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {loading ? (
          <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
        ) : (
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
        )}
        <p className="text-xs text-slate-500">{hint}</p>
        {trend && (
          <span className="text-[11px] font-semibold text-slate-400">
            {trend}
          </span>
        )}
      </div>
      <div
        className={`pointer-events-none absolute inset-0 opacity-20 blur-3xl ${
          palette[variant] ?? palette.default
        }`}
      />
    </div>
  );
}
