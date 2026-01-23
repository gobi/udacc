export function loadFacebookSDK(): Promise<void> {
  // SDK is preloaded at app level via FacebookSDK component
  // Just verify it's available
  return new Promise((resolve, reject) => {
    if (window.FB && typeof window.FB.login === 'function') {
      resolve();
    } else {
      reject(new Error('Facebook SDK not loaded. Please refresh the page.'));
    }
  });
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Final check before calling login
    if (!window.FB || typeof window.FB.login !== 'function') {
      reject(new Error('Facebook SDK not available. Please refresh the page.'));
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
