"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../apiClient";

const ROLE_OPTIONS = [
  { value: "driver", label: "Driver" },
  { value: "owner_driver", label: "Owner & driver" },
  { value: "owner", label: "Owner only" },
];

const PROFILE_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company / fleet" },
];

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
  role: "driver",
  profileType: "individual",
  companyName: "",
  fleetVehicleCount: "",
};

export default function DriverOnboarding({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const isDriverRoleSelected =
    form.role === "driver" || form.role === "owner_driver";
  const isOwnerRoleSelected =
    form.role === "owner" || form.role === "owner_driver";
  const requiresCompanyDetails = form.profileType === "company";

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
        role: form.role,
        profileType: form.profileType,
        companyName:
          form.profileType === "company" ? form.companyName : undefined,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
      };
      if (isOwnerRoleSelected && form.fleetVehicleCount) {
        driverPayload.ownerVehicleCount = Number(form.fleetVehicleCount);
      }
      const registration = await apiRequest("/auth/register-driver", {
        method: "POST",
        body: JSON.stringify(driverPayload),
      });
      const createdDriver = registration?.user ?? registration;

      if (form.assignVehicleId && createdDriver?.id && isDriverRoleSelected) {
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
          Driver & owner onboarding
        </p>
        <p className="text-xs text-slate-500">
          Only administrators can create driver or owner accounts. Drivers can also be paired
          with a vehicle immediately.
        </p>
      </div>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Account role
            </p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, role: option.value }))
                  }
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    form.role === option.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Owners manage vehicles while owner-drivers can also take trips.
            </p>
          </div>
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
            Profile type
            <select
              name="profileType"
              value={form.profileType}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 bg-white"
            >
              {PROFILE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">
              Company accounts require a registered company name.
            </span>
          </label>
        </div>

        {requiresCompanyDetails && (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Company name"
              name="companyName"
              value={form.companyName}
              onChange={onChange}
              required={requiresCompanyDetails}
            />
            <TextInput
              label="Number of fleet vehicles"
              name="fleetVehicleCount"
              type="number"
              min="1"
              value={form.fleetVehicleCount}
              onChange={onChange}
              placeholder="How many cars are active?"
            />
          </div>
        )}

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
          {isDriverRoleSelected ? (
            <>
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
                      #{vehicle.id} · {vehicle.label || vehicle.make} (
                        {vehicle.plateNumber ?? vehicle.plate_number}
                      )
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
            </>
          ) : (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 px-3 py-4">
              <p className="text-sm font-semibold text-slate-700">
                Owner accounts manage their own vehicles
              </p>
              <p className="text-xs text-slate-500">
                After creating the owner, add their vehicles from the Fleet tab.
              </p>
            </div>
          )}
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
