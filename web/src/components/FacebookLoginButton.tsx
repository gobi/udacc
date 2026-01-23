'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface FacebookLoginButtonProps {
  onError?: (error: string) => void;
}

export default function FacebookLoginButton({ onError }: FacebookLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const { loginWithFacebook } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Helper to check if SDK is truly initialized (not just loaded)
    const isSDKInitialized = () => {
      return window.__fbInitialized === true && window.FB && typeof window.FB.login === 'function';
    };

    // Check if SDK is already initialized
    if (isSDKInitialized()) {
      console.log('Facebook SDK already initialized');
      setSdkReady(true);
      return;
    }

    // Listen for SDK ready event (fired after FB.init completes)
    const handleSDKReady = () => {
      console.log('Facebook SDK ready event received');
      if (isSDKInitialized()) {
        setSdkReady(true);
      }
    };

    window.addEventListener('fb-sdk-ready', handleSDKReady);

    // Fallback: poll for SDK initialization flag
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds
    const checkSDK = () => {
      attempts++;
      if (isSDKInitialized()) {
        console.log('Facebook SDK ready (polling)');
        setSdkReady(true);
      } else if (attempts < maxAttempts) {
        setTimeout(checkSDK, 100);
      } else {
        console.error('Facebook SDK failed to initialize after 10 seconds');
      }
    };

    // Start polling after a delay
    const pollTimeout = setTimeout(checkSDK, 1000);

    return () => {
      window.removeEventListener('fb-sdk-ready', handleSDKReady);
      clearTimeout(pollTimeout);
    };
  }, []);

  const handleClick = async () => {
    if (!sdkReady) {
      if (onError) {
        onError('Facebook SDK ачаалагдаж байна, түр хүлээнэ үү...');
      }
      return;
    }

    setLoading(true);
    try {
      await loginWithFacebook();
      router.push('/');
    } catch (err: any) {
      const message = err.message || 'Facebook-р нэвтрэхэд алдаа гарлаа';
      if (onError) {
        onError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || !sdkReady}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-secondary-200 rounded-xl bg-white hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-[#1877F2]/30 border-t-[#1877F2] rounded-full animate-spin"></div>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )}
      <span className="text-secondary-700 font-medium">
        {!sdkReady ? 'Ачаалж байна...' : loading ? 'Нэвтэрч байна...' : 'Facebook-р нэвтрэх'}
      </span>
    </button>
  );
}
