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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Уншиж байна...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тэргүүлэгчид</h1>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Өгөгдөл олдсонгүй</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Нэр</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Км</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Аялал</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.map((entry) => (
                <tr key={entry.user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {entry.rank <= 3 ? (
                      <span className={`text-xl ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        'text-amber-600'
                      }`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-500">{entry.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {entry.user.last_name} {entry.user.first_name}
                      </span>
                      {entry.user.is_ride_leader && (
                        <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded">
                          Удирдагч
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary-600">
                    {entry.user.total_distance_km.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {entry.user.total_rides}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
