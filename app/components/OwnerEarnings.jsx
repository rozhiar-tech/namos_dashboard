"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../apiClient";

export default function OwnerEarnings() {
  const [owners, setOwners] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadOwners() {
      try {
        const payload = await apiRequest("/admin/owners?includeVehicles=1");
        if (!cancelled) {
          setOwners(payload?.owners ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch owners:", error);
          setOwners([]);
        }
      }
    }
    loadOwners();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-slate-900">Owners & fleets</p>
        <p className="text-xs text-slate-500">
          Car owners see their income breakdown in the partner app.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {owners.map((owner) => {
          const vehicleCount = Array.isArray(owner.vehicles)
            ? owner.vehicles.length
            : Number(owner.vehicles ?? 0);
          const name =
            owner.name || owner.fullName || owner.companyName || "Owner";
          const revenue =
            typeof owner.revenueMonth === "number"
              ? owner.revenueMonth
              : 0;
          const driverCount =
            typeof owner.drivers === "number" ? owner.drivers : owner.drivers?.length || 0;
          return (
          <article
            key={owner.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">Owner #{owner.id}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {vehicleCount} vehicles
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">Gross revenue (month)</p>
            <p className="text-2xl font-semibold text-slate-900">
              SEK {(revenue / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {driverCount} active drivers under this owner.
            </p>
            <button className="mt-4 text-xs font-semibold text-slate-900 underline">
              Open owner console
            </button>
          </article>
        )})}
        {!owners.length && (
          <p className="text-xs text-slate-500">No owner data available.</p>
        )}
      </div>
    </section>
  );
}
