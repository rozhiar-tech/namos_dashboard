"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import useTranslation from "../hooks/useTranslation";

const libraries = ["places"];

const defaultCenter = {
  lat: 62.500414,
  lng: 17.341003, // Timrå, Sweden
};

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function LocationPicker({
  label,
  value,
  coordinates,
  onLocationChange,
  required = false,
}) {
  const { t } = useTranslation();
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(
    coordinates || defaultCenter,
  );
  const [address, setAddress] = useState(value || "");
  const autocompleteRef = useRef(null);

  // Update selected location when coordinates prop changes
  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      setSelectedLocation(coordinates);
    }
  }, [coordinates]);

  // Update address when value prop changes
  useEffect(() => {
    if (value) {
      setAddress(value);
    }
  }, [value]);

  const onMapClick = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newLocation = { lat, lng };

      setSelectedLocation(newLocation);

      // Reverse geocode to get address
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            const addressText = results[0].formatted_address;
            setAddress(addressText);
            onLocationChange({
              location: addressText,
              lat,
              lng,
            });
          } else {
            // Fallback to coordinates if geocoding fails
            const coordsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setAddress(coordsText);
            onLocationChange({
              location: coordsText,
              lat,
              lng,
            });
          }
        });
      }
    },
    [onLocationChange],
  );

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const addressText = place.formatted_address || place.name;
        const newLocation = { lat, lng };

        setSelectedLocation(newLocation);
        setAddress(addressText);

        // Center map on selected place
        if (map) {
          map.panTo(newLocation);
          map.setZoom(15);
        }

        onLocationChange({
          location: addressText,
          lat,
          lng,
        });
      }
    }
  }, [map, onLocationChange]);

  const handleManualAddressChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    // Don't trigger location change on manual input - wait for autocomplete selection
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
        Google Maps API key is not configured. Please set
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable in your Netlify
        settings.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-500 tracking-wide">
        {label}
      </label>
      <div className="relative rounded-xl border border-slate-200 overflow-hidden">
        <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
          {/* Search box overlay on map */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: "se" }, // Restrict to Timrå,Sweden
              }}
            >
              <input
                type="text"
                value={address}
                onChange={handleManualAddressChange}
                placeholder={
                  t("guestTrips.searchLocation") || "Search location..."
                }
                className="w-full rounded-xl border border-slate-300 bg-white shadow-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-400"
                required={required}
              />
            </Autocomplete>
          </div>

          {/* Map */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={selectedLocation}
            zoom={selectedLocation === defaultCenter ? 10 : 15}
            onClick={onMapClick}
            onLoad={setMap}
            options={defaultOptions}
          >
            {selectedLocation && <Marker position={selectedLocation} />}
          </GoogleMap>
        </LoadScript>
      </div>
      {(coordinates ||
        (selectedLocation && selectedLocation !== defaultCenter)) && (
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>
            Coordinates: {selectedLocation.lat?.toFixed(6)},{" "}
            {selectedLocation.lng?.toFixed(6)}
          </span>
          {address && (
            <span
              className="text-slate-400 truncate ml-4 max-w-md"
              title={address}
            >
              {address}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
