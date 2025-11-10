"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const makeEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

export default function useSocket(url) {
  const socketRef = useRef(null);
  const [driverLocations, setDriverLocations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ["websocket"],
    });

    const addEvent = (type, payload) => {
      setEvents((prev) => {
        const entry = { id: makeEventId(), type, payload, ts: Date.now() };
        return [entry, ...prev].slice(0, 25);
      });
    };

    socketRef.current.on("connect", () => {
      addEvent("socket", { message: "Connected", sid: socketRef.current.id });
    });

    socketRef.current.on("disconnect", () => {
      addEvent("socket", { message: "Disconnected" });
    });

    socketRef.current.on("updateDriverLocation", (data) => {
      setDriverLocations((prev) => {
        const index = prev.findIndex((d) => d.driverId === data.driverId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      addEvent("location", data);
    });

    socketRef.current.on("trip_request", (payload) => {
      setTrips((prev) => {
        const exists = prev.find((trip) => trip.id === payload.id);
        if (exists) {
          return prev.map((trip) =>
            trip.id === payload.id ? { ...trip, ...payload } : trip
          );
        }
        return [payload, ...prev].slice(0, 10);
      });
      addEvent("trip", payload);
    });

    socketRef.current.on("driver_status", (payload) => addEvent("driver_status", payload));
    socketRef.current.on("session_event", (payload) => addEvent("session", payload));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url]);

  return { driverLocations, trips, events };
}
