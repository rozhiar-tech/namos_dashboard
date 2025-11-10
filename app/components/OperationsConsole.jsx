"use client";

import { useState } from "react";
import { apiRequest } from "../apiClient";

function TextField({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </label>
  );
}

export default function OperationsConsole() {
  const [forcePayload, setForcePayload] = useState({ driverId: "", reason: "" });
  const [broadcastPayload, setBroadcastPayload] = useState({ title: "", message: "" });
  const [sessionPayload, setSessionPayload] = useState({ driverId: "", vehicleId: "" });
  const [status, setStatus] = useState(null);

  const runAction = async (handler) => {
    setStatus({ type: "info", text: "Saving…" });
    try {
      await handler();
      setStatus({ type: "success", text: "Action queued" });
    } catch (error) {
      setStatus({ type: "error", text: error.message ?? "Request failed" });
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-sm backdrop-blur">
        <p className="text-base font-semibold text-slate-900">Force driver offline</p>
        <p className="text-xs text-slate-500 mb-4">
          Immediately ends the current session of a driver + frees the vehicle.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await runAction(() =>
              apiRequest("/admin/driver/force-offline", {
                method: "POST",
                body: JSON.stringify({
                  driverId: Number(forcePayload.driverId),
                  reason: forcePayload.reason,
                }),
              })
            );
            setForcePayload({ driverId: "", reason: "" });
          }}
        >
          <TextField
            label="Driver ID"
            name="driverId"
            value={forcePayload.driverId}
            onChange={(e) =>
              setForcePayload((prev) => ({ ...prev, driverId: e.target.value }))
            }
            placeholder="#51"
          />
          <TextField
            label="Reason"
            name="reason"
            value={forcePayload.reason}
            onChange={(e) =>
              setForcePayload((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Safety check"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Force offline
          </button>
        </form>
      </article>

      <article className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-sm backdrop-blur">
        <p className="text-base font-semibold text-slate-900">Create live session</p>
        <p className="text-xs text-slate-500 mb-4">
          Pair a driver with a vehicle so they can go online for the shift.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await runAction(() =>
              apiRequest("/admin/sessions", {
                method: "POST",
                body: JSON.stringify({
                  driverId: Number(sessionPayload.driverId),
                  vehicleId: Number(sessionPayload.vehicleId),
                }),
              })
            );
            setSessionPayload({ driverId: "", vehicleId: "" });
          }}
        >
          <TextField
            label="Driver ID"
            name="driverId"
            value={sessionPayload.driverId}
            onChange={(e) =>
              setSessionPayload((prev) => ({ ...prev, driverId: e.target.value }))
            }
            placeholder="#12"
          />
          <TextField
            label="Vehicle ID"
            name="vehicleId"
            value={sessionPayload.vehicleId}
            onChange={(e) =>
              setSessionPayload((prev) => ({ ...prev, vehicleId: e.target.value }))
            }
            placeholder="#3 (camry)"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Start shift
          </button>
        </form>
      </article>

      <article className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-sm backdrop-blur">
        <p className="text-base font-semibold text-slate-900">Broadcast to drivers</p>
        <p className="text-xs text-slate-500 mb-4">
          Sends an in-app notice and push notification to every active driver.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await runAction(() =>
              apiRequest("/admin/broadcast", {
                method: "POST",
                body: JSON.stringify(broadcastPayload),
              })
            );
            setBroadcastPayload({ title: "", message: "" });
          }}
        >
          <TextField
            label="Title"
            name="title"
            value={broadcastPayload.title}
            onChange={(e) =>
              setBroadcastPayload((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="High demand alert"
          />
          <TextField
            label="Message"
            name="message"
            value={broadcastPayload.message}
            onChange={(e) =>
              setBroadcastPayload((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="Airport pickups only"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Send broadcast
          </button>
        </form>
      </article>

      {status && (
        <p
          className={`text-xs font-semibold ${
            status.type === "error"
              ? "text-rose-600"
              : status.type === "success"
              ? "text-emerald-600"
              : "text-slate-500"
          } lg:col-span-3`}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
