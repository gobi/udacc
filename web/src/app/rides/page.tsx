'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Ride {
  id: string;
  title: string;
  description: string;
  ride_type: { name: string };
  distance_km: number;
  elevation_gain: number;
  start_time: string;
  meeting_point_name: string;
  status: string;
  participant_count: number;
  created_by: { first_name: string; last_name: string };
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-600',
  ongoing: 'bg-blue-100 text-blue-600',
  completed: 'bg-purple-100 text-purple-600',
  cancelled: 'bg-red-100 text-red-600',
};

const statusLabels: Record<string, string> = {
  draft: 'Ноорог',
  published: 'Нээлттэй',
  ongoing: 'Явагдаж буй',
  completed: 'Дууссан',
  cancelled: 'Цуцалсан',
};

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.rides
      .list({ status: filter || undefined })
      .then((data) => setRides(data.rides))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Уншиж байна...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Аялалууд</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">Бүгд</option>
          <option value="published">Нээлттэй</option>
          <option value="ongoing">Явагдаж буй</option>
          <option value="completed">Дууссан</option>
        </select>
      </div>

      {rides.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Аялал олдсонгүй</div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Link
              key={ride.id}
              href={`/rides/${ride.id}`}
              className="block bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold">{ride.title}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ride.status]}`}>
                      {statusLabels[ride.status]}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{ride.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{ride.ride_type?.name}</span>
                    <span>{ride.distance_km} км</span>
                    <span>+{ride.elevation_gain} м</span>
                    <span>{ride.participant_count} оролцогч</span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {ride.start_time && (
                    <div>{new Date(ride.start_time).toLocaleDateString('mn-MN')}</div>
                  )}
                  <div>{ride.meeting_point_name}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
