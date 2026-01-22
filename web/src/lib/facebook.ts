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
    // Set up the callback before loading the script
    window.fbAsyncInit = function () {
      window.FB!.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      fbSDKLoaded = true;
      fbSDKLoading = false;
      resolve();
    };

    // Check if script already exists
    if (document.getElementById('facebook-jssdk')) {
      if (window.FB) {
        fbSDKLoaded = true;
        fbSDKLoading = false;
        resolve();
      }
      return;
    }

    // Load the SDK asynchronously
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      fbSDKLoading = false;
      reject(new Error('Failed to load Facebook SDK'));
    };

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  });

  return loadPromise;
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

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
