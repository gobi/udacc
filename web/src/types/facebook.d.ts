interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
}

interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

interface FacebookSDK {
  init(params: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
    status?: boolean;
  }): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string; return_scopes?: boolean }
  ): void;
  logout(callback?: (response: unknown) => void): void;
  getLoginStatus(callback: (response: FacebookLoginStatusResponse) => void): void;
}

interface Window {
  FB?: FacebookSDK;
  fbAsyncInit?: () => void;
  __fbInitialized?: boolean;
}
