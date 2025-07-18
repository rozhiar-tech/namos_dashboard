"use client";

import useSocket from "../../hooks/useSocket";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
});

export default function LiveMapPage() {
  const { driverLocations } = useSocket("http://localhost:3001"); // Change if hosted

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Live Driver Locations</h2>
      <MapComponent drivers={driverLocations} />
    </div>
  );
}
