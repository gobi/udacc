export function loadFacebookSDK(): Promise<void> {
  // SDK is preloaded at app level via FacebookSDK component
  // Verify it's initialized (not just loaded)
  return new Promise((resolve, reject) => {
    if (window.__fbInitialized && window.FB && typeof window.FB.login === 'function') {
      resolve();
    } else {
      reject(new Error('Facebook SDK not initialized. Please refresh the page.'));
    }
  });
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check initialization flag, not just FB object existence
    if (!window.__fbInitialized || !window.FB || typeof window.FB.login !== 'function') {
      reject(new Error('Facebook SDK not initialized. Please refresh the page.'));
      return;
    }

    try {
      const FB = window.FB;
      // First call getLoginStatus to ensure SDK is fully ready
      FB.getLoginStatus((statusResponse) => {
        console.log('Facebook login status:', statusResponse.status);

        // Now safe to call login
        FB.login(
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
