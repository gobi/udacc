'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats {
  total_users: number;
  total_ride_leaders: number;
  total_distance_km: number;
  total_rides: number;
  completed_rides: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.users.statistics().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UDA Cycling Club
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Дугуйн клубын удирдлагын систем
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/rides"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Аялалууд үзэх
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 font-medium"
          >
            Тэргүүлэгчид
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.total_users}</div>
            <div className="text-gray-500 mt-1">Гишүүд</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.completed_rides}</div>
            <div className="text-gray-500 mt-1">Аялал</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.total_distance_km.toFixed(0)}</div>
            <div className="text-gray-500 mt-1">Нийт км</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.total_ride_leaders}</div>
            <div className="text-gray-500 mt-1">Удирдагч</div>
          </div>
        </div>
      )}
    </div>
  );
}
