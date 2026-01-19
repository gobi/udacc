'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-arrowheads';

// Fix for default marker icons
const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const meetingIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
}

interface MeetingPoint {
  lat: number;
  lng: number;
  name: string;
}

interface RouteMapInnerProps {
  points: RoutePoint[];
  meetingPoint?: MeetingPoint | null;
}

// Component to fit map bounds
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bounds]);

  return null;
}

// Component to render polyline with arrows
function ArrowPolyline({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    const polyline = L.polyline(positions, {
      color: '#4F46E5',
      weight: 4,
      opacity: 0.8,
    });

    // Add arrowheads
    (polyline as any).arrowheads({
      frequency: '100px',
      size: '12px',
      fill: true,
      color: '#4F46E5',
    });

    polyline.addTo(map);

    return () => {
      map.removeLayer(polyline);
    };
  }, [map, positions]);

  return null;
}

export function RouteMapInner({ points, meetingPoint }: RouteMapInnerProps) {
  const { center, bounds, positions } = useMemo(() => {
    if (points.length === 0) {
      return {
        center: [47.9187, 106.9176] as [number, number],
        bounds: null,
        positions: [],
      };
    }

    const positions: [number, number][] = points.map(p => [p.lat, p.lng]);

    // Calculate bounds including meeting point
    let minLat = points[0].lat;
    let maxLat = points[0].lat;
    let minLng = points[0].lng;
    let maxLng = points[0].lng;

    for (const p of points) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    // Include meeting point in bounds
    if (meetingPoint) {
      if (meetingPoint.lat < minLat) minLat = meetingPoint.lat;
      if (meetingPoint.lat > maxLat) maxLat = meetingPoint.lat;
      if (meetingPoint.lng < minLng) minLng = meetingPoint.lng;
      if (meetingPoint.lng > maxLng) maxLng = meetingPoint.lng;
    }

    const center: [number, number] = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    const bounds: [[number, number], [number, number]] = [[minLat, minLng], [maxLat, maxLng]];

    return { center, bounds, positions };
  }, [points, meetingPoint]);

  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return (
    <div className="h-80 rounded-xl overflow-hidden border border-secondary-200">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to show entire route */}
        {bounds && <FitBounds bounds={bounds} />}

        {/* Route polyline with direction arrows */}
        <ArrowPolyline positions={positions} />

        {/* Start marker */}
        {startPoint && (
          <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
            <Popup>
              <div className="text-center">
                <strong>Эхлэх цэг</strong>
                <br />
                Өндөр: {startPoint.ele.toFixed(0)}м
              </div>
            </Popup>
          </Marker>
        )}

        {/* End marker */}
        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
            <Popup>
              <div className="text-center">
                <strong>Төгсөх цэг</strong>
                <br />
                Өндөр: {endPoint.ele.toFixed(0)}м
              </div>
            </Popup>
          </Marker>
        )}

        {/* Meeting point marker */}
        {meetingPoint && (
          <Marker position={[meetingPoint.lat, meetingPoint.lng]} icon={meetingIcon}>
            <Popup>
              <div className="text-center">
                <strong>Уулзах газар</strong>
                <br />
                {meetingPoint.name}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
