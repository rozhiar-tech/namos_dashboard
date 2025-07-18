"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(url) {
  const socketRef = useRef();
  const [driverLocations, setDriverLocations] = useState([]);

  useEffect(() => {
    socketRef.current = io(url);

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current.id);
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
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [url]);

  return { driverLocations };
}
