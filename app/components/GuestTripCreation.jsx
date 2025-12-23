"use client";

import { useState } from "react";
import { apiRequest } from "../apiClient";
import useTranslation from "../hooks/useTranslation";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to avoid SSR issues with Google Maps
const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

const EMPTY_GUEST_FORM = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupLat: "",
  pickupLng: "",
  dropoffLat: "",
  dropoffLng: "",
  distanceKm: "",
  durationMin: "",
  rideMode: "immediate",
  scheduledAt: "",
  vehicleTier: "economy",
  passengerCount: "1",
  includePets: false,
  riderNotes: "",
};

const EMPTY_USER_FORM = {
  riderId: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupLat: "",
  pickupLng: "",
  dropoffLat: "",
  dropoffLng: "",
  distanceKm: "",
  durationMin: "",
  rideMode: "immediate",
  vehicleTier: "economy",
  passengerCount: "1",
  includePets: false,
  riderNotes: "",
};

export default function GuestTripCreation() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("guest");
  const [guestForm, setGuestForm] = useState(EMPTY_GUEST_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [users, setUsers] = useState([]);

  const handleGuestInput = (e) => {
    const { name, value, type, checked } = e.target;
    setGuestForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePickupLocationChange = (locationData) => {
    setGuestForm((prev) => ({
      ...prev,
      pickupLocation: locationData.location,
      pickupLat: locationData.lat.toString(),
      pickupLng: locationData.lng.toString(),
    }));
    // Calculate distance if dropoff is also set
    if (guestForm.dropoffLat && guestForm.dropoffLng) {
      calculateRoute(
        locationData.lat,
        locationData.lng,
        parseFloat(guestForm.dropoffLat),
        parseFloat(guestForm.dropoffLng)
      );
    }
  };

  const handleDropoffLocationChange = (locationData) => {
    setGuestForm((prev) => ({
      ...prev,
      dropoffLocation: locationData.location,
      dropoffLat: locationData.lat.toString(),
      dropoffLng: locationData.lng.toString(),
    }));
    // Calculate distance if pickup is also set
    if (guestForm.pickupLat && guestForm.pickupLng) {
      calculateRoute(
        parseFloat(guestForm.pickupLat),
        parseFloat(guestForm.pickupLng),
        locationData.lat,
        locationData.lng
      );
    }
  };

  const calculateRoute = async (pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    if (!window.google || !window.google.maps) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: pickupLat, lng: pickupLng },
          destination: { lat: dropoffLat, lng: dropoffLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result.routes[0]) {
            const route = result.routes[0];
            const distanceKm = route.legs[0].distance.value / 1000; // Convert meters to km
            const durationMin = Math.round(route.legs[0].duration.value / 60); // Convert seconds to minutes

            setGuestForm((prev) => ({
              ...prev,
              distanceKm: distanceKm.toFixed(2),
              durationMin: durationMin.toString(),
            }));
          }
        }
      );
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  const handleUserInput = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUserPickupLocationChange = (locationData) => {
    setUserForm((prev) => ({
      ...prev,
      pickupLocation: locationData.location,
      pickupLat: locationData.lat.toString(),
      pickupLng: locationData.lng.toString(),
    }));
    // Calculate distance if dropoff is also set
    if (userForm.dropoffLat && userForm.dropoffLng) {
      calculateUserRoute(
        locationData.lat,
        locationData.lng,
        parseFloat(userForm.dropoffLat),
        parseFloat(userForm.dropoffLng)
      );
    }
  };

  const handleUserDropoffLocationChange = (locationData) => {
    setUserForm((prev) => ({
      ...prev,
      dropoffLocation: locationData.location,
      dropoffLat: locationData.lat.toString(),
      dropoffLng: locationData.lng.toString(),
    }));
    // Calculate distance if pickup is also set
    if (userForm.pickupLat && userForm.pickupLng) {
      calculateUserRoute(
        parseFloat(userForm.pickupLat),
        parseFloat(userForm.pickupLng),
        locationData.lat,
        locationData.lng
      );
    }
  };

  const calculateUserRoute = async (pickupLat, pickupLng, dropoffLat, dropoffLng) => {
    if (!window.google || !window.google.maps) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: pickupLat, lng: pickupLng },
          destination: { lat: dropoffLat, lng: dropoffLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result.routes[0]) {
            const route = result.routes[0];
            const distanceKm = route.legs[0].distance.value / 1000; // Convert meters to km
            const durationMin = Math.round(route.legs[0].duration.value / 60); // Convert seconds to minutes

            setUserForm((prev) => ({
              ...prev,
              distanceKm: distanceKm.toFixed(2),
              durationMin: durationMin.toString(),
            }));
          }
        }
      );
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        ...guestForm,
        pickupLat: parseFloat(guestForm.pickupLat),
        pickupLng: parseFloat(guestForm.pickupLng),
        dropoffLat: parseFloat(guestForm.dropoffLat),
        dropoffLng: parseFloat(guestForm.dropoffLng),
        distanceKm: parseFloat(guestForm.distanceKm),
        durationMin: parseInt(guestForm.durationMin),
        passengerCount: parseInt(guestForm.passengerCount),
      };
      const result = await apiRequest("/admin/trips/create-guest", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage({ type: "success", text: result.message || "Guest trip created successfully" });
      setGuestForm(EMPTY_GUEST_FORM);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to create guest trip" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        ...userForm,
        riderId: parseInt(userForm.riderId),
        pickupLat: parseFloat(userForm.pickupLat),
        pickupLng: parseFloat(userForm.pickupLng),
        dropoffLat: parseFloat(userForm.dropoffLat),
        dropoffLng: parseFloat(userForm.dropoffLng),
        distanceKm: parseFloat(userForm.distanceKm),
        durationMin: parseInt(userForm.durationMin),
        passengerCount: parseInt(userForm.passengerCount),
      };
      const result = await apiRequest("/admin/trips/create-for-user", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage({ type: "success", text: result.message || "Trip created successfully for user" });
      setUserForm(EMPTY_USER_FORM);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to create trip" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("guestTrips.title")}</h3>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("guest")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === "guest"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("guestTrips.createForGuest")}
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === "user"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("guestTrips.createForUser")}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            message.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-600"
              : "bg-emerald-50 border border-emerald-200 text-emerald-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === "guest" ? (
        <form onSubmit={handleGuestSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label={t("guestTrips.guestName")}
              name="guestName"
              value={guestForm.guestName}
              onChange={handleGuestInput}
              required
            />
            <TextInput
              label={t("guestTrips.guestPhone")}
              name="guestPhone"
              type="tel"
              value={guestForm.guestPhone}
              onChange={handleGuestInput}
              required
            />
            <TextInput
              label={t("guestTrips.guestEmail")}
              name="guestEmail"
              type="email"
              value={guestForm.guestEmail}
              onChange={handleGuestInput}
            />
          </div>
          <div className="space-y-6">
            <div>
              <LocationPicker
                label={t("guestTrips.pickupLocation")}
                value={guestForm.pickupLocation}
                coordinates={
                  guestForm.pickupLat && guestForm.pickupLng
                    ? { lat: parseFloat(guestForm.pickupLat), lng: parseFloat(guestForm.pickupLng) }
                    : null
                }
                onLocationChange={handlePickupLocationChange}
                required
              />
            </div>
            <div>
              <LocationPicker
                label={t("guestTrips.dropoffLocation")}
                value={guestForm.dropoffLocation}
                coordinates={
                  guestForm.dropoffLat && guestForm.dropoffLng
                    ? { lat: parseFloat(guestForm.dropoffLat), lng: parseFloat(guestForm.dropoffLng) }
                    : null
                }
                onLocationChange={handleDropoffLocationChange}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectInput
              label={t("guestTrips.rideMode")}
              name="rideMode"
              value={guestForm.rideMode}
              onChange={handleGuestInput}
              options={[
                { value: "immediate", label: t("guestTrips.immediate") },
                { value: "scheduled", label: t("guestTrips.scheduled") },
                { value: "senior_assist", label: t("guestTrips.seniorAssist") },
              ]}
            />
            {guestForm.rideMode === "scheduled" && (
              <TextInput
                label={t("guestTrips.scheduledAt")}
                name="scheduledAt"
                type="datetime-local"
                value={guestForm.scheduledAt}
                onChange={handleGuestInput}
                required
              />
            )}
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <TextInput
                label="Distance (km)"
                name="distanceKm"
                type="number"
                step="0.1"
                value={guestForm.distanceKm}
                onChange={handleGuestInput}
                required
              />
              <TextInput
                label="Duration (min)"
                name="durationMin"
                type="number"
                value={guestForm.durationMin}
                onChange={handleGuestInput}
                required
              />
            </div>
            <SelectInput
              label={t("guestTrips.vehicleTier")}
              name="vehicleTier"
              value={guestForm.vehicleTier}
              onChange={handleGuestInput}
              options={[
                { value: "economy", label: t("guestTrips.economy") },
                { value: "comfort", label: t("guestTrips.comfort") },
                { value: "suv", label: t("guestTrips.suv") },
              ]}
            />
            <TextInput
              label={t("guestTrips.passengerCount")}
              name="passengerCount"
              type="number"
              min="1"
              value={guestForm.passengerCount}
              onChange={handleGuestInput}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includePets"
              name="includePets"
              checked={guestForm.includePets}
              onChange={handleGuestInput}
              className="rounded border-slate-300"
            />
            <label htmlFor="includePets" className="text-sm text-slate-700">
              {t("guestTrips.includePets")}
            </label>
          </div>
          <TextInput
            label={t("guestTrips.riderNotes")}
            name="riderNotes"
            value={guestForm.riderNotes}
            onChange={handleGuestInput}
            multiline
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? t("common.loading") : t("common.create")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="User ID"
              name="riderId"
              type="number"
              value={userForm.riderId}
              onChange={handleUserInput}
              required
            />
          </div>
          <div className="space-y-6">
            <div>
              <LocationPicker
                label={t("guestTrips.pickupLocation")}
                value={userForm.pickupLocation}
                coordinates={
                  userForm.pickupLat && userForm.pickupLng
                    ? { lat: parseFloat(userForm.pickupLat), lng: parseFloat(userForm.pickupLng) }
                    : null
                }
                onLocationChange={handleUserPickupLocationChange}
                required
              />
            </div>
            <div>
              <LocationPicker
                label={t("guestTrips.dropoffLocation")}
                value={userForm.dropoffLocation}
                coordinates={
                  userForm.dropoffLat && userForm.dropoffLng
                    ? { lat: parseFloat(userForm.dropoffLat), lng: parseFloat(userForm.dropoffLng) }
                    : null
                }
                onLocationChange={handleUserDropoffLocationChange}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <TextInput
                label="Distance (km)"
                name="distanceKm"
                type="number"
                step="0.1"
                value={userForm.distanceKm}
                onChange={handleUserInput}
                required
              />
              <TextInput
                label="Duration (min)"
                name="durationMin"
                type="number"
                value={userForm.durationMin}
                onChange={handleUserInput}
                required
              />
            </div>
            <SelectInput
              label={t("guestTrips.rideMode")}
              name="rideMode"
              value={userForm.rideMode}
              onChange={handleUserInput}
              options={[
                { value: "immediate", label: t("guestTrips.immediate") },
                { value: "scheduled", label: t("guestTrips.scheduled") },
              ]}
            />
            <SelectInput
              label={t("guestTrips.vehicleTier")}
              name="vehicleTier"
              value={userForm.vehicleTier}
              onChange={handleUserInput}
              options={[
                { value: "economy", label: t("guestTrips.economy") },
                { value: "comfort", label: t("guestTrips.comfort") },
                { value: "suv", label: t("guestTrips.suv") },
              ]}
            />
            <TextInput
              label={t("guestTrips.passengerCount")}
              name="passengerCount"
              type="number"
              min="1"
              value={userForm.passengerCount}
              onChange={handleUserInput}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includePetsUser"
              name="includePets"
              checked={userForm.includePets}
              onChange={handleUserInput}
              className="rounded border-slate-300"
            />
            <label htmlFor="includePetsUser" className="text-sm text-slate-700">
              {t("guestTrips.includePets")}
            </label>
          </div>
          <TextInput
            label={t("guestTrips.riderNotes")}
            name="riderNotes"
            value={userForm.riderNotes}
            onChange={handleUserInput}
            multiline
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? t("common.loading") : t("common.create")}
          </button>
        </form>
      )}
    </div>
  );
}

function TextInput({ label, multiline, ...props }) {
  const InputComponent = multiline ? "textarea" : "input";
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <InputComponent
        {...props}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </label>
  );
}

function SelectInput({ label, options, ...props }) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <select
        {...props}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

