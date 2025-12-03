"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../apiClient";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  age: "",
  address: "",
  city: "",
  country: "",
  zipCode: "",
  governmentIdNumber: "",
  driverLicenseNumber: "",
  vehicleIds: [],
  ownerId: "",
};

export default function DriverOnboarding({ onCreated, refreshKey = 0 }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const vehicleOptions = useMemo(() => {
    const baseList = form.ownerId
      ? owners.find((o) => String(o.id) === String(form.ownerId))?.vehicles ??
        []
      : vehicles;
    if (!vehicleSearch.trim()) return baseList;
    const term = vehicleSearch.trim().toLowerCase();
    return baseList.filter((v) => {
      const label = `${v.label ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase();
      const plate = `${v.plateNumber ?? v.plate_number ?? ""}`.toLowerCase();
      return label.includes(term) || plate.includes(term);
    });
  }, [form.ownerId, owners, vehicles, vehicleSearch]);

  useEffect(() => {
    let cancelled = false;
    async function loadOwnersAndVehicles() {
      try {
        const payload = await apiRequest("/admin/owners");
        if (cancelled) return;
        const ownerList = Array.isArray(payload?.owners) ? payload.owners : [];
        setOwners(ownerList);
        setVehicles(
          ownerList.flatMap((o) =>
            (o.vehicles ?? []).map((v) => ({ ...v, owner: o }))
          )
        );
      } catch (error) {
        if (cancelled) return;
        setOwners([]);
        setVehicles([]);
      }
    }
    loadOwnersAndVehicles();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVehicleChange = (e) => {
    const selected = Array.from(e.target.selectedOptions || []).map((opt) =>
      Number(opt.value)
    );
    setForm((prev) => ({ ...prev, vehicleIds: selected }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const driverPayload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        age: Number(form.age) || undefined,
        homeAddress: form.address,
        city: form.city,
        country: form.country,
        zipCode: form.zipCode,
        governmentIdNumber: form.governmentIdNumber,
        driverLicenseNumber: form.driverLicenseNumber,
        vehicleId: Array.isArray(form.vehicleIds) && form.vehicleIds.length
          ? Number(form.vehicleIds[0])
          : undefined,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
      };
      if (!driverPayload.vehicleId) {
        throw new Error("Select at least one vehicle to assign this driver.");
      }

      const result = await apiRequest("/admin/drivers", {
        method: "POST",
        body: JSON.stringify(driverPayload),
      });
      const createdDriver = result?.driver ?? result?.user ?? result;

      // Assign any additional vehicles beyond the first one used for creation
      const extraVehicles = (form.vehicleIds || []).slice(1);
      for (const vid of extraVehicles) {
        try {
          await apiRequest(`/vehicles/${vid}/assign`, {
            method: "POST",
            body: JSON.stringify({ driverId: createdDriver.id }),
          });
        } catch (err) {
          // surface the first failure, but continue attempts
          setMessage({
            type: "error",
            text:
              err?.message ||
              "Driver created, but assigning an additional vehicle failed.",
          });
        }
      }

      setMessage({
        type: "success",
        text: "Driver onboarded and assigned successfully.",
      });
      setForm(EMPTY_FORM);
      onCreated?.(createdDriver);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message ?? "Unable to create driver",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 mb-6">
        <p className="text-lg font-semibold text-slate-900">
          Driver onboarding
        </p>
        <p className="text-xs text-slate-500">
          Admins can create drivers and assign them to a vehicle instantly.
        </p>
      </div>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Full name"
            name="fullName"
            value={form.fullName}
            onChange={onChange}
            required
          />
          <TextInput
            label="Phone number"
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
          />
          <TextInput
            label="Create password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
          />
          <TextInput
            label="Age"
            name="age"
            type="number"
            value={form.age}
            onChange={onChange}
            required
          />
          <TextInput
            label="ZIP / Postal code"
            name="zipCode"
            value={form.zipCode}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Home address"
            name="address"
            value={form.address}
            onChange={onChange}
          />
          <TextInput
            label="City"
            name="city"
            value={form.city}
            onChange={onChange}
          />
          <TextInput
            label="Country"
            name="country"
            value={form.country}
            onChange={onChange}
          />
          <TextInput
            label="Government ID"
            name="governmentIdNumber"
            value={form.governmentIdNumber}
            onChange={onChange}
          />
          <TextInput
            label="Driver license number"
            name="driverLicenseNumber"
            value={form.driverLicenseNumber}
            onChange={onChange}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
            Owner (optional filter)
            <select
              name="ownerId"
              value={form.ownerId}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 bg-white"
            >
              <option value="">Any owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  #{owner.id} · {owner.fullName ?? owner.name ?? "Owner"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span>Assign vehicles (choose one or more)</span>
              <span className="text-[11px] text-slate-400">
                Required: pick at least one.
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
              <input
                type="search"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Search by label or plate…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
              />

              <div className="flex flex-wrap gap-2">
                {form.vehicleIds.map((vid) => {
                  const v = vehicleOptions.find((veh) => veh.id === vid) || {};
                  const label =
                    v.label || v.make || v.model || `Vehicle #${vid}`;
                  const plate = v.plateNumber ?? v.plate_number;
                  return (
                    <span
                      key={vid}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700"
                    >
                      {label} {plate ? `(${plate})` : ""}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            vehicleIds: prev.vehicleIds.filter((id) => id !== vid),
                          }))
                        }
                        className="text-slate-500 hover:text-slate-900"
                        aria-label="Remove vehicle"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {!form.vehicleIds.length && (
                  <span className="text-[12px] text-slate-400">
                    No vehicles selected.
                  </span>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2">
                {vehicleOptions.map((vehicle) => {
                  const selected = form.vehicleIds.includes(vehicle.id);
                  return (
                    <label
                      key={vehicle.id}
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-slate-900 bg-slate-900/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setForm((prev) => {
                            const exists = prev.vehicleIds.includes(vehicle.id);
                            return {
                              ...prev,
                              vehicleIds: exists
                                ? prev.vehicleIds.filter((id) => id !== vehicle.id)
                                : [...prev.vehicleIds, vehicle.id],
                            };
                          });
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {vehicle.label ||
                            vehicle.make ||
                            vehicle.model ||
                            `Vehicle #${vehicle.id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          #{vehicle.id} ·{" "}
                          {vehicle.plateNumber ??
                            vehicle.plate_number ??
                            "n/a"}
                          {vehicle.owner?.fullName
                            ? ` — ${vehicle.owner.fullName}`
                            : vehicle.ownerName
                            ? ` — ${vehicle.ownerName}`
                            : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {!vehicleOptions.length && (
                  <p className="text-xs text-slate-400">
                    No vehicles match the search.
                  </p>
                )}
              </div>
            </div>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-2xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating driver…" : "Create driver"}
          </button>
          {message && (
            <p
              className={`text-sm ${
                message.type === "error" ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function TextInput(props) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {props.label}
      <input
        {...props}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </label>
  );
}
