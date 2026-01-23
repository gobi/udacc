'use client';

import { useEffect } from 'react';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

export function FacebookSDK() {
  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.FB) {
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
        });

        console.log('Facebook SDK initialized');

        // Dispatch event to notify components that SDK is ready
        window.dispatchEvent(new Event('fb-sdk-ready'));
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
