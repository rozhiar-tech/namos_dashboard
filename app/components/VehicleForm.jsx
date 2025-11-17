"use client";

import { useState } from "react";
import { apiRequest } from "../apiClient";
import useAuth from "../hooks/useAuth";

const EMPTY_FORM = {
  label: "",
  plateNumber: "",
  make: "",
  model: "",
  year: "",
  color: "",
  vin: "",
  seatCount: "",
  ownerId: "",
};

export default function VehicleForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        label: form.label.trim(),
        plateNumber: form.plateNumber.trim(),
        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        color: form.color.trim() || undefined,
        vin: form.vin.trim() || undefined,
        seatCount: form.seatCount ? Number(form.seatCount) : undefined,
      };
      if (isAdmin && form.ownerId) {
        payload.ownerId = Number(form.ownerId);
      }

      const response = await apiRequest("/vehicles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const createdVehicle = response?.vehicle ?? response ?? null;
      setMessage({ type: "success", text: "Vehicle created successfully." });
      setForm(EMPTY_FORM);
      onCreated?.(createdVehicle);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message ?? "Unable to create vehicle.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Label"
          name="label"
          value={form.label}
          onChange={onChange}
          required
        />
        <TextInput
          label="Plate number"
          name="plateNumber"
          value={form.plateNumber}
          onChange={onChange}
          required
        />
        <TextInput
          label="Make"
          name="make"
          value={form.make}
          onChange={onChange}
        />
        <TextInput
          label="Model"
          name="model"
          value={form.model}
          onChange={onChange}
        />
        <TextInput
          label="Year"
          name="year"
          type="number"
          value={form.year}
          onChange={onChange}
          min="1990"
        />
        <TextInput
          label="Color"
          name="color"
          value={form.color}
          onChange={onChange}
        />
        <TextInput
          label="VIN"
          name="vin"
          value={form.vin}
          onChange={onChange}
        />
        <TextInput
          label="Seat count"
          name="seatCount"
          type="number"
          value={form.seatCount}
          onChange={onChange}
          min="1"
          max="16"
        />
        {isAdmin && (
          <TextInput
            label="Owner ID"
            name="ownerId"
            type="number"
            value={form.ownerId}
            onChange={onChange}
            placeholder="Required when creating on behalf of an owner"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create vehicle"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-white/60"
        >
          Cancel
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
