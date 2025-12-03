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

  const [promoteOwnerId, setPromoteOwnerId] = useState("");
  const [promoteVehicleIds, setPromoteVehicleIds] = useState([]);
  const [promoteMessage, setPromoteMessage] = useState(null);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);
  const [promoteVehicleSearch, setPromoteVehicleSearch] = useState("");
  const promotionVehicles = promoteOwnerId
    ? owners.find((o) => String(o.id) === String(promoteOwnerId))?.vehicles ??
      []
    : owners.flatMap((owner) => owner.vehicles ?? []);
  const filteredPromotionVehicles = promotionVehicles.filter((vehicle) => {
    if (!promoteVehicleSearch.trim()) return true;
    const term = promoteVehicleSearch.trim().toLowerCase();
    const label = `${vehicle.label ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.toLowerCase();
    const plate = `${vehicle.plateNumber ?? vehicle.plate_number ?? ""}`.toLowerCase();
    return label.includes(term) || plate.includes(term);
  });

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

  const handlePromoteOwner = async (event) => {
    event.preventDefault();
    setPromoteSubmitting(true);
    setPromoteMessage(null);
    try {
      if (!promoteOwnerId || !promoteVehicleIds.length) {
        throw new Error("Select an owner and at least one vehicle.");
      }
      const primaryVehicle = promoteVehicleIds[0];
      await apiRequest("/admin/drivers/promote", {
        method: "POST",
        body: JSON.stringify({
          ownerId: Number(promoteOwnerId),
          vehicleId: Number(primaryVehicle),
        }),
      });
      const extraVehicleIds = promoteVehicleIds.slice(1);
      for (const vid of extraVehicleIds) {
        try {
          await apiRequest(`/vehicles/${vid}/assign`, {
            method: "POST",
            body: JSON.stringify({
              driverId: Number(promoteOwnerId),
            }),
          });
        } catch (err) {
          setPromoteMessage({
            type: "error",
            text:
              err?.message ||
              "Promoted, but assigning one of the extra vehicles failed.",
          });
        }
      }
      setPromoteMessage({
        type: "success",
        text: "Owner promoted to driver and assigned.",
      });
      setPromoteOwnerId("");
      setPromoteVehicleIds([]);
      fetchOwners();
      setDriverRefreshKey((key) => key + 1);
    } catch (error) {
      setPromoteMessage({
        type: "error",
        text: error?.message ?? "Unable to promote owner.",
      });
    } finally {
      setPromoteSubmitting(false);
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

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-lg font-semibold text-slate-900">
            Promote existing owner to driver
          </p>
          <p className="text-xs text-slate-500">
            Upgrade an owner to owner-driver and assign them to a vehicle.
          </p>
        </div>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePromoteOwner}>
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
            Owner
            <select
              value={promoteOwnerId}
              onChange={(e) => setPromoteOwnerId(e.target.value)}
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
          <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span>Vehicle(s)</span>
              <span className="text-[11px] text-slate-400">Select one or more.</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
              <input
                type="search"
                value={promoteVehicleSearch}
                onChange={(e) => setPromoteVehicleSearch(e.target.value)}
                placeholder="Search by label or plate…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
              />

              <div className="flex flex-wrap gap-2">
                {promoteVehicleIds.map((vid) => {
                  const v =
                    filteredPromotionVehicles.find((veh) => veh.id === vid) ||
                    promotionVehicles.find((veh) => veh.id === vid) ||
                    {};
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
                          setPromoteVehicleIds((prev) =>
                            prev.filter((id) => id !== vid)
                          )
                        }
                        className="text-slate-500 hover:text-slate-900"
                        aria-label="Remove vehicle"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {!promoteVehicleIds.length && (
                  <span className="text-[12px] text-slate-400">
                    No vehicles selected.
                  </span>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2">
                {filteredPromotionVehicles.map((vehicle) => {
                  const selected = promoteVehicleIds.includes(vehicle.id);
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
                        onChange={() =>
                          setPromoteVehicleIds((prev) =>
                            prev.includes(vehicle.id)
                              ? prev.filter((id) => id !== vehicle.id)
                              : [...prev, vehicle.id]
                          )
                        }
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
                          {vehicle.plateNumber ?? vehicle.plate_number ?? "n/a"}
                        </p>
                      </div>
                    </label>
                  );
                })}
                {!filteredPromotionVehicles.length && (
                  <p className="text-xs text-slate-400">
                    No vehicles match the search.
                  </p>
                )}
              </div>
            </div>
          </label>
          <div className="md:col-span-3 flex flex-col gap-2">
            <button
              type="submit"
              disabled={promoteSubmitting}
              className="self-start rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {promoteSubmitting ? "Promoting…" : "Promote & assign"}
            </button>
            {promoteMessage && (
              <p
                className={`text-sm ${
                  promoteMessage.type === "error"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {promoteMessage.text}
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
