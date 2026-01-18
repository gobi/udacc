'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Participant {
  id: string;
  user: { id: string; first_name: string; last_name: string };
  attended: boolean;
  completed: boolean;
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

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

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
    try {
      await api.rides.register(ride!.id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUnregister = async () => {
    try {
      await api.rides.unregister(ride!.id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Уншиж байна...</div>;
  }

  if (!ride) {
    return <div className="text-center py-12 text-gray-500">Аялал олдсонгүй</div>;
  }

  const statusLabels: Record<string, string> = {
    draft: 'Ноорог',
    published: 'Нээлттэй',
    ongoing: 'Явагдаж буй',
    completed: 'Дууссан',
    cancelled: 'Цуцалсан',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{ride.title}</h1>
            <p className="text-gray-600">{ride.description}</p>
          </div>
          <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm">
            {statusLabels[ride.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary-600">{ride.distance_km}</div>
            <div className="text-gray-500 text-sm">км</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary-600">+{ride.elevation_gain}</div>
            <div className="text-gray-500 text-sm">өндөр авалт (м)</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary-600">{ride.max_gradient}%</div>
            <div className="text-gray-500 text-sm">их өгсөлт</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary-600">{ride.pass_count}</div>
            <div className="text-gray-500 text-sm">даваа</div>
          </div>
        </div>

        <div className="border-t pt-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Төрөл:</span>{' '}
              <span className="font-medium">{ride.ride_type?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Эхлэх цаг:</span>{' '}
              <span className="font-medium">
                {ride.start_time ? new Date(ride.start_time).toLocaleString('mn-MN') : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Уулзах газар:</span>{' '}
              <span className="font-medium">{ride.meeting_point_name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Үүсгэсэн:</span>{' '}
              <span className="font-medium">
                {ride.created_by?.last_name} {ride.created_by?.first_name}
              </span>
            </div>
            {ride.leader && (
              <div>
                <span className="text-gray-500">Удирдагч:</span>{' '}
                <span className="font-medium">
                  {ride.leader.last_name} {ride.leader.first_name}
                </span>
              </div>
            )}
            {ride.bonus_percentage > 0 && (
              <div>
                <span className="text-gray-500">Бонус:</span>{' '}
                <span className="font-medium text-green-600">+{ride.bonus_percentage}%</span>
              </div>
            )}
          </div>
        </div>

        {ride.status === 'published' && (
          <div className="border-t pt-6">
            {isRegistered ? (
              <button
                onClick={handleUnregister}
                className="w-full bg-red-100 text-red-600 py-3 rounded-lg hover:bg-red-200"
              >
                Бүртгэлээ цуцлах
              </button>
            ) : (
              <button
                onClick={handleRegister}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700"
              >
                Бүртгүүлэх
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Оролцогчид ({participants.length})
        </h2>
        {participants.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Оролцогч байхгүй</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <span>
                  {p.user.last_name} {p.user.first_name}
                </span>
                <div className="flex items-center gap-2">
                  {p.attended && (
                    <span className="text-green-600 text-sm">Ирсэн</span>
                  )}
                  {p.completed && (
                    <span className="text-purple-600 text-sm">
                      {p.final_distance_km} км
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
