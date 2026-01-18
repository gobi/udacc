'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="UDA" width={48} height={48} className="rounded-lg" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-secondary-900">UDA</span>
              <span className="text-xs block text-secondary-500">Cycling Club</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-secondary-600 hover:text-primary-500 font-medium transition-colors">
              Нүүр
            </Link>
            <Link href="/rides" className="text-secondary-600 hover:text-primary-500 font-medium transition-colors">
              Аялалууд
            </Link>
            <Link href="/leaderboard" className="text-secondary-600 hover:text-primary-500 font-medium transition-colors">
              Тэргүүлэгчид
            </Link>

            {loading ? (
              <span className="text-secondary-400">...</span>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-secondary-600 hover:text-primary-500 font-medium"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user.first_name.charAt(0)}
                    </span>
                  </div>
                  {user.first_name}
                </Link>
                <button
                  onClick={logout}
                  className="text-secondary-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-secondary-600 hover:text-primary-500 font-medium">
                  Нэвтрэх
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2.5">
                  Бүртгүүлэх
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-secondary-600 hover:text-primary-500 font-medium">Нүүр</Link>
              <Link href="/rides" className="text-secondary-600 hover:text-primary-500 font-medium">Аялалууд</Link>
              <Link href="/leaderboard" className="text-secondary-600 hover:text-primary-500 font-medium">Тэргүүлэгчид</Link>
              {user ? (
                <>
                  <Link href="/profile" className="text-secondary-600 hover:text-primary-500 font-medium">Профайл</Link>
                  <button onClick={logout} className="text-red-500 font-medium text-left">Гарах</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-secondary-600 hover:text-primary-500 font-medium">Нэвтрэх</Link>
                  <Link href="/auth/register" className="btn-primary text-center">Бүртгүүлэх</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
