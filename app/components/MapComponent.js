"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

const driverIcon = new Icon({
  iconUrl: "/taxi-marker.png", // Add custom marker in /public
  iconSize: [30, 30],
});

export default function MapComponent({ drivers }) {
  return (
    <MapContainer
      center={[36.2, 44.0]} // Default center
      zoom={13}
      scrollWheelZoom={true}
      className="h-[500px] w-full rounded shadow"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {drivers.map((driver) => (
        <Marker
          key={driver.driverId}
          position={[driver.lat, driver.lng]}
          icon={driverIcon}
        >
          <Popup>
            Driver #{driver.driverId}
            <br />
            Lat: {driver.lat}, Lng: {driver.lng}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
