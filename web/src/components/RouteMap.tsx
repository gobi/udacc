'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

interface PassInfo {
  lat: number;
  lng: number;
  elevation: number;
  distance_km: number;
}

interface RouteMapProps {
  rideId: string;
  getRoute: (id: string) => Promise<{ points: RoutePoint[]; passes?: PassInfo[] }>;
  meetingPoint?: MeetingPoint | null;
}

const RouteMapInner = dynamic(
  () => import('./RouteMapInner').then(mod => mod.RouteMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="text-secondary-500">Газрын зураг ачаалж байна...</div>
      </div>
    ),
  }
);

export function RouteMap({ rideId, getRoute, meetingPoint }: RouteMapProps) {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [passes, setPasses] = useState<PassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRoute(rideId)
      .then(data => {
        setPoints(data.points || []);
        setPasses(data.passes || []);
      })
      .catch(err => {
        setError(err.message || 'Маршрут ачаалахад алдаа гарлаа');
      })
      .finally(() => setLoading(false));
  }, [rideId, getRoute]);

  if (loading) {
    return (
      <div className="h-80 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <span className="text-secondary-500">Маршрут ачаалж байна...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="text-secondary-500">{error}</div>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-80 bg-secondary-100 rounded-xl flex items-center justify-center">
        <div className="text-secondary-500">Маршрут байхгүй байна</div>
      </div>
    );
  }

  return <RouteMapInner points={points} meetingPoint={meetingPoint} passes={passes} />;
}
