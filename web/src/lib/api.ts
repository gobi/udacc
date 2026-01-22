const API_BASE = '/api/v1';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

export async function fetchAPIMultipart(endpoint: string, formData: FormData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; last_name: string; first_name: string; phone?: string }) =>
      fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    facebook: (accessToken: string) =>
      fetchAPI('/auth/facebook', { method: 'POST', body: JSON.stringify({ access_token: accessToken }) }),
    me: () => fetchAPI('/auth/me'),
    updateMe: (data: any) => fetchAPI('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  },
  users: {
    list: (limit = 20, offset = 0) => fetchAPI(`/users?limit=${limit}&offset=${offset}`),
    leaderboard: (limit = 20, offset = 0) => fetchAPI(`/users/leaderboard?limit=${limit}&offset=${offset}`),
    statistics: () => fetchAPI('/users/statistics'),
    get: (id: string) => fetchAPI(`/users/${id}`),
    getRides: (id: string) => fetchAPI(`/users/${id}/rides`),
  },
  rides: {
    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.offset) query.set('offset', params.offset.toString());
      return fetchAPI(`/rides?${query.toString()}`);
    },
    types: () => fetchAPI('/rides/types'),
    get: (id: string) => fetchAPI(`/rides/${id}`),
    create: (data: any) => fetchAPI('/rides', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/rides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/rides/${id}`, { method: 'DELETE' }),
    publish: (id: string) => fetchAPI(`/rides/${id}/publish`, { method: 'POST' }),
    start: (id: string, leaderId?: string) =>
      fetchAPI(`/rides/${id}/start`, { method: 'POST', body: JSON.stringify({ leader_id: leaderId }) }),
    complete: (id: string, bonusPercentage?: number) =>
      fetchAPI(`/rides/${id}/complete`, { method: 'POST', body: JSON.stringify({ bonus_percentage: bonusPercentage }) }),
    register: (id: string) => fetchAPI(`/rides/${id}/register`, { method: 'POST' }),
    unregister: (id: string) => fetchAPI(`/rides/${id}/register`, { method: 'DELETE' }),
    participants: (id: string) => fetchAPI(`/rides/${id}/participants`),
    markAttendance: (rideId: string, participantId: string) =>
      fetchAPI(`/rides/${rideId}/participants/${participantId}/attendance`, { method: 'POST' }),
    updateParticipant: (rideId: string, participantId: string, data: { attended?: boolean; actual_distance_km?: number; notes?: string }) =>
      fetchAPI(`/rides/${rideId}/participants/${participantId}`, { method: 'PUT', body: JSON.stringify(data) }),
    bulkAttendance: (rideId: string, participants: { user_id: string; attended: boolean }[]) =>
      fetchAPI(`/rides/${rideId}/participants/bulk-attendance`, { method: 'POST', body: JSON.stringify({ participants }) }),
    parseGPX: (file: File) => {
      const formData = new FormData();
      formData.append('gpx', file);
      return fetchAPIMultipart('/rides/parse-gpx', formData);
    },
    uploadGPX: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('gpx', file);
      return fetchAPIMultipart(`/rides/${id}/gpx`, formData);
    },
    getRoute: (id: string) => fetchAPI(`/rides/${id}/route`),
  },
};
