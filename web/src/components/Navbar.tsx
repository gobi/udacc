'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="UDA Cycling Club" width={40} height={40} className="rounded" />
            <span className="text-xl font-bold text-primary-600">UDA Cycling Club</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/rides" className="text-gray-600 hover:text-primary-600">
              Аялалууд
            </Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-primary-600">
              Тэргүүлэгчид
            </Link>

            {loading ? (
              <span className="text-gray-400">...</span>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile" className="text-gray-600 hover:text-primary-600">
                  {user.first_name}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-red-500"
                >
                  Гарах
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-primary-600"
                >
                  Нэвтрэх
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
