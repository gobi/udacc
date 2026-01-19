'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface MeetingPointPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import('./MapPicker').then(mod => mod.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="text-secondary-500">Газрын зураг ачаалж байна...</div>
      </div>
    ),
  }
);

export function MeetingPointPicker({ lat, lng, onChange }: MeetingPointPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="text-secondary-500">Газрын зураг ачаалж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MapComponent lat={lat} lng={lng} onChange={onChange} />
      {lat && lng && (
        <p className="text-xs text-secondary-500">
          Координат: {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
