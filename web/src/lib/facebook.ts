const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';

let fbSDKLoaded = false;
let fbSDKLoading = false;
let loadPromise: Promise<void> | null = null;

// Helper to wait for FB to be fully ready
function waitForFB(maxAttempts = 50): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkFB = () => {
      attempts++;
      if (window.FB && fbSDKLoaded) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Timeout waiting for Facebook SDK'));
      } else {
        setTimeout(checkFB, 100);
      }
    };
    checkFB();
  });
}

export function loadFacebookSDK(): Promise<void> {
  // If already loaded and ready, return immediately
  if (fbSDKLoaded && window.FB) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (fbSDKLoading && loadPromise) {
    return loadPromise;
  }

  fbSDKLoading = true;

  loadPromise = new Promise((resolve, reject) => {
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

        // Wait a bit to ensure FB is fully ready
        setTimeout(() => resolve(), 200);
      } catch (error) {
        fbSDKLoading = false;
        fbSDKLoaded = false;
        reject(error);
      }
    };

    // Check if script already exists
    const existingScript = document.getElementById('facebook-jssdk');
    if (existingScript) {
      // Script exists, check if FB is ready
      if (window.FB && fbSDKLoaded) {
        fbSDKLoading = false;
        resolve();
      } else {
        // Wait for fbAsyncInit to be called
        // Add a timeout in case it never fires
        setTimeout(() => {
          if (!fbSDKLoaded) {
            fbSDKLoading = false;
            reject(new Error('Facebook SDK initialization timeout'));
          }
        }, 10000);
      }
      return;
    }

    // Load the SDK
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      fbSDKLoading = false;
      fbSDKLoaded = false;
      loadPromise = null;
      reject(new Error('Failed to load Facebook SDK'));
    };

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}

export async function facebookLogin(): Promise<string> {
  // Double-check that SDK is loaded and ready
  if (!fbSDKLoaded || !window.FB) {
    throw new Error('Facebook SDK not initialized. Please try again.');
  }

  // Wait for FB to be fully ready
  await waitForFB();

  return new Promise((resolve, reject) => {
    try {
      // Final check before calling login
      if (!window.FB) {
        reject(new Error('Facebook SDK not available'));
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
