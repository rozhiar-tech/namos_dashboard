"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Overview", tab: "overview" },
  { href: "/admin?tab=operations", label: "Operations", tab: "operations" },
  { href: "/admin?tab=drivers", label: "Drivers", tab: "drivers" },
  { href: "/admin?tab=fleet", label: "Fleet", tab: "fleet" },
  { href: "/admin?tab=owners", label: "Owners", tab: "owners" },
  { href: "/admin?tab=trips", label: "Trips", tab: "trips" },
  { href: "/admin/live-map", label: "Live Map", tab: null },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const currentLabel = (() => {
    if (pathname === "/admin") {
      return (
        NAV_LINKS.find((item) => item.tab === activeTab)?.label ?? "Overview"
      );
    }
    return (
      NAV_LINKS.find((item) => item.href === pathname)?.label ?? "Dashboard"
    );
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex md:w-60 bg-slate-950 text-white flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-lg font-semibold">Namo Admin</p>
          <p className="text-xs text-white/70">Control center</p>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_LINKS.map((link) => {
            const isAdminRoot = pathname === "/admin";
            const isActive = link.tab
              ? isAdminRoot && activeTab === link.tab
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs text-white/60">
          Admin session active
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-sm text-slate-500">Namo Operations Center</p>
            <p className="text-lg font-semibold">{currentLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-2 text-sm font-medium border rounded-lg border-slate-200 hover:bg-slate-50">
              Refresh data
            </button>
            <Link
              href="/admin?tab=drivers"
              className="px-3 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Create driver
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
