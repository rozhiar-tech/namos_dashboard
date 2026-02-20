"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import { Icon, latLngBounds } from "leaflet";

const driverIcon = new Icon({
  iconUrl: "/taxi-marker.png",
  iconSize: [28, 28],
});

function FitBounds({ drivers, adminLocation }) {
  const map = useMap();
  const positions = useMemo(
    () => {
      const all = drivers
        .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
        .map((d) => [d.lat, d.lng]);

      if (
        Number.isFinite(adminLocation?.lat) &&
        Number.isFinite(adminLocation?.lng)
      ) {
        all.push([adminLocation.lat, adminLocation.lng]);
      }

      return all;
    },
    [drivers, adminLocation]
  );

  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) {
      map.setView(positions[0], 11);
      return;
    }
    const bounds = latLngBounds(positions);
    map.fitBounds(bounds.pad(0.35), { maxZoom: 11 });
  }, [positions, map]);

  return null;
}

export default function MapComponent({ drivers = [], adminLocation = null }) {
  const center = Number.isFinite(adminLocation?.lat) && Number.isFinite(adminLocation?.lng)
    ? [adminLocation.lat, adminLocation.lng]
    : [36.2, 44.0];

  return (
    <MapContainer
      center={center}
      zoom={11}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <FitBounds drivers={drivers} adminLocation={adminLocation} />
      {Number.isFinite(adminLocation?.lat) && Number.isFinite(adminLocation?.lng) && (
        <CircleMarker
          center={[adminLocation.lat, adminLocation.lng]}
          radius={8}
          pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 0.8 }}
        >
          <Popup>
            <p className="font-semibold">Your location</p>
          </Popup>
        </CircleMarker>
      )}
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
