import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { Point } from '@oneattend/core';
function Events({ onPick }: { onPick: (point: Point) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}
function Move({ centre }: { centre: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (centre) map.flyTo([centre.lat, centre.lon], 18);
  }, [centre, map]);
  return null;
}
export default function MapPicker({
  point,
  onPick,
  centre,
}: {
  point: Point | null;
  onPick: (p: Point) => void;
  centre: Point | null;
}) {
  return (
    <MapContainer center={[25.535, 84.851]} zoom={16} className="map" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Events onPick={onPick} />
      <Move centre={centre} />
      {point && (
        <>
          <Circle
            center={[point.lat, point.lon]}
            radius={50}
            pathOptions={{ color: '#668def', fillOpacity: 0.16 }}
          />
          <CircleMarker
            center={[point.lat, point.lon]}
            radius={6}
            pathOptions={{ color: '#fff', fillColor: '#668def', fillOpacity: 1 }}
          />
        </>
      )}
    </MapContainer>
  );
}
