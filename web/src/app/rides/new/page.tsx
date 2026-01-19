'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { GPXUpload } from '@/components/GPXUpload';
import { RouteStatsPreview } from '@/components/RouteStatsPreview';
import { MeetingPointPicker } from '@/components/MeetingPointPicker';

interface RideType {
  id: number;
  name: string;
  description: string;
}

interface RouteStats {
  distance_km: number;
  elevation_gain: number;
  max_gradient: number;
  max_descent: number;
  pass_count: number;
}

export default function NewRidePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rideTypes, setRideTypes] = useState<RideType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GPX state
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  // Form state (without the fields that come from GPX)
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
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user && !user.is_ride_leader && !user.is_admin) {
      router.push('/rides');
      return;
    }
    api.rides.types().then((data) => setRideTypes(data.ride_types)).catch(console.error);
  }, [user, authLoading, router]);

  const handleGPXUpload = (file: File, stats: RouteStats) => {
    setGpxFile(file);
    setRouteStats(stats);
    setError('');
  };

  const handleGPXError = (errorMsg: string) => {
    setError(errorMsg);
    setGpxFile(null);
    setRouteStats(null);
  };

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

    if (!gpxFile || !routeStats) {
      setError('GPX файл оруулна уу');
      return;
    }

    setLoading(true);

    try {
      // Create ride with stats from GPX
      const data = {
        title: formData.title,
        description: formData.description,
        ride_type_id: Number(formData.ride_type_id),
        distance_km: routeStats.distance_km,
        elevation_gain: routeStats.elevation_gain,
        max_gradient: routeStats.max_gradient,
        max_descent: routeStats.max_descent,
        pass_count: routeStats.pass_count,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        meeting_point_name: formData.meeting_point_name,
        meeting_point_lat: formData.meeting_point_lat,
        meeting_point_lng: formData.meeting_point_lng,
        bonus_percentage: formData.bonus_percentage ? parseFloat(formData.bonus_percentage) : 0,
      };

      const ride = await api.rides.create(data);

      // Upload GPX file to the ride
      await api.rides.uploadGPX(ride.id, gpxFile);

      router.push(`/rides/${ride.id}`);
    } catch (err: any) {
      setError(err.message || 'Аялал үүсгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-secondary-500 mt-4">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_ride_leader && !user?.is_admin) {
    return null;
  }

  return (
    <div>
      {/* Page Header */}
      <section className="gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/rides" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Аялалууд руу буцах
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Шинэ аялал үүсгэх</h1>
          <p className="text-white/80 text-lg">GPX файл оруулж аялалын мэдээллийг оруулна уу</p>
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
              {/* Step 1: GPX Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  GPX файл <span className="text-red-500">*</span>
                </label>
                <GPXUpload
                  onUpload={handleGPXUpload}
                  onError={handleGPXError}
                  parseGPX={api.rides.parseGPX}
                  currentFile={gpxFile}
                />
              </div>

              {/* Route Stats Preview (shown after GPX upload) */}
              {routeStats && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Замын статистик
                  </label>
                  <RouteStatsPreview stats={routeStats} />
                </div>
              )}

              {/* Rest of the form (only shown after GPX is uploaded) */}
              {gpxFile && routeStats && (
                <>
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
                      disabled={loading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Үүсгэж байна...
                        </span>
                      ) : (
                        'Үүсгэх'
                      )}
                    </button>
                    <Link
                      href="/rides"
                      className="flex-1 bg-secondary-100 text-secondary-600 py-3 rounded-full font-semibold hover:bg-secondary-200 transition-colors text-center"
                    >
                      Цуцлах
                    </Link>
                  </div>
                </>
              )}
            </form>
          </div>

          <p className="text-center text-secondary-500 text-sm mt-6">
            Аялал үүсгэсний дараа "Нийтлэх" товч дарж гишүүдэд харагдах болгоно
          </p>
        </div>
      </section>
    </div>
  );
}
