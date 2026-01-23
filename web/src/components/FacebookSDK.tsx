'use client';

import { useEffect } from 'react';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

export function FacebookSDK() {
  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    // Check if already initialized (not just loaded)
    if (window.__fbInitialized) {
      return;
    }

    // Set up the async init callback BEFORE loading the script
    window.fbAsyncInit = function() {
      if (!window.FB) return;

      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
          status: true, // Check login status on init - ensures SDK is fully ready
        });

        console.log('Facebook SDK init called');

        // Wait for getLoginStatus to complete before marking as ready
        // This ensures the SDK's internal async initialization is done
        window.FB.getLoginStatus(() => {
          window.__fbInitialized = true;
          console.log('Facebook SDK fully initialized');
          window.dispatchEvent(new Event('fb-sdk-ready'));
        });
      } catch (error) {
        console.error('Facebook SDK initialization error:', error);
      }
    };

    // Load the SDK script only if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }
  }, []);

  return null;
}
