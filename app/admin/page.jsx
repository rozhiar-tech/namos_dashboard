"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MetricsGrid from "../components/MetricsGrid";
import OperationsConsole from "../components/OperationsConsole";
import DriverOnboarding from "../components/DriverOnboarding";
import DriverRoster from "../components/DriverRoster";
import FleetBoard from "../components/FleetBoard";
import OwnerEarnings from "../components/OwnerEarnings";
import TripMonitor from "../components/TripMonitor";
import ProfitCalculation from "../components/ProfitCalculation";
import GuestTripCreation from "../components/GuestTripCreation";
import PromoManagement from "../components/PromoManagement";
import useTranslation from "../hooks/useTranslation";

function AdminContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const { t } = useTranslation();

  switch (tab) {
    case "overview":
      return <MetricsGrid />;
    case "operations":
      return (
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {t("nav.operations")}
            </p>
            <p className="text-xs text-slate-500">
              Dispatch can force sessions, broadcast to drivers and pair vehicles.
            </p>
          </div>
          <OperationsConsole />
        </div>
      );
    case "drivers":
      return (
        <div className="space-y-6">
          <DriverOnboarding />
          <DriverRoster />
        </div>
      );
    case "fleet":
      return <FleetBoard />;
    case "owners":
      return <OwnerEarnings />;
    case "trips":
      return <TripMonitor />;
    case "profit":
      return <ProfitCalculation />;
    case "guest-trips":
      return <GuestTripCreation />;
    case "promo":
      return <PromoManagement />;
    default:
      return <MetricsGrid />;
  }
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}
