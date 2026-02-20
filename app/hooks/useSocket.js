"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const makeEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDriver = (payload) => {
  const driverId = toFiniteNumber(payload?.driverId ?? payload?.id);
  const lat = toFiniteNumber(payload?.lat ?? payload?.latitude);
  const lng = toFiniteNumber(payload?.lng ?? payload?.longitude);

  if (!Number.isFinite(driverId) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  let status = payload?.status;
  if (!status && typeof payload?.isAvailable === "boolean") {
    status = payload.isAvailable ? "online" : "offline";
  }

  return {
    driverId,
    lat,
    lng,
    status: status ?? null,
    isAvailable:
      typeof payload?.isAvailable === "boolean" ? payload.isAvailable : undefined,
    updatedAt: payload?.updatedAt ?? new Date().toISOString(),
  };
};

const normalizeTrip = (payload) => {
  const id = toFiniteNumber(payload?.id ?? payload?.tripId);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    status: payload?.status ?? "requested",
    pickupLocation: payload?.pickupLocation ?? payload?.pickup ?? "Unknown pickup",
    dropoffLocation:
      payload?.dropoffLocation ?? payload?.dropoff ?? "Unknown dropoff",
    rideMode: payload?.rideMode ?? payload?.mode ?? "ride_now",
    assignedToDriver: toFiniteNumber(payload?.assignedToDriver),
  };
};

export default function useSocket(url, options = {}) {
  const { token = null, initialDrivers = [], initialTrips = [] } = options;
  const socketRef = useRef(null);
  const [driverLocations, setDriverLocations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const normalized = Array.isArray(initialDrivers)
      ? initialDrivers.map(normalizeDriver).filter(Boolean)
      : [];
    setDriverLocations(normalized);
  }, [initialDrivers]);

  useEffect(() => {
    const normalized = Array.isArray(initialTrips)
      ? initialTrips.map(normalizeTrip).filter(Boolean)
      : [];
    setTrips(normalized.slice(0, 20));
  }, [initialTrips]);

  useEffect(() => {
    if (!url || !token) {
      setConnected(false);
      setConnectionError(null);
      return undefined;
    }

    socketRef.current = io(url, {
      transports: ["websocket"],
      auth: { token },
    });

    const addEvent = (type, payload) => {
      setEvents((prev) => {
        const entry = { id: makeEventId(), type, payload, ts: Date.now() };
        return [entry, ...prev].slice(0, 25);
      });
    };

    const upsertDriver = (payload) => {
      const normalized = normalizeDriver(payload);
      if (!normalized) return;
      setDriverLocations((prev) => {
        const index = prev.findIndex((d) => d.driverId === normalized.driverId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...normalized };
          return updated;
        }
        return [...prev, normalized];
      });
      addEvent("location", normalized);
    };

    const upsertTrip = (payload) => {
      const normalized = normalizeTrip(payload);
      if (!normalized) return;
      setTrips((prev) => {
        const exists = prev.find((trip) => trip.id === normalized.id);
        if (exists) {
          return prev.map((trip) =>
            trip.id === normalized.id ? { ...trip, ...normalized } : trip
          );
        }
        return [normalized, ...prev].slice(0, 20);
      });
      addEvent("trip", normalized);
    };

    socketRef.current.on("connect", () => {
      setConnected(true);
      setConnectionError(null);
      addEvent("socket", { message: "Connected", sid: socketRef.current.id });
    });

    socketRef.current.on("disconnect", (reason) => {
      setConnected(false);
      addEvent("socket", { message: "Disconnected", reason });
    });

    socketRef.current.on("connect_error", (error) => {
      const message = error?.message ?? "Socket connection failed";
      setConnected(false);
      setConnectionError(message);
      addEvent("socket", { message: "Connection error", error: message });
    });

    // Legacy + normalized map events
    socketRef.current.on("updateDriverLocation", upsertDriver);
    socketRef.current.on("live_map:driver_location", upsertDriver);
    socketRef.current.on("trip_request", upsertTrip);
    socketRef.current.on("live_map:trip", upsertTrip);

    // Legacy + normalized status events
    socketRef.current.on("driver_status", (payload) => addEvent("driver_status", payload));
    socketRef.current.on("session_event", (payload) => addEvent("session", payload));
    socketRef.current.on("live_map:driver_status", (payload) =>
      addEvent("driver_status", payload)
    );
    socketRef.current.on("live_map:session", (payload) => addEvent("session", payload));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url, token]);

  return { driverLocations, trips, events, connected, connectionError };
}
