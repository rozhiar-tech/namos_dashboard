"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { Icon, latLngBounds } from "leaflet";

const driverIcon = new Icon({
  iconUrl: "/taxi-marker.png",
  iconSize: [28, 28],
});

function FitBounds({ drivers }) {
  const map = useMap();
  const positions = useMemo(
    () =>
      drivers
        .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
        .map((d) => [d.lat, d.lng]),
    [drivers]
  );

  useEffect(() => {
    if (!positions.length) return;
    const bounds = latLngBounds(positions);
    map.fitBounds(bounds.pad(0.2));
  }, [positions, map]);

  return null;
}

export default function MapComponent({ drivers = [] }) {
  return (
    <MapContainer
      center={[36.2, 44.0]}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <FitBounds drivers={drivers} />
      {drivers.map((driver) => (
        <Marker
          key={driver.driverId}
          position={[driver.lat, driver.lng]}
          icon={driverIcon}
        >
          <Popup>
            <p className="font-semibold">Driver #{driver.driverId}</p>
            <p className="text-xs text-slate-500">
              Lat {driver.lat?.toFixed(4)} · Lng {driver.lng?.toFixed(4)}
            </p>
            {driver.status && (
              <p className="text-xs mt-1 capitalize">Status: {driver.status}</p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
