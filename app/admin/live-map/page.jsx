"use client";

import dynamic from "next/dynamic";
import useSocket from "../../hooks/useSocket";

const MapComponent = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://95.111.224.58:3001";

export default function LiveMapPage() {
  const { driverLocations, trips, events } = useSocket(SOCKET_URL);

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
            </div>
          </div>
          <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-100">
            <MapComponent drivers={driverLocations} />
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
      return `Trip #${payload.id} ${payload.status ?? "requested"}.`;
    case "driver_status":
      return `Driver #${payload.driverId} status ${payload.status}.`;
    case "session":
      return `Session event vehicle #${payload.vehicleId} driver #${payload.driverId}.`;
    default:
      return payload.message ?? "Event";
  }
}
