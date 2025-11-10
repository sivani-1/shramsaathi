import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "./RouteMap.css";

// Custom icon for worker/viewer (blue)
const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Custom icon for owner (red)
const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const RouteMap = ({ origin = [17.385, 78.4867], destination, originInfo = null, destinationInfo = null, onClose }) => {
  const mapRef = useRef(null);
  const [originState, setOriginState] = useState(origin);

  // Keep originState in sync with the origin prop (which is set by WorkerDashboard using navigator.geolocation)
  useEffect(() => {
    setOriginState(origin);
  }, [origin]);

  // fit bounds to show both points when map and destination are available
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (destination) {
        const bounds = L.latLngBounds([originState, destination]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.setView(originState, 13);
      }
    } catch (e) {
      // ignore
    }
  }, [originState, destination]);

  const positions = destination ? [originState, destination] : [originState];

  return (
    <div className="route-map-shell">
      <div className="route-map-header">
        <button className="close-map" onClick={onClose}>Close</button>
      </div>
      <MapContainer
        whenCreated={(m) => (mapRef.current = m)}
        center={originState}
        zoom={13}
        className="route-map-container"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* origin (worker) - blue */}
        <Marker position={originState} icon={blueIcon}>
          <Popup>
            <strong>Worker</strong>
            <br />
            {originInfo && (
              <>
                {originInfo.area && <>{originInfo.area}<br /></>}
                {originInfo.colony && <>{originInfo.colony}<br /></>}
                {originInfo.state && <>{originInfo.state}<br /></>}
                {originInfo.pincode && <>PIN: {originInfo.pincode}<br /></>}
              </>
            )}
          </Popup>
        </Marker>

        {/* destination (owner) - red */}
        {destination && (
          <Marker position={destination} icon={redIcon}>
            <Popup>
              <strong>Owner / Destination</strong>
              <br />
              {destinationInfo && (
                <>
                  {destinationInfo.area && <>{destinationInfo.area}<br /></>}
                  {destinationInfo.colony && <>{destinationInfo.colony}<br /></>}
                  {destinationInfo.state && <>{destinationInfo.state}<br /></>}
                  {destinationInfo.pincode && <>PIN: {destinationInfo.pincode}<br /></>}
                </>
              )}
              <button onClick={() => {
                // open Google Maps directions from origin to destination
                const url = `https://www.google.com/maps/dir/?api=1&origin=${originState[0]},${originState[1]}&destination=${destination[0]},${destination[1]}`;
                window.open(url, "_blank");
              }}>Open Directions</button>
            </Popup>
          </Marker>
        )}

        {/* draw straight blue polyline between origin and destination (gives clear direction) */}
        {destination && <Polyline positions={positions} pathOptions={{ color: "#2563eb", weight: 5 }} />}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
