// Helper to wait for FB to be fully ready
// SDK is loaded at app level via FacebookSDK component
function waitForFB(maxAttempts = 100): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkFB = () => {
      attempts++;

      // Check if FB exists and is initialized
      if (window.FB && typeof window.FB.login === 'function') {
        resolve();
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error('Timeout waiting for Facebook SDK. Please refresh the page.'));
        return;
      }

      setTimeout(checkFB, 100);
    };

    checkFB();
  });
}

export function loadFacebookSDK(): Promise<void> {
  // SDK is preloaded at app level, just wait for it to be ready
  return waitForFB();
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
