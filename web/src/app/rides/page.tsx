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
  draft: 'bg-secondary-100 text-secondary-600',
  published: 'bg-green-100 text-green-600',
  ongoing: 'bg-primary-100 text-primary-600',
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

  return (
    <div>
      {/* Page Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Аялалууд</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Бидэнтэй хамт аялалд гарч, шинэ найз нөхөд олоорой
          </p>
        </div>
      </section>

      {/* Filter & Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                filter === ''
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50 shadow'
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                filter === 'published'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50 shadow'
              }`}
            >
              Нээлттэй
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                filter === 'ongoing'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50 shadow'
              }`}
            >
              Явагдаж буй
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                filter === 'completed'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50 shadow'
              }`}
            >
              Дууссан
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-secondary-500 mt-4">Уншиж байна...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Аялал олдсонгүй</h3>
              <p className="text-secondary-500">Өөр шүүлтүүр сонгоно уу</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rides.map((ride) => (
                <Link
                  key={ride.id}
                  href={`/rides/${ride.id}`}
                  className="card card-hover group"
                >
                  <div className="h-40 gradient-primary relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white text-primary-500 px-3 py-1 rounded-full text-sm font-medium">
                        {ride.ride_type?.name}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ride.status]}`}>
                        {statusLabels[ride.status]}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-500 transition-colors mb-2">
                      {ride.title}
                    </h3>
                    <p className="text-secondary-500 text-sm mb-4 line-clamp-2">{ride.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-secondary-400 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {ride.distance_km} км
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +{ride.elevation_gain} м
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ride.participant_count}
                      </span>
                    </div>

                    {/* Date & Location */}
                    <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                      <div className="text-sm text-secondary-500">
                        {ride.start_time && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(ride.start_time).toLocaleDateString('mn-MN')}
                          </span>
                        )}
                      </div>
                      <span className="text-primary-500 font-medium text-sm">Дэлгэрэнгүй →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
