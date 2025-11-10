"use client";

import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { apiRequest } from "../apiClient";

const FALLBACK_METRICS = {
  activeDrivers: 0,
  onlineDrivers: 0,
  vehicles: 0,
  openTrips: 0,
  scheduledTrips: 0,
  todaysRevenue: 0,
};

export default function MetricsGrid() {
  const [metrics, setMetrics] = useState(FALLBACK_METRICS);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMetrics() {
      setLoading(true);
      try {
        const payload = await apiRequest("/admin/overview");
        if (!cancelled && payload) {
          setMetrics({
            activeDrivers: payload.activeDrivers ?? 0,
            onlineDrivers: payload.onlineDrivers ?? 0,
            vehicles: payload.vehicles ?? 0,
            openTrips: payload.openTrips ?? 0,
            scheduledTrips: payload.scheduledTrips ?? 0,
            todaysRevenue: payload.todaysRevenue ?? 0,
          });
          setRefreshedAt(new Date().toLocaleTimeString());
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("overview fallback", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            Network snapshot
          </p>
          <p className="text-xs text-slate-500">
            Last refresh: {refreshedAt ?? "loading…"}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Active drivers"
          value={metrics.activeDrivers}
          hint="Drivers onboarded into the platform"
          trend="All-time registered"
          loading={loading}
        />
        <MetricCard
          label="Drivers online"
          value={metrics.onlineDrivers}
          hint="Currently sharing live location"
          trend="Includes mock sessions"
          loading={loading}
        />
        <MetricCard
          label="Fleet vehicles"
          value={metrics.vehicles}
          hint="Vehicles that passed inspection"
          loading={loading}
        />
        <MetricCard
          label="Open requests"
          value={metrics.openTrips}
          hint="Rides waiting to be accepted"
          variant="accent"
          loading={loading}
        />
        <MetricCard
          label="Scheduled trips"
          value={metrics.scheduledTrips}
          hint="Upcoming in the next 24h"
          variant="success"
          loading={loading}
        />
        <MetricCard
          label="Revenue today"
          value={`SEK ${(metrics.todaysRevenue / 100).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`}
          hint="Gross before payouts"
          variant="danger"
          loading={loading}
        />
      </div>
    </section>
  );
}
