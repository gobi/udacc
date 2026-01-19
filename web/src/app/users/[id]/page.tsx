'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_distance_km: number;
  total_rides: number;
  is_ride_leader: boolean;
  is_admin: boolean;
  created_at: string;
}

interface RideInfo {
  id: string;
  title: string;
  distance_km: number;
  status: string;
  start_time: string;
  ride_type: { name: string };
}

interface UserRide {
  ride: RideInfo;
  final_distance_km: number;
  attended: boolean;
}

const statusLabels: Record<string, string> = {
  draft: 'Ноорог',
  published: 'Нээлттэй',
  ongoing: 'Явагдаж буй',
  completed: 'Дууссан',
  cancelled: 'Цуцалсан',
};

const statusColors: Record<string, string> = {
  draft: 'bg-secondary-100 text-secondary-600',
  published: 'bg-green-100 text-green-600',
  ongoing: 'bg-primary-100 text-primary-600',
  completed: 'bg-purple-100 text-purple-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function UserProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<UserRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, ridesData] = await Promise.all([
          api.users.get(params.id as string),
          api.users.getRides(params.id as string),
        ]);
        setUser(userData);
        setRides(ridesData.rides || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-secondary-500 mt-4">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">Хэрэглэгч олдсонгүй</h3>
          <Link href="/leaderboard" className="text-primary-500 hover:underline">Тэргүүлэгчид руу буцах</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/leaderboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Тэргүүлэгчид руу буцах
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold">{user.first_name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {user.last_name} {user.first_name}
              </h1>
              <div className="flex items-center gap-3">
                {user.is_ride_leader && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    Удирдагч
                  </span>
                )}
                {user.is_admin && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    Админ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stats */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Статистик</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="text-secondary-600">Нийт зай</span>
                    </div>
                    <span className="text-2xl font-bold text-primary-500">{user.total_distance_km.toFixed(1)} км</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-secondary-600">Нийт аялал</span>
                    </div>
                    <span className="text-2xl font-bold text-secondary-700">{user.total_rides}</span>
                  </div>
                  {user.total_rides > 0 && (
                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-secondary-600">Дундаж</span>
                      </div>
                      <span className="text-2xl font-bold text-secondary-700">
                        {(user.total_distance_km / user.total_rides).toFixed(1)} км
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rides List */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900">Аялалууд</h3>
                  <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                    {rides.length} аялал
                  </span>
                </div>
                {rides.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-secondary-500">Аялал байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rides.map((item) => (
                      <Link
                        key={item.ride.id}
                        href={`/rides/${item.ride.id}`}
                        className="block p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-secondary-900">{item.ride.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.ride.status]}`}>
                                {statusLabels[item.ride.status]}
                              </span>
                            </div>
                            <div className="text-sm text-secondary-500">
                              {item.ride.ride_type?.name} • {item.ride.start_time ? new Date(item.ride.start_time).toLocaleDateString('mn-MN') : '-'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-500">
                              {item.final_distance_km || item.ride.distance_km} км
                            </div>
                            {item.attended && (
                              <span className="text-xs text-green-600">Ирсэн</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
