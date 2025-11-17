"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../apiClient";
import VehicleForm from "./VehicleForm";

export default function FleetBoard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest("/vehicles/mine");
      setVehicles(payload?.vehicles ?? []);
    } catch (err) {
      console.warn("Unable to load vehicles", err);
      setError(err?.message ?? "Unable to load vehicles.");
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleVehicleCreated = () => {
    setShowForm(false);
    fetchVehicles();
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Fleet board</p>
          <p className="text-xs text-slate-500">
            Track who is currently logged in to each vehicle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
          )}
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50"
          >
            {showForm ? "Close form" : "Add vehicle"}
          </button>
        </div>
      </div>
      {showForm && (
        <div className="mb-6">
          <VehicleForm
            onCreated={handleVehicleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
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
            {vehicles.map((vehicle) => {
              const session = vehicle.activeSession ?? null;
              const driverId =
                session?.driverId ?? session?.driver?.id ?? session?.driver_id;
              const driverName =
                session?.driverName ??
                session?.driver?.fullName ??
                session?.driver?.phone ??
                session?.driver_name;
              const status =
                vehicle.status ?? (session ? "online" : "idle");
              const ownerLabel =
                vehicle.ownerName ??
                vehicle.owner?.fullName ??
                vehicle.owner?.name ??
                "—";
              return (
                <tr key={vehicle.id ?? `${vehicle.label}-${vehicle.plateNumber}`} className="border-t border-slate-100">
                  <td className="py-3">
                    <div className="font-semibold text-slate-900">
                      {vehicle.label ?? `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim()}
                    </div>
                    <p className="text-xs text-slate-500">
                      #{vehicle.id ?? "—"} · {vehicle.plateNumber ?? vehicle.plate_number ?? "n/a"}
                    </p>
                  </td>
                  <td className="py-3 text-slate-700">{ownerLabel}</td>
                  <td className="py-3 text-slate-700">
                    {vehicle.seatCount ?? vehicle.seat_count ?? 4} seats
                  </td>
                  <td className="py-3 text-slate-700">
                    {session ? (
                      <span>
                        Driver #{driverId ?? "—"} · {driverName ?? "Active"}
                      </span>
                    ) : (
                      <span className="text-slate-400">No active session</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        status === "online"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "maintenance"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50">
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
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
