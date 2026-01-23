'use client';

import Script from 'next/script';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

export function FacebookSDK() {
  return (
    <>
      <Script
        id="facebook-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId: '${FACEBOOK_APP_ID}',
                cookie: true,
                xfbml: true,
                version: 'v18.0',
                status: true
              });

              FB.getLoginStatus(function() {
                window.__fbInitialized = true;
                console.log('Facebook SDK fully initialized');
                window.dispatchEvent(new Event('fb-sdk-ready'));
              });
            };
          `,
        }}
      />
      <Script
        id="facebook-jssdk"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="beforeInteractive"
      />
    </>
  );
}
