"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../apiClient";

export default function TripMonitor() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const payload = await apiRequest("/admin/trips?limit=25");
      setTrips(payload?.trips ?? []);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 45_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Trip monitor</p>
          <p className="text-xs text-slate-500">
            Includes ride-now, on-behalf and scheduled flows.
          </p>
        </div>
        <button
          onClick={fetchTrips}
          className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="py-2">Trip</th>
              <th className="py-2">Mode</th>
              <th className="py-2">Status</th>
              <th className="py-2">Requested</th>
              <th className="py-2">Driver</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100">
                <td className="py-3">
                  <div className="font-semibold text-slate-900">#{trip.id}</div>
                  <p className="text-xs text-slate-500">
                    {trip.pickupLocation} → {trip.dropoffLocation}
                  </p>
                </td>
                <td className="py-3 text-xs uppercase text-slate-600">
                  {trip.rideMode ?? "ride_now"}
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      trip.status === "requested"
                        ? "bg-amber-100 text-amber-700"
                        : trip.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : trip.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {trip.status}
                  </span>
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {trip.createdAt
                    ? new Date(trip.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {trip.driverId ? `#${trip.driverId}` : "Unassigned"}
                </td>
              </tr>
            ))}
            {!trips.length && !loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                  No trips match the filter.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                  Loading trips…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
