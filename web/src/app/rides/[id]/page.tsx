'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RouteMap } from '@/components/RouteMap';

interface Participant {
  id: string;
  user: { id: string; first_name: string; last_name: string };
  attended: boolean;
  completed: boolean;
  actual_distance_km: number | null;
  final_distance_km: number;
}

interface Ride {
  id: string;
  title: string;
  description: string;
  ride_type: { name: string };
  distance_km: number;
  elevation_gain: number;
  max_gradient: number;
  max_descent: number;
  pass_count: number;
  start_time: string;
  meeting_point_name: string;
  meeting_point_lat: number;
  meeting_point_lng: number;
  status: string;
  bonus_percentage: number;
  participant_count: number;
  created_by: { id: string; first_name: string; last_name: string };
  leader?: { id: string; first_name: string; last_name: string };
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

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [editDistance, setEditDistance] = useState<string>('');

  const loadData = async () => {
    try {
      const [rideData, participantsData] = await Promise.all([
        api.rides.get(params.id as string),
        api.rides.participants(params.id as string),
      ]);
      setRide(rideData);
      setParticipants(participantsData.participants);
      if (user) {
        setIsRegistered(participantsData.participants.some((p: Participant) => p.user.id === user.id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setActionLoading(true);
    try {
      await api.rides.register(ride!.id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    setActionLoading(true);
    try {
      await api.rides.unregister(ride!.id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">Аялал олдсонгүй</h3>
          <Link href="/rides" className="text-primary-500 hover:underline">Аялалууд руу буцах</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/rides" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Аялалууд руу буцах
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white text-primary-500 px-3 py-1 rounded-full text-sm font-medium">
                  {ride.ride_type?.name}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ride.status]}`}>
                  {statusLabels[ride.status]}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{ride.title}</h1>
              <p className="text-white/80 text-lg max-w-2xl">{ride.description}</p>
            </div>
            {ride.bonus_percentage > 0 && (
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold">+{ride.bonus_percentage}%</div>
                <div className="text-sm text-white/80">Бонус</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">{ride.distance_km}</div>
                  <div className="text-secondary-500 text-sm">км</div>
                </div>
                <div className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">+{ride.elevation_gain}</div>
                  <div className="text-secondary-500 text-sm">өндөр авалт (м)</div>
                </div>
                <div className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">{ride.max_gradient}%</div>
                  <div className="text-secondary-500 text-sm">их өгсөлт</div>
                </div>
                <div className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">{ride.max_descent}%</div>
                  <div className="text-secondary-500 text-sm">их уруудалт</div>
                </div>
                <div className="card p-5 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">{ride.pass_count}</div>
                  <div className="text-secondary-500 text-sm">даваа</div>
                </div>
              </div>

              {/* Route Map */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-4">Маршрут</h2>
                <RouteMap
                  rideId={ride.id}
                  getRoute={api.rides.getRoute}
                  meetingPoint={
                    ride.meeting_point_lat && ride.meeting_point_lng
                      ? {
                          lat: ride.meeting_point_lat,
                          lng: ride.meeting_point_lng,
                          name: ride.meeting_point_name || 'Уулзах газар',
                        }
                      : null
                  }
                />
              </div>

              {/* Participants */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Оролцогчид
                  </h2>
                  <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
                    {participants.length} хүн
                  </span>
                </div>
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-secondary-500">Оролцогч байхгүй байна</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((p) => {
                      const canManageParticipant = (ride.status === 'ongoing' || ride.status === 'completed') && user &&
                        (user.id === ride.created_by?.id || user.id === ride.leader?.id || user.is_admin);
                      const isEditing = editingParticipant === p.id;

                      return (
                        <div
                          key={p.id}
                          className="p-3 bg-secondary-50 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {canManageParticipant ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.rides.updateParticipant(ride.id, p.id, { attended: !p.attended });
                                      loadData();
                                    } catch (error: any) {
                                      alert(error.message);
                                    }
                                  }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    p.attended
                                      ? 'bg-green-500 text-white hover:bg-green-600'
                                      : 'bg-secondary-200 text-secondary-500 hover:bg-green-100 hover:text-green-600'
                                  }`}
                                  title={p.attended ? 'Ирээгүй болгох' : 'Ирсэн болгох'}
                                >
                                  {p.attended ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-sm font-semibold">{p.user.first_name.charAt(0)}</span>
                                  )}
                                </button>
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  p.attended ? 'bg-green-500 text-white' : 'bg-primary-100'
                                }`}>
                                  {p.attended ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-primary-600 font-semibold">
                                      {p.user.first_name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                              )}
                              <span className="font-medium text-secondary-900">
                                {p.user.last_name} {p.user.first_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.attended && !p.actual_distance_km && (
                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                                  Ирсэн
                                </span>
                              )}
                              {p.actual_distance_km && (
                                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                                  {p.actual_distance_km} км
                                </span>
                              )}
                              {p.final_distance_km > 0 && !p.actual_distance_km && ride.status === 'completed' && (
                                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                                  {p.final_distance_km} км
                                </span>
                              )}
                              {canManageParticipant && p.attended && (
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingParticipant(null);
                                      setEditDistance('');
                                    } else {
                                      setEditingParticipant(p.id);
                                      setEditDistance(p.actual_distance_km?.toString() || '');
                                    }
                                  }}
                                  className="text-secondary-400 hover:text-secondary-600 p-1"
                                  title="Явсан км засах"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Distance edit form */}
                          {isEditing && (
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="number"
                                value={editDistance}
                                onChange={(e) => setEditDistance(e.target.value)}
                                placeholder={`${ride.distance_km} км`}
                                className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              <span className="text-secondary-500 text-sm">км</span>
                              <button
                                onClick={async () => {
                                  try {
                                    const distance = editDistance ? parseFloat(editDistance) : null;
                                    await api.rides.updateParticipant(ride.id, p.id, {
                                      actual_distance_km: distance || undefined,
                                    });
                                    setEditingParticipant(null);
                                    setEditDistance('');
                                    loadData();
                                  } catch (error: any) {
                                    alert(error.message);
                                  }
                                }}
                                className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
                              >
                                Хадгалах
                              </button>
                              <button
                                onClick={() => {
                                  setEditingParticipant(null);
                                  setEditDistance('');
                                }}
                                className="px-3 py-2 bg-secondary-200 text-secondary-600 rounded-lg text-sm hover:bg-secondary-300"
                              >
                                Болих
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Дэлгэрэнгүй мэдээлэл</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-secondary-500">Эхлэх цаг</div>
                      <div className="font-medium text-secondary-900">
                        {ride.start_time ? new Date(ride.start_time).toLocaleString('mn-MN') : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-secondary-500">Уулзах газар</div>
                      <div className="font-medium text-secondary-900">{ride.meeting_point_name || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-secondary-500">Үүсгэсэн</div>
                      <div className="font-medium text-secondary-900">
                        {ride.created_by?.last_name} {ride.created_by?.first_name}
                      </div>
                    </div>
                  </div>
                  {ride.leader && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-secondary-500">Удирдагч</div>
                        <div className="font-medium text-secondary-900">
                          {ride.leader.last_name} {ride.leader.first_name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Actions for Draft */}
              {ride.status === 'draft' && user && (user.id === ride.created_by?.id || user.is_admin) && (
                <div className="card p-6 space-y-3">
                  <button
                    onClick={async () => {
                      setActionLoading(true);
                      try {
                        await api.rides.publish(ride.id);
                        loadData();
                      } catch (error: any) {
                        alert(error.message);
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className="btn-primary w-full"
                  >
                    {actionLoading ? 'Түр хүлээнэ үү...' : 'Нийтлэх'}
                  </button>
                  <Link
                    href={`/rides/${ride.id}/edit`}
                    className="block w-full bg-secondary-100 text-secondary-600 py-3 rounded-full font-semibold hover:bg-secondary-200 transition-colors text-center"
                  >
                    Засах
                  </Link>
                </div>
              )}

              {/* Action Buttons for Published Rides */}
              {ride.status === 'published' && (
                <div className="card p-6 space-y-3">
                  {/* Start Ride Button - for creator/leader */}
                  {user && (user.id === ride.created_by?.id || user.id === ride.leader?.id || user.is_admin) && (
                    <button
                      onClick={async () => {
                        if (!confirm('Аялалыг эхлүүлэх үү?')) return;
                        setActionLoading(true);
                        try {
                          await api.rides.start(ride.id);
                          loadData();
                        } catch (error: any) {
                          alert(error.message);
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="btn-primary w-full"
                    >
                      {actionLoading ? 'Түр хүлээнэ үү...' : 'Аялалыг эхлүүлэх'}
                    </button>
                  )}
                  {/* Register/Unregister */}
                  {isRegistered ? (
                    <button
                      onClick={handleUnregister}
                      disabled={actionLoading}
                      className="w-full bg-red-100 text-red-600 py-4 rounded-full font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Түр хүлээнэ үү...' : 'Бүртгэлээ цуцлах'}
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={actionLoading}
                      className="w-full bg-secondary-100 text-secondary-700 py-4 rounded-full font-semibold hover:bg-secondary-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}
                    </button>
                  )}
                  {!user && (
                    <p className="text-center text-secondary-500 text-sm mt-3">
                      Бүртгүүлэхийн тулд{' '}
                      <Link href="/auth/login" className="text-primary-500 hover:underline">
                        нэвтэрнэ үү
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {/* Ongoing Ride Actions */}
              {ride.status === 'ongoing' && user && (user.id === ride.created_by?.id || user.id === ride.leader?.id || user.is_admin) && (
                <div className="card p-6 space-y-3">
                  <button
                    onClick={async () => {
                      if (!confirm('Аялалыг дуусгах уу?')) return;
                      setActionLoading(true);
                      try {
                        await api.rides.complete(ride.id);
                        loadData();
                      } catch (error: any) {
                        alert(error.message);
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className="btn-primary w-full"
                  >
                    {actionLoading ? 'Түр хүлээнэ үү...' : 'Аялалыг дуусгах'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
