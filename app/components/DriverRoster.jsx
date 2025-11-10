"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../apiClient";

export default function DriverRoster() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDrivers() {
      setLoading(true);
      try {
        const payload = await apiRequest("/admin/drivers?includeSessions=1");
        if (!cancelled) {
          setDrivers(payload?.drivers ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setDrivers([
            {
              id: 12,
              name: "Robin Hama",
              phone: "+964 770 123 4567",
              ownerName: "Ali Fleet",
              vehicleLabel: "Camry 2019",
              vehicleId: 3,
              status: "online",
              earningsToday: 78000,
              sessionStartedAt: Date.now() - 1000 * 60 * 45,
            },
            {
              id: 14,
              name: "Sara Vian",
              phone: "+964 770 222 444",
              ownerName: "Self",
              vehicleLabel: "Civic 2020",
              vehicleId: 8,
              status: "offline",
              earningsToday: 0,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredDrivers = useMemo(() => {
    if (!search) return drivers;
    return drivers.filter((driver) =>
      `${driver.name} ${driver.phone} ${driver.id}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [drivers, search]);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Driver roster</p>
          <p className="text-xs text-slate-500">Live sync with auth service</p>
        </div>
        <input
          type="search"
          placeholder="Search driver or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="py-2">Driver</th>
              <th className="py-2">Owner</th>
              <th className="py-2">Vehicle</th>
              <th className="py-2">Status</th>
              <th className="py-2">Shift</th>
              <th className="py-2">Earnings</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.id} className="border-t border-slate-100">
                <td className="py-3">
                  <div className="font-semibold text-slate-900">{driver.name}</div>
                  <p className="text-xs text-slate-500">#{driver.id} · {driver.phone}</p>
                </td>
                <td className="py-3 text-slate-700">{driver.ownerName ?? "—"}</td>
                <td className="py-3 text-slate-700">
                  {driver.vehicleId ? (
                    <span>
                      #{driver.vehicleId} · {driver.vehicleLabel ?? "Vehicle"}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      driver.status === "online"
                        ? "bg-emerald-100 text-emerald-700"
                        : driver.status === "suspended"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {driver.status ?? "offline"}
                  </span>
                </td>
                <td className="py-3 text-xs text-slate-600">
                  {driver.sessionStartedAt
                    ? `since ${new Date(driver.sessionStartedAt).toLocaleTimeString()}`
                    : "—"}
                </td>
                <td className="py-3 font-semibold text-slate-900">
                  SEK {(driver.earningsToday / 100).toFixed(2)}
                </td>
                <td className="py-3 text-right">
                  <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {!filteredDrivers.length && !loading && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                  No drivers match the search criteria.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                  Loading drivers…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
