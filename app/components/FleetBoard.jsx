"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../apiClient";
import VehicleForm from "./VehicleForm";

export default function FleetBoard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [managedVehicleId, setManagedVehicleId] = useState(null);
  const [assignableDrivers, setAssignableDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigningDriverId, setUnassigningDriverId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest("/vehicles/mine");
      setVehicles(payload?.vehicles ?? []);
    } catch (err) {
      console.error("Unable to load vehicles", err);
      setError(err?.message ?? "Unable to load vehicles.");
      setVehicles([]);
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

  const fetchAssignableDrivers = useCallback(async () => {
    setDriversLoading(true);
    setDriversError(null);
    try {
      const [driversPayload, ownerDriversPayload] = await Promise.all([
        apiRequest("/admin/users?role=driver&page=1&limit=200"),
        apiRequest("/admin/users?role=owner_driver&page=1&limit=200"),
      ]);
      const merged = [
        ...(Array.isArray(driversPayload?.users) ? driversPayload.users : []),
        ...(Array.isArray(ownerDriversPayload?.users)
          ? ownerDriversPayload.users
          : []),
      ];
      const byId = new Map();
      for (const user of merged) {
        if (user?.id != null) {
          byId.set(user.id, user);
        }
      }
      setAssignableDrivers(Array.from(byId.values()));
    } catch (loadError) {
      console.error("Unable to load drivers for assignment", loadError);
      setAssignableDrivers([]);
      setDriversError(loadError?.message ?? "Unable to load drivers.");
    } finally {
      setDriversLoading(false);
    }
  }, []);

  const handleManageToggle = async (vehicleId) => {
    if (!vehicleId) return;
    setActionMessage(null);
    setSelectedDriverId("");

    if (managedVehicleId === vehicleId) {
      setManagedVehicleId(null);
      return;
    }

    setManagedVehicleId(vehicleId);
    if (!assignableDrivers.length && !driversLoading) {
      await fetchAssignableDrivers();
    }
  };

  const handleAssignDriver = async (vehicleId) => {
    if (!selectedDriverId) {
      setActionMessage({ type: "error", text: "Select a driver first." });
      return;
    }

    setAssigning(true);
    setActionMessage(null);
    try {
      await apiRequest(`/vehicles/${vehicleId}/assign`, {
        method: "POST",
        body: JSON.stringify({ driverId: Number(selectedDriverId) }),
      });
      setActionMessage({ type: "success", text: "Driver assigned." });
      setSelectedDriverId("");
      await fetchVehicles();
    } catch (assignError) {
      setActionMessage({
        type: "error",
        text: assignError?.message ?? "Unable to assign driver.",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignDriver = async (vehicleId, driverId) => {
    if (!driverId) return;
    setUnassigningDriverId(Number(driverId));
    setActionMessage(null);
    try {
      const params = new URLSearchParams({ driverId: String(driverId) });
      await apiRequest(`/vehicles/${vehicleId}/assign?${params.toString()}`, {
        method: "DELETE",
      });
      setActionMessage({ type: "success", text: "Driver unassigned." });
      await fetchVehicles();
    } catch (unassignError) {
      setActionMessage({
        type: "error",
        text: unassignError?.message ?? "Unable to unassign driver.",
      });
    } finally {
      setUnassigningDriverId(null);
    }
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
              const activeAssignments = Array.isArray(vehicle.assignments)
                ? vehicle.assignments
                : [];
              const assignedDriverIds = new Set(
                activeAssignments
                  .map((assignment) => assignment?.driver?.id)
                  .filter(Boolean)
              );
              const availableDrivers = assignableDrivers.filter(
                (driver) => !assignedDriverIds.has(driver.id)
              );
              const isManageOpen = managedVehicleId === vehicle.id;

              return (
                <Fragment key={vehicle.id ?? `${vehicle.label}-${vehicle.plateNumber}`}>
                  <tr className="border-t border-slate-100">
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">
                        {vehicle.label ??
                          `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim()}
                      </div>
                      <p className="text-xs text-slate-500">
                        #{vehicle.id ?? "—"} ·{" "}
                        {vehicle.plateNumber ?? vehicle.plate_number ?? "n/a"}
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
                      <button
                        onClick={() => handleManageToggle(vehicle.id)}
                        disabled={!vehicle.id}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        {isManageOpen ? "Close" : "Manage"}
                      </button>
                    </td>
                  </tr>

                  {isManageOpen && (
                    <tr className="border-t border-slate-100 bg-slate-50/70">
                      <td colSpan={6} className="py-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                              Manage assignments for vehicle #{vehicle.id}
                            </p>
                            <button
                              type="button"
                              onClick={fetchAssignableDrivers}
                              className="w-fit rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50"
                            >
                              Refresh drivers
                            </button>
                          </div>

                          {actionMessage && (
                            <p
                              className={`text-xs font-semibold ${
                                actionMessage.type === "error"
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {actionMessage.text}
                            </p>
                          )}

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Active assignment(s)
                            </p>
                            {activeAssignments.length ? (
                              <div className="space-y-2">
                                {activeAssignments.map((assignment) => {
                                  const assignedDriver = assignment?.driver ?? null;
                                  const assignedDriverId = assignedDriver?.id;
                                  return (
                                    <div
                                      key={assignment.id ?? `${vehicle.id}-${assignedDriverId}`}
                                      className="flex flex-col gap-2 rounded-xl border border-slate-100 px-3 py-2 md:flex-row md:items-center md:justify-between"
                                    >
                                      <p className="text-sm text-slate-700">
                                        #{assignedDriverId ?? "—"} ·{" "}
                                        {assignedDriver?.fullName ??
                                          assignedDriver?.phone ??
                                          "Unknown driver"}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUnassignDriver(
                                            vehicle.id,
                                            assignedDriverId
                                          )
                                        }
                                        disabled={
                                          !assignedDriverId ||
                                          unassigningDriverId === Number(assignedDriverId)
                                        }
                                        className="w-fit rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                      >
                                        {unassigningDriverId === Number(assignedDriverId)
                                          ? "Unassigning…"
                                          : "Unassign"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">
                                No active assignments for this vehicle.
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Assign driver
                            </p>
                            {driversLoading ? (
                              <p className="text-xs text-slate-500">
                                Loading drivers…
                              </p>
                            ) : driversError ? (
                              <p className="text-xs text-rose-600">{driversError}</p>
                            ) : (
                              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <select
                                  value={selectedDriverId}
                                  onChange={(event) =>
                                    setSelectedDriverId(event.target.value)
                                  }
                                  className="min-w-[280px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
                                >
                                  <option value="">Select driver</option>
                                  {availableDrivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                      #{driver.id} ·{" "}
                                      {driver.fullName ?? driver.phone ?? "Driver"} (
                                      {driver.role})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleAssignDriver(vehicle.id)}
                                  disabled={
                                    assigning ||
                                    !selectedDriverId ||
                                    !availableDrivers.length
                                  }
                                  className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  {assigning ? "Assigning…" : "Assign driver"}
                                </button>
                              </div>
                            )}
                            {!driversLoading && !driversError && !availableDrivers.length && (
                              <p className="text-xs text-slate-500">
                                No available drivers to assign.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
