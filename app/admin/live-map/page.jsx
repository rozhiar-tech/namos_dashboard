"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiRequest } from "../../apiClient";
import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";

const MapComponent = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
});

const rawSocketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://95.111.224.58:3001";
const SOCKET_URL =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? rawSocketUrl
        .replace(/^http:\/\//i, "https://")
        .replace(/^ws:\/\//i, "wss://")
    : rawSocketUrl;

export default function LiveMapPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [snapshotDrivers, setSnapshotDrivers] = useState([]);
  const [snapshotTrips, setSnapshotTrips] = useState([]);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      if (authLoading) return;
      if (!token || user?.role !== "admin") {
        if (!cancelled) {
          setSnapshotDrivers([]);
          setSnapshotTrips([]);
          setSnapshotLoading(false);
        }
        return;
      }

      setSnapshotLoading(true);
      setSnapshotError(null);

      try {
        const payload = await apiRequest("/admin/live-map/snapshot", { token });
        if (cancelled) return;
        setSnapshotDrivers(Array.isArray(payload?.drivers) ? payload.drivers : []);
        setSnapshotTrips(Array.isArray(payload?.trips) ? payload.trips : []);
      } catch (error) {
        if (cancelled) return;
        setSnapshotError(error?.message ?? "Failed to load live map snapshot.");
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    };

    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [authLoading, token, user?.role]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setAdminLocation({ lat, lng });
        }
      },
      () => {},
      {
        enableHighAccuracy: false,
        maximumAge: 15000,
        timeout: 10000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const socketToken = authLoading || snapshotLoading ? null : token;

  const { driverLocations, trips, events, connected, connectionError } = useSocket(
    SOCKET_URL,
    {
      token: socketToken,
      initialDrivers: snapshotDrivers,
      initialTrips: snapshotTrips,
    }
  );

  const statusText = snapshotLoading
    ? "Loading snapshot…"
    : connectionError
    ? `Socket error: ${connectionError}`
    : connected
    ? "Socket connected"
    : "Connecting socket…";

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Live driver map
              </p>
              <p className="text-xs text-slate-500">
                {driverLocations.length} drivers sharing GPS right now
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{statusText}</p>
              {snapshotError && (
                <p className="text-[11px] text-rose-600 mt-1">{snapshotError}</p>
              )}
            </div>
          </div>
          <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-100">
            <MapComponent drivers={driverLocations} adminLocation={adminLocation} />
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-slate-900 mb-3">
              Driver feed
            </p>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {driverLocations.map((driver) => (
                <div
                  key={driver.driverId}
                  className="border border-slate-100 rounded-2xl px-3 py-2 text-sm"
                >
                  <p className="font-semibold text-slate-800">
                    Driver #{driver.driverId}
                  </p>
                  <p className="text-xs text-slate-500">
                    Lat {driver.lat?.toFixed(4)} · Lng {driver.lng?.toFixed(4)}
                  </p>
                </div>
              ))}
              {!driverLocations.length && (
                <p className="text-xs text-slate-500">No drivers online.</p>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-base font-semibold text-slate-900 mb-2">
              Pending trips
            </p>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="border border-slate-100 rounded-2xl px-3 py-2 text-sm"
                >
                  <p className="font-semibold text-slate-800">
                    #{trip.id} · {trip.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {trip.pickupLocation} → {trip.dropoffLocation}
                  </p>
                  <p className="text-[11px] text-slate-400 uppercase mt-1">
                    {trip.rideMode ?? "ride_now"}
                  </p>
                </div>
              ))}
              {!trips.length && (
                <p className="text-xs text-slate-500">No queued trips.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-base font-semibold text-slate-900 mb-3">
          Live events
        </p>
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 px-3 py-2"
            >
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                {event.type}
              </span>
              <div className="flex-1 text-sm text-slate-700">
                <p>{renderEventText(event)}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(event.ts).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {!events.length && (
            <p className="text-xs text-slate-500">Waiting for socket events…</p>
          )}
        </div>
      </section>
    </div>
  );
}

function renderEventText(event) {
  const payload = event.payload ?? {};
  switch (event.type) {
    case "location":
      return `Driver #${payload.driverId} updated location.`;
    case "trip":
      return `Trip #${payload.id ?? payload.tripId} ${payload.status ?? "requested"}.`;
    case "driver_status":
      return `Driver #${payload.driverId} status ${payload.status}.`;
    case "session":
      return `Session ${payload.action ?? "event"} vehicle #${payload.vehicleId} driver #${payload.driverId}.`;
    default:
      return payload.message ?? "Event";
  }
}
