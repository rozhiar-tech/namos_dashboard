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
  vehicleId: "",
  ownerId: "",
};

export default function DriverOnboarding({ onCreated, refreshKey = 0 }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const vehicleOptions = useMemo(() => {
    if (form.ownerId) {
      const owner = owners.find((o) => String(o.id) === String(form.ownerId));
      return owner?.vehicles ?? [];
    }
    return vehicles;
  }, [form.ownerId, owners, vehicles]);

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
        vehicleId: Number(form.vehicleId) || undefined,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
      };
      if (!driverPayload.vehicleId) {
        throw new Error("Select a vehicle to assign this driver.");
      }

      const result = await apiRequest("/admin/drivers", {
        method: "POST",
        body: JSON.stringify(driverPayload),
      });
      const createdDriver = result?.driver ?? result?.user ?? result;

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
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1 md:col-span-2">
            Assign vehicle
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={onChange}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 bg-white"
            >
              <option value="">Select a vehicle</option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  #{vehicle.id} · {vehicle.label || vehicle.make} (
                    {vehicle.plateNumber ?? vehicle.plate_number}
                  ) — owner:{" "}
                  {vehicle.owner?.fullName ??
                    vehicle.ownerName ??
                    "Unknown"}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">
              Drivers must be assigned to a vehicle at creation.
            </span>
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
