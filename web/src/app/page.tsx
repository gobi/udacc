'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Stats {
  total_users: number;
  total_ride_leaders: number;
  total_distance_km: number;
  total_rides: number;
  completed_rides: number;
}

interface Ride {
  id: string;
  title: string;
  description: string;
  ride_type: { name: string };
  distance_km: number;
  start_time: string;
  status: string;
  participant_count: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([]);

  useEffect(() => {
    api.users.statistics().then(setStats).catch(console.error);
    api.rides.list({ status: 'published', limit: 3 }).then(data => setUpcomingRides(data.rides)).catch(console.error);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <span className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              Монголын дугуйчдын нэгдсэн клуб
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Хамтдаа аялж,<br />
              <span className="text-primary-200">эрүүл амьдарцгаая</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              UDA Cycling Club нь дугуйн спортыг хөгжүүлэх, байгаль орчныг хамгаалах,
              эрүүл амьдралын хэв маягийг түгээн дэлгэрүүлэх зорилготой.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn-primary bg-white text-primary-500 hover:bg-gray-100">
                Гишүүн болох
              </Link>
              <Link href="/rides" className="btn-outline">
                Аялалууд үзэх
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 -mt-8 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="card p-6 md:p-8 text-center card-hover">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-secondary-900">{stats.total_users}</div>
                <div className="text-secondary-500 mt-1">Гишүүд</div>
              </div>

              <div className="card p-6 md:p-8 text-center card-hover">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-secondary-900">{stats.completed_rides}</div>
                <div className="text-secondary-500 mt-1">Аялал</div>
              </div>

              <div className="card p-6 md:p-8 text-center card-hover">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-secondary-900">{Math.round(stats.total_distance_km).toLocaleString()}</div>
                <div className="text-secondary-500 mt-1">Нийт км</div>
              </div>

              <div className="card p-6 md:p-8 text-center card-hover">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-secondary-900">{stats.total_ride_leaders}</div>
                <div className="text-secondary-500 mt-1">Удирдагч</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Rides Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Удахгүй болох аялалууд</h2>
            <p className="section-subtitle mx-auto">
              Бидэнтэй хамт аялалд гарч, шинэ найз нөхөд олоорой
            </p>
          </div>

          {upcomingRides.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingRides.map((ride) => (
                <Link key={ride.id} href={`/rides/${ride.id}`} className="card card-hover group">
                  <div className="h-48 gradient-primary relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-primary-500 px-3 py-1 rounded-full text-sm font-medium">
                        {ride.ride_type?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-500 transition-colors mb-2">
                      {ride.title}
                    </h3>
                    <p className="text-secondary-500 text-sm mb-4 line-clamp-2">{ride.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-secondary-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {ride.distance_km} км
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {ride.participant_count}
                        </span>
                      </div>
                      <span className="text-primary-500 font-medium">Дэлгэрэнгүй →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-secondary-500">
              Одоогоор нээлттэй аялал байхгүй байна
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/rides" className="btn-secondary">
              Бүх аялалууд үзэх
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Бидэнтэй нэгдээрэй
          </h2>
          <p className="text-xl text-secondary-300 mb-8 max-w-2xl mx-auto">
            UDA Cycling Club-д нэгдэж, Монголын хамгийн том дугуйчдын нийгэмлэгийн гишүүн болоорой
          </p>
          <Link href="/auth/register" className="btn-primary">
            Одоо бүртгүүлэх
          </Link>
        </div>
      </section>
    </div>
  );
}
