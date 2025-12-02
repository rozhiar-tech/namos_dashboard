"use client";

import { useCallback, useEffect, useState } from "react";
import DriverOnboarding from "../../components/DriverOnboarding";
import { apiRequest } from "../../apiClient";

const EMPTY_OWNER = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  age: "",
  homeAddress: "",
  city: "",
  country: "",
  profileType: "individual",
};

const EMPTY_VEHICLE_ROW = {
  label: "",
  plateNumber: "",
  make: "",
  model: "",
  year: "",
  color: "",
  vin: "",
  seatCount: "",
};

const EMPTY_VEHICLE_FORM = {
  ownerId: "",
  ...EMPTY_VEHICLE_ROW,
};

export default function OnboardingPage() {
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [ownerForm, setOwnerForm] = useState(EMPTY_OWNER);
  const [ownerVehicles, setOwnerVehicles] = useState([EMPTY_VEHICLE_ROW]);
  const [ownerMessage, setOwnerMessage] = useState(null);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [driverRefreshKey, setDriverRefreshKey] = useState(0);

  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE_FORM);
  const [vehicleMessage, setVehicleMessage] = useState(null);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);

  const fetchOwners = useCallback(async () => {
    setLoadingOwners(true);
    try {
      const payload = await apiRequest("/admin/owners");
      setOwners(payload?.owners ?? []);
    } catch (error) {
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleOwnerInput = (event) => {
    const { name, value } = event.target;
    setOwnerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleRowChange = (index, field, value) => {
    setOwnerVehicles((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const addVehicleRow = () =>
    setOwnerVehicles((prev) => [...prev, { ...EMPTY_VEHICLE_ROW }]);
  const removeVehicleRow = (index) =>
    setOwnerVehicles((prev) => prev.filter((_, idx) => idx !== index));

  const handleCreateOwner = async (event) => {
    event.preventDefault();
    setOwnerSubmitting(true);
    setOwnerMessage(null);
    try {
      const payload = {
        fullName: ownerForm.fullName,
        phone: ownerForm.phone,
        email: ownerForm.email,
        password: ownerForm.password,
        age: ownerForm.age ? Number(ownerForm.age) : undefined,
        profileType: ownerForm.profileType || "individual",
        homeAddress: ownerForm.homeAddress,
        city: ownerForm.city,
        country: ownerForm.country,
        vehicles: ownerVehicles
          .map((v) => ({
            label: v.label?.trim(),
            plateNumber: v.plateNumber?.trim(),
            make: v.make?.trim() || undefined,
            model: v.model?.trim() || undefined,
            year: v.year ? Number(v.year) : undefined,
            color: v.color?.trim() || undefined,
            vin: v.vin?.trim() || undefined,
            seatCount: v.seatCount ? Number(v.seatCount) : undefined,
          }))
          .filter((v) => v.label && v.plateNumber),
      };

      const created = await apiRequest("/admin/owners", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const newOwner = created?.owner ?? created;

      setOwnerMessage({
        type: "success",
        text: "Owner and vehicles created.",
      });
      setOwnerForm(EMPTY_OWNER);
      setOwnerVehicles([EMPTY_VEHICLE_ROW]);
      if (newOwner) {
        setOwners((prev) => [newOwner, ...(prev ?? [])]);
      }
      fetchOwners();
      setDriverRefreshKey((key) => key + 1);
    } catch (error) {
      setOwnerMessage({
        type: "error",
        text: error?.message ?? "Unable to create owner.",
      });
    } finally {
      setOwnerSubmitting(false);
    }
  };

  const handleVehicleInput = (event) => {
    const { name, value } = event.target;
    setVehicleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();
    setVehicleSubmitting(true);
    setVehicleMessage(null);
    try {
      if (!vehicleForm.ownerId) {
        throw new Error("Select an owner for this vehicle.");
      }
      const payload = {
        ownerId: Number(vehicleForm.ownerId),
        label: vehicleForm.label?.trim(),
        plateNumber: vehicleForm.plateNumber?.trim(),
        make: vehicleForm.make?.trim() || undefined,
        model: vehicleForm.model?.trim() || undefined,
        year: vehicleForm.year ? Number(vehicleForm.year) : undefined,
        color: vehicleForm.color?.trim() || undefined,
        vin: vehicleForm.vin?.trim() || undefined,
        seatCount: vehicleForm.seatCount ? Number(vehicleForm.seatCount) : undefined,
      };
      await apiRequest("/vehicles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setVehicleMessage({ type: "success", text: "Vehicle added." });
      setVehicleForm(EMPTY_VEHICLE_FORM);
      fetchOwners();
      setDriverRefreshKey((key) => key + 1);
    } catch (error) {
      setVehicleMessage({
        type: "error",
        text: error?.message ?? "Unable to add vehicle.",
      });
    } finally {
      setVehicleSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-lg font-semibold text-slate-900">
            Create owner (with vehicles)
          </p>
          <p className="text-xs text-slate-500">
            Register a fleet owner and add their vehicles in one step.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleCreateOwner}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Full name"
              name="fullName"
              value={ownerForm.fullName}
              onChange={handleOwnerInput}
              required
            />
            <TextInput
              label="Phone"
              name="phone"
              value={ownerForm.phone}
              onChange={handleOwnerInput}
              required
            />
            <TextInput
              label="Email"
              name="email"
              type="email"
              value={ownerForm.email}
              onChange={handleOwnerInput}
              required
            />
            <TextInput
              label="Password"
              name="password"
              type="password"
              value={ownerForm.password}
              onChange={handleOwnerInput}
              required
            />
            <TextInput
              label="Age"
              name="age"
              type="number"
              value={ownerForm.age}
              onChange={handleOwnerInput}
              required
            />
            <TextInput
              label="Profile type"
              name="profileType"
              value={ownerForm.profileType}
              onChange={handleOwnerInput}
              placeholder="individual / company"
            />
            <TextInput
              label="Address"
              name="homeAddress"
              value={ownerForm.homeAddress}
              onChange={handleOwnerInput}
            />
            <TextInput
              label="City"
              name="city"
              value={ownerForm.city}
              onChange={handleOwnerInput}
            />
            <TextInput
              label="Country"
              name="country"
              value={ownerForm.country}
              onChange={handleOwnerInput}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Vehicles for this owner
            </p>
            <div className="space-y-4">
              {ownerVehicles.map((veh, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 md:grid-cols-5 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <TextInput
                    label="Label"
                    name="label"
                    value={veh.label}
                    onChange={(e) =>
                      handleVehicleRowChange(idx, "label", e.target.value)
                    }
                    required
                  />
                  <TextInput
                    label="Plate"
                    name="plateNumber"
                    value={veh.plateNumber}
                    onChange={(e) =>
                      handleVehicleRowChange(idx, "plateNumber", e.target.value)
                    }
                    required
                  />
                  <TextInput
                    label="Make"
                    name="make"
                    value={veh.make}
                    onChange={(e) =>
                      handleVehicleRowChange(idx, "make", e.target.value)
                    }
                  />
                  <TextInput
                    label="Model"
                    name="model"
                    value={veh.model}
                    onChange={(e) =>
                      handleVehicleRowChange(idx, "model", e.target.value)
                    }
                  />
                  <TextInput
                    label="Seat count"
                    name="seatCount"
                    type="number"
                    min="1"
                    value={veh.seatCount}
                    onChange={(e) =>
                      handleVehicleRowChange(idx, "seatCount", e.target.value)
                    }
                  />
                  <div className="md:col-span-5 flex flex-wrap gap-2">
                    <TextInput
                      label="Year"
                      name="year"
                      type="number"
                      value={veh.year}
                      onChange={(e) =>
                        handleVehicleRowChange(idx, "year", e.target.value)
                      }
                    />
                    <TextInput
                      label="Color"
                      name="color"
                      value={veh.color}
                      onChange={(e) =>
                        handleVehicleRowChange(idx, "color", e.target.value)
                      }
                    />
                    <TextInput
                      label="VIN"
                      name="vin"
                      value={veh.vin}
                      onChange={(e) =>
                        handleVehicleRowChange(idx, "vin", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeVehicleRow(idx)}
                      className="self-end rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white/60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addVehicleRow}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Add another vehicle
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={ownerSubmitting}
              className="self-start rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {ownerSubmitting ? "Creating…" : "Create owner + vehicles"}
            </button>
            {ownerMessage && (
              <p
                className={`text-sm ${
                  ownerMessage.type === "error"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {ownerMessage.text}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-lg font-semibold text-slate-900">
            Add vehicle to existing owner
          </p>
          <p className="text-xs text-slate-500">
            Use when an owner acquires another vehicle.
          </p>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreateVehicle}>
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
            Owner
            <select
              name="ownerId"
              value={vehicleForm.ownerId}
              onChange={handleVehicleInput}
              required
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            >
              <option value="">
                {loadingOwners ? "Loading owners…" : "Select owner"}
              </option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  #{owner.id} · {owner.fullName ?? owner.name ?? "Owner"}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Label"
            name="label"
            value={vehicleForm.label}
            onChange={handleVehicleInput}
            required
          />
          <TextInput
            label="Plate"
            name="plateNumber"
            value={vehicleForm.plateNumber}
            onChange={handleVehicleInput}
            required
          />
          <TextInput
            label="Make"
            name="make"
            value={vehicleForm.make}
            onChange={handleVehicleInput}
          />
          <TextInput
            label="Model"
            name="model"
            value={vehicleForm.model}
            onChange={handleVehicleInput}
          />
          <TextInput
            label="Year"
            name="year"
            type="number"
            value={vehicleForm.year}
            onChange={handleVehicleInput}
          />
          <TextInput
            label="Color"
            name="color"
            value={vehicleForm.color}
            onChange={handleVehicleInput}
          />
          <TextInput
            label="VIN"
            name="vin"
            value={vehicleForm.vin}
            onChange={handleVehicleInput}
          />
          <TextInput
            label="Seat count"
            name="seatCount"
            type="number"
            value={vehicleForm.seatCount}
            onChange={handleVehicleInput}
          />
          <div className="md:col-span-3 flex flex-col gap-2">
            <button
              type="submit"
              disabled={vehicleSubmitting}
              className="self-start rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {vehicleSubmitting ? "Adding…" : "Add vehicle"}
            </button>
            {vehicleMessage && (
              <p
                className={`text-sm ${
                  vehicleMessage.type === "error"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {vehicleMessage.text}
              </p>
            )}
          </div>
        </form>
      </section>

      <DriverOnboarding
        refreshKey={driverRefreshKey}
        onCreated={() => {
          fetchOwners();
          setDriverRefreshKey((key) => key + 1);
        }}
      />
    </div>
  );
}

function TextInput(props) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {props.label}
      <input
        {...props}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </label>
  );
}
