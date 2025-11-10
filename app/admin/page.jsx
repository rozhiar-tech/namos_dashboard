"use client";

import MetricsGrid from "../components/MetricsGrid";
import OperationsConsole from "../components/OperationsConsole";
import DriverOnboarding from "../components/DriverOnboarding";
import DriverRoster from "../components/DriverRoster";
import FleetBoard from "../components/FleetBoard";
import OwnerEarnings from "../components/OwnerEarnings";
import TripMonitor from "../components/TripMonitor";

export default function AdminHome() {
  return (
    <div className="space-y-12">
      <section id="overview" className="scroll-mt-24">
        <MetricsGrid />
      </section>

      <section id="operations" className="scroll-mt-24 space-y-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            Operations console
          </p>
          <p className="text-xs text-slate-500">
            Dispatch can force sessions, broadcast to drivers and pair vehicles.
          </p>
        </div>
        <OperationsConsole />
      </section>

      <section id="drivers" className="scroll-mt-24 space-y-6">
        <DriverOnboarding />
        <DriverRoster />
      </section>

      <section id="fleet" className="scroll-mt-24">
        <FleetBoard />
      </section>

      <section id="owners" className="scroll-mt-24">
        <OwnerEarnings />
      </section>

      <section id="trips" className="scroll-mt-24">
        <TripMonitor />
      </section>
    </div>
  );
}
