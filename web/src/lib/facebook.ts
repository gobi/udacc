const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

let fbSDKLoaded = false;
let fbSDKLoading = false;
let loadPromise: Promise<void> | null = null;

export function loadFacebookSDK(): Promise<void> {
  if (fbSDKLoaded && window.FB) {
    return Promise.resolve();
  }

  if (fbSDKLoading && loadPromise) {
    return loadPromise;
  }

  fbSDKLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists and FB is initialized
    if (document.getElementById('facebook-jssdk')) {
      if (window.FB) {
        // SDK already loaded and initialized
        fbSDKLoaded = true;
        fbSDKLoading = false;
        resolve();
        return;
      }
      // Script exists but not initialized yet, wait for fbAsyncInit
    }

    // Set up the callback before loading the script
    window.fbAsyncInit = function () {
      try {
        if (!window.FB) {
          throw new Error('FB object not available');
        }

        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });

        fbSDKLoaded = true;
        fbSDKLoading = false;
        resolve();
      } catch (error) {
        fbSDKLoading = false;
        reject(error);
      }
    };

    // If script doesn't exist, load it
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        fbSDKLoading = false;
        loadPromise = null;
        reject(new Error('Failed to load Facebook SDK'));
      };

      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    }
  });

  return loadPromise;
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure SDK is loaded before calling login
    if (!fbSDKLoaded || !window.FB) {
      reject(new Error('Facebook SDK not initialized. Please try again.'));
      return;
    }

    try {
      window.FB.login(
        (response) => {
          if (response.authResponse) {
            resolve(response.authResponse.accessToken);
          } else {
            reject(new Error('Facebook login cancelled'));
          }
        },
        { scope: 'email,public_profile' }
      );
    } catch (error) {
      reject(error);
    }
  });
}

export function getFacebookLoginStatus(): Promise<FacebookLoginStatusResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.getLoginStatus((response) => {
      resolve(response);
    });
  });
}
