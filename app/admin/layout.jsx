"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useTranslation from "../hooks/useTranslation";

const NAV_CARDS = [
  { href: "/admin", labelKey: "nav.overview", icon: "📊", color: "bg-blue-500" },
  { href: "/admin?tab=operations", labelKey: "nav.operations", icon: "⚙️", color: "bg-purple-500" },
  { href: "/admin?tab=drivers", labelKey: "nav.drivers", icon: "👤", color: "bg-green-500" },
  { href: "/admin?tab=fleet", labelKey: "nav.fleet", icon: "🚗", color: "bg-yellow-500" },
  { href: "/admin?tab=owners", labelKey: "nav.owners", icon: "👥", color: "bg-indigo-500" },
  { href: "/admin?tab=trips", labelKey: "nav.trips", icon: "📍", color: "bg-red-500" },
  { href: "/admin?tab=profit", labelKey: "nav.profit", icon: "💰", color: "bg-emerald-500" },
  { href: "/admin?tab=guest-trips", labelKey: "nav.guestTrips", icon: "🎫", color: "bg-pink-500" },
  { href: "/admin?tab=promo", labelKey: "nav.promo", icon: "📢", color: "bg-cyan-500" },
  { href: "/admin/onboarding", labelKey: "nav.addRecords", icon: "➕", color: "bg-slate-500" },
  { href: "/admin/live-map", labelKey: "nav.liveMap", icon: "🗺️", color: "bg-teal-500" },
];

export default function AdminLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      }
    >
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </Suspense>
  );
}

function AdminLayoutWrapper({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-sm text-slate-500">Loading...</p></div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

function AdminLayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const currentTab = searchParams.get("tab") ?? "overview";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      logout();
      router.replace("/login");
    }
  }, [loading, user, logout, router]);

  const handleSignOut = () => {
    logout();
    router.replace("/login");
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Checking admin session…</p>
      </div>
    );
  }

  const isActive = (href, labelKey) => {
    if (href === "/admin") {
      return pathname === "/admin" && currentTab === "overview";
    }
    if (href.includes("?tab=")) {
      return pathname === "/admin" && currentTab === href.split("tab=")[1];
    }
    return pathname === href;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t("dashboard.title")}</h1>
            <p className="text-xs text-slate-500">
              {t("common.signedInAs")} <span className="font-semibold">{user.fullName ?? user.email ?? user.phone}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg border-slate-200 hover:bg-slate-50"
            >
              <option value="en">English</option>
              <option value="sv">Svenska</option>
            </select>
            <button
              className="px-3 py-2 text-sm font-medium border rounded-lg border-slate-200 hover:bg-slate-50"
              onClick={() => router.refresh()}
            >
              {t("common.refresh")}
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-sm font-medium border rounded-lg border-slate-200 hover:bg-slate-50"
            >
              {t("common.signOut")}
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t("nav.overview")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-lg ${
                  isActive(card.href, card.labelKey)
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-900 border border-slate-200"
                }`}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 ${card.color} opacity-10 rounded-full -mr-10 -mt-10`} />
                <div className="relative">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <p className="text-sm font-semibold">{t(card.labelKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
