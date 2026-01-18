'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    total_distance_km: number;
    total_rides: number;
    is_ride_leader: boolean;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.users
      .leaderboard(50)
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-500 to-orange-600';
    return '';
  };

  return (
    <div>
      {/* Page Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Тэргүүлэгчид</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Хамгийн их зайг туулсан дугуйчид
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-secondary-500 mt-4">Уншиж байна...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Өгөгдөл олдсонгүй</h3>
              <p className="text-secondary-500">Аялал дуусахад тэргүүлэгчид харагдана</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* 2nd Place */}
                  <div className="card p-6 text-center mt-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${getMedalColor(2)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <span className="text-white text-2xl font-bold">2</span>
                    </div>
                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary-600 font-bold text-xl">
                        {leaderboard[1].user.first_name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1">
                      {leaderboard[1].user.last_name} {leaderboard[1].user.first_name}
                    </h3>
                    <div className="text-2xl font-bold text-primary-500">
                      {leaderboard[1].user.total_distance_km.toFixed(1)} км
                    </div>
                    <div className="text-sm text-secondary-500">{leaderboard[1].user.total_rides} аялал</div>
                  </div>

                  {/* 1st Place */}
                  <div className="card p-6 text-center bg-gradient-to-b from-primary-50 to-white border-2 border-primary-200">
                    <div className={`w-20 h-20 bg-gradient-to-br ${getMedalColor(1)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary-600 font-bold text-2xl">
                        {leaderboard[0].user.first_name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-secondary-900 mb-1">
                      {leaderboard[0].user.last_name} {leaderboard[0].user.first_name}
                    </h3>
                    {leaderboard[0].user.is_ride_leader && (
                      <span className="inline-block bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full mb-2">
                        Удирдагч
                      </span>
                    )}
                    <div className="text-3xl font-bold text-primary-500">
                      {leaderboard[0].user.total_distance_km.toFixed(1)} км
                    </div>
                    <div className="text-sm text-secondary-500">{leaderboard[0].user.total_rides} аялал</div>
                  </div>

                  {/* 3rd Place */}
                  <div className="card p-6 text-center mt-12">
                    <div className={`w-14 h-14 bg-gradient-to-br ${getMedalColor(3)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <span className="text-white text-xl font-bold">3</span>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary-600 font-bold text-lg">
                        {leaderboard[2].user.first_name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1">
                      {leaderboard[2].user.last_name} {leaderboard[2].user.first_name}
                    </h3>
                    <div className="text-xl font-bold text-primary-500">
                      {leaderboard[2].user.total_distance_km.toFixed(1)} км
                    </div>
                    <div className="text-sm text-secondary-500">{leaderboard[2].user.total_rides} аялал</div>
                  </div>
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="card overflow-hidden">
                <div className="bg-secondary-50 px-6 py-4 border-b">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-secondary-500">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Нэр</div>
                    <div className="col-span-3 text-right">Зай</div>
                    <div className="col-span-2 text-right">Аялал</div>
                  </div>
                </div>
                <div className="divide-y">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user.id}
                      className={`px-6 py-4 hover:bg-secondary-50 transition-colors ${
                        entry.rank <= 3 ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1">
                          {entry.rank <= 3 ? (
                            <div className={`w-8 h-8 bg-gradient-to-br ${getMedalColor(entry.rank)} rounded-full flex items-center justify-center shadow`}>
                              <span className="text-white text-sm font-bold">{entry.rank}</span>
                            </div>
                          ) : (
                            <span className="text-secondary-500 font-medium">{entry.rank}</span>
                          )}
                        </div>
                        <div className="col-span-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {entry.user.first_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-secondary-900">
                                {entry.user.last_name} {entry.user.first_name}
                              </span>
                              {entry.user.is_ride_leader && (
                                <span className="ml-2 bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                                  Удирдагч
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="font-bold text-primary-500 text-lg">
                            {entry.user.total_distance_km.toFixed(1)}
                          </span>
                          <span className="text-secondary-400 ml-1">км</span>
                        </div>
                        <div className="col-span-2 text-right text-secondary-500">
                          {entry.user.total_rides}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
