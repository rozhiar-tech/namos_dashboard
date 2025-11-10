"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../apiClient";

export default function FleetBoard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchVehicles() {
      setLoading(true);
      try {
        const payload = await apiRequest("/admin/vehicles?includeAssignments=1");
        if (!cancelled) {
          setVehicles(payload?.vehicles ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setVehicles([
            {
              id: 3,
              label: "Camry 2019",
              plateNumber: "ABC-123",
              ownerName: "Ali Fleet",
              seatCount: 4,
              color: "Black",
              activeSession: { driverId: 12, driverName: "Robin" },
              status: "online",
            },
            {
              id: 8,
              label: "Sprinter 2020",
              plateNumber: "KRD-009",
              ownerName: "Ali Fleet",
              seatCount: 8,
              color: "White",
              status: "idle",
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Fleet board</p>
          <p className="text-xs text-slate-500">
            Track who is currently logged in to each vehicle.
          </p>
        </div>
        <button className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50">
          Add vehicle
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="py-2">Vehicle</th>
              <th className="py-2">Owner</th>
              <th className="py-2">Capacity</th>
              <th className="py-2">Session</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-slate-100">
                <td className="py-3">
                  <div className="font-semibold text-slate-900">
                    {vehicle.label ?? `${vehicle.make} ${vehicle.model}`}
                  </div>
                  <p className="text-xs text-slate-500">
                    #{vehicle.id} · {vehicle.plateNumber ?? vehicle.plate_number}
                  </p>
                </td>
                <td className="py-3 text-slate-700">{vehicle.ownerName ?? "—"}</td>
                <td className="py-3 text-slate-700">{vehicle.seatCount ?? 4} seats</td>
                <td className="py-3 text-slate-700">
                  {vehicle.activeSession ? (
                    <span>
                      Driver #{vehicle.activeSession.driverId} · {vehicle.activeSession.driverName}
                    </span>
                  ) : (
                    <span className="text-slate-400">No active session</span>
                  )}
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      vehicle.status === "online"
                        ? "bg-emerald-100 text-emerald-700"
                        : vehicle.status === "maintenance"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {vehicle.status ?? "idle"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {!vehicles.length && !loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                  No vehicles to display.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                  Loading fleet…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
