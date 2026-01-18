'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface UserRide {
  ride: {
    id: string;
    title: string;
    completed_at: string;
  };
  final_distance_km: number;
}

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<UserRide[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    last_name: '',
    first_name: '',
    phone: '',
    is_private: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        last_name: user.last_name,
        first_name: user.first_name,
        phone: user.phone || '',
        is_private: user.is_private,
      });
      api.users.getRides(user.id).then((data) => setRides(data.rides)).catch(console.error);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await api.auth.updateMe(formData);
      await refreshUser();
      setEditing(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading || !user) {
    return <div className="text-center py-12 text-gray-500">Уншиж байна...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">Миний профайл</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-primary-600 hover:underline text-sm"
            >
              Засах
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Овог</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Нэр</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Утас</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_private" className="text-sm text-gray-700">
                Мэдээллээ нуух (нэр "Б***" гэж харагдана)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Хадгалах
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Овог</div>
                <div className="font-medium">{user.last_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Нэр</div>
                <div className="font-medium">{user.first_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Имэйл</div>
                <div className="font-medium">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Утас</div>
                <div className="font-medium">{user.phone || '-'}</div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {user.total_distance_km.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Нийт км</div>
                </div>
                <div className="bg-primary-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-600">{user.total_rides}</div>
                  <div className="text-sm text-gray-500">Аялал</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {user.is_ride_leader && (
                <span className="bg-primary-100 text-primary-600 text-sm px-3 py-1 rounded-full">
                  Удирдагч
                </span>
              )}
              {user.is_admin && (
                <span className="bg-red-100 text-red-600 text-sm px-3 py-1 rounded-full">
                  Админ
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Миний аялалууд</h2>
        {rides.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Аялал байхгүй</p>
        ) : (
          <div className="space-y-2">
            {rides.map((r, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{r.ride.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(r.ride.completed_at).toLocaleDateString('mn-MN')}
                  </div>
                </div>
                <div className="text-primary-600 font-semibold">{r.final_distance_km.toFixed(1)} км</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
