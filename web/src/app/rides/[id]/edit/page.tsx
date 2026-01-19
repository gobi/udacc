'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { RouteStatsPreview } from '@/components/RouteStatsPreview';
import { MeetingPointPicker } from '@/components/MeetingPointPicker';

interface RideType {
  id: number;
  name: string;
  description: string;
}

interface Ride {
  id: string;
  title: string;
  description: string;
  ride_type_id: number;
  ride_type: { id: number; name: string };
  distance_km: number;
  elevation_gain: number;
  max_gradient: number;
  max_descent: number;
  pass_count: number;
  start_time: string;
  meeting_point_name: string;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  bonus_percentage: number;
  status: string;
  created_by: { id: string };
}

export default function EditRidePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [rideTypes, setRideTypes] = useState<RideType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ride_type_id: 0,
    start_time: '',
    meeting_point_name: '',
    meeting_point_lat: null as number | null,
    meeting_point_lng: null as number | null,
    bonus_percentage: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rideData, typesData] = await Promise.all([
          api.rides.get(params.id as string),
          api.rides.types(),
        ]);
        setRide(rideData);
        setRideTypes(typesData.ride_types);

        // Format datetime for input
        let startTime = '';
        if (rideData.start_time) {
          const date = new Date(rideData.start_time);
          startTime = date.toISOString().slice(0, 16);
        }

        setFormData({
          title: rideData.title || '',
          description: rideData.description || '',
          ride_type_id: rideData.ride_type_id || rideData.ride_type?.id || 0,
          start_time: startTime,
          meeting_point_name: rideData.meeting_point_name || '',
          meeting_point_lat: rideData.meeting_point_lat,
          meeting_point_lng: rideData.meeting_point_lng,
          bonus_percentage: rideData.bonus_percentage?.toString() || '',
        });
      } catch (err) {
        console.error(err);
        setError('Аялал ачаалахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [params.id, authLoading]);

  const handleMeetingPointChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      meeting_point_lat: lat,
      meeting_point_lng: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        ride_type_id: Number(formData.ride_type_id),
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        meeting_point_name: formData.meeting_point_name,
        meeting_point_lat: formData.meeting_point_lat,
        meeting_point_lng: formData.meeting_point_lng,
        bonus_percentage: formData.bonus_percentage ? parseFloat(formData.bonus_percentage) : 0,
      };

      await api.rides.update(params.id as string, data);
      router.push(`/rides/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading || authLoading) {
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
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">Аялал олдсонгүй</h3>
          <Link href="/rides" className="text-primary-500 hover:underline">Аялалууд руу буцах</Link>
        </div>
      </div>
    );
  }

  // Check permission
  const canEdit = user && (user.id === ride.created_by?.id || user.is_admin);
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">Эрх хүрэхгүй байна</h3>
          <Link href={`/rides/${ride.id}`} className="text-primary-500 hover:underline">Аялал руу буцах</Link>
        </div>
      </div>
    );
  }

  const routeStats = {
    distance_km: ride.distance_km,
    elevation_gain: ride.elevation_gain,
    max_gradient: ride.max_gradient,
    max_descent: ride.max_descent,
    pass_count: ride.pass_count,
  };

  return (
    <div>
      {/* Page Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <Link href={`/rides/${ride.id}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Аялал руу буцах
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Аялал засах</h1>
          <p className="text-white/80 text-lg">{ride.title}</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="card p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Stats (read-only) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Замын статистик
                </label>
                <RouteStatsPreview stats={routeStats} />
                <p className="text-xs text-secondary-500 mt-2">GPX файлаас тооцоолсон утгууд. Өөрчлөх бол шинэ GPX файл оруулна уу.</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Гарчиг <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="Жишээ: Горхи-Тэрэлж аялал"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Тайлбар
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Аялалын дэлгэрэнгүй тайлбар..."
                />
              </div>

              {/* Ride Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Төрөл <span className="text-red-500">*</span>
                </label>
                <select
                  name="ride_type_id"
                  value={formData.ride_type_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Сонгоно уу</option>
                  {rideTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Эхлэх цаг
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Meeting Point */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Уулзах газар
                </label>
                <input
                  type="text"
                  name="meeting_point_name"
                  value={formData.meeting_point_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all mb-3"
                  placeholder="Жишээ: Энх тайвны гүүр"
                />
                <MeetingPointPicker
                  lat={formData.meeting_point_lat}
                  lng={formData.meeting_point_lng}
                  onChange={handleMeetingPointChange}
                />
                <p className="text-xs text-secondary-500 mt-2">Газрын зураг дээр дарж уулзах цэг сонгоно уу</p>
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Бонус (%)
                </label>
                <input
                  type="number"
                  name="bonus_percentage"
                  value={formData.bonus_percentage}
                  onChange={handleChange}
                  step="1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="0"
                />
                <p className="text-xs text-secondary-500 mt-1">Хэцүү аялалд бонус нэмж болно</p>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Хадгалж байна...
                    </span>
                  ) : (
                    'Хадгалах'
                  )}
                </button>
                <Link
                  href={`/rides/${ride.id}`}
                  className="flex-1 bg-secondary-100 text-secondary-600 py-3 rounded-full font-semibold hover:bg-secondary-200 transition-colors text-center"
                >
                  Цуцлах
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
