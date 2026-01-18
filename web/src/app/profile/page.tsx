'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    try {
      await api.auth.updateMe(formData);
      await refreshUser();
      setEditing(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-secondary-500 mt-4">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold">{user.first_name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {user.last_name} {user.first_name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {user.is_ride_leader && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    Удирдагч
                  </span>
                )}
                {user.is_admin && (
                  <span className="bg-red-500/80 px-3 py-1 rounded-full text-sm">
                    Админ
                  </span>
                )}
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 -mt-6 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-secondary-900">{user.total_distance_km.toFixed(1)}</div>
              <div className="text-secondary-500 text-sm">Нийт км</div>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-secondary-900">{user.total_rides}</div>
              <div className="text-secondary-500 text-sm">Аялал</div>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-secondary-900">{rides.length}</div>
              <div className="text-secondary-500 text-sm">Дуусгасан</div>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-secondary-900">
                {user.total_rides > 0 ? (user.total_distance_km / user.total_rides).toFixed(1) : 0}
              </div>
              <div className="text-secondary-500 text-sm">Дундаж км</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Хувийн мэдээлэл</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Засах
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Овог</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Нэр</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Утас</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_private"
                      checked={formData.is_private}
                      onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                      className="w-5 h-5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="is_private" className="text-sm text-secondary-700">
                      Нэрээ нуух (жишээ: Б***)
                    </label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex-1"
                    >
                      {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-secondary-100 text-secondary-600 py-3 rounded-full font-semibold hover:bg-secondary-200 transition-colors"
                    >
                      Цуцлах
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-secondary-500">Овог нэр</div>
                      <div className="font-medium text-secondary-900">{user.last_name} {user.first_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-secondary-500">Имэйл</div>
                      <div className="font-medium text-secondary-900">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-secondary-500">Утас</div>
                      <div className="font-medium text-secondary-900">{user.phone || '-'}</div>
                    </div>
                  </div>
                  {user.is_private && (
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Таны нэр нуугдсан байна
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rides History */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Миний аялалууд</h2>
                <Link href="/rides" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  Бүгдийг үзэх
                </Link>
              </div>

              {rides.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-secondary-500 mb-3">Дуусгасан аялал байхгүй</p>
                  <Link href="/rides" className="text-primary-500 hover:underline text-sm">
                    Аялалуудыг үзэх
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {rides.map((r, i) => (
                    <Link
                      key={i}
                      href={`/rides/${r.ride.id}`}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-secondary-900">{r.ride.title}</div>
                        <div className="text-sm text-secondary-500">
                          {new Date(r.ride.completed_at).toLocaleDateString('mn-MN')}
                        </div>
                      </div>
                      <div className="text-primary-500 font-bold">{r.final_distance_km.toFixed(1)} км</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
