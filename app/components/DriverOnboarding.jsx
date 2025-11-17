"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../apiClient";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  age: "",
  address: "",
  zipCode: "",
  governmentIdNumber: "",
  driverLicenseNumber: "",
  ownerId: "",
  assignVehicleId: "",
  vehicleNotes: "",
};

export default function DriverOnboarding({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadVehicles() {
      try {
        const payload = await apiRequest("/vehicles/mine");
        if (!cancelled && Array.isArray(payload?.vehicles)) {
          setVehicles(payload.vehicles);
        }
      } catch (error) {
        if (!cancelled) {
          setVehicles([
            { id: 1, label: "White Camry", plateNumber: "ABC-123" },
            { id: 2, label: "Black Sprinter", plateNumber: "KRD-009" },
          ]);
        }
      }
    }
    loadVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

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
        zipCode: form.zipCode,
        governmentIdNumber: form.governmentIdNumber,
        driverLicenseNumber: form.driverLicenseNumber,
        role: "driver",
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
      };
      const registration = await apiRequest("/auth/register-driver", {
        method: "POST",
        body: JSON.stringify(driverPayload),
      });
      const createdDriver = registration?.user ?? registration;

      if (form.assignVehicleId && createdDriver?.id) {
        await apiRequest(`/vehicles/${form.assignVehicleId}/assign`, {
          method: "POST",
          body: JSON.stringify({
            driverId: createdDriver.id,
          }),
        });
      }

      setMessage({ type: "success", text: "Driver onboarded successfully." });
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
          Only administrators can create driver accounts. Every new account can be
          paired with a vehicle immediately.
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
          <TextInput
            label="Owner ID (if applicable)"
            name="ownerId"
            value={form.ownerId}
            onChange={onChange}
            placeholder="Company / fleet owner"
          />
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
            Assign vehicle
            <select
              name="assignVehicleId"
              value={form.assignVehicleId}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 bg-white"
            >
              <option value="">Select later</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  #{vehicle.id} · {vehicle.label || vehicle.make} ({
                    vehicle.plateNumber ?? vehicle.plate_number
                  })
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Notes"
            name="vehicleNotes"
            value={form.vehicleNotes}
            onChange={onChange}
            placeholder="Shift, color, etc."
          />
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
