import axios from 'axios';
import { getCookie } from '../utils/cookies';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let accessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];
let refreshFailedAt = 0;

// Settings single-flight cache
let _settingsPromise = null;
let _settingsCache = null;

export const getBackendBaseUrl = () => {
  try {
    const apiUrl = new URL(API_BASE_URL, typeof window !== 'undefined' ? window.location.origin : undefined);
    apiUrl.pathname = apiUrl.pathname
      .replace(/\/api\/v\d+\/?$/i, '')
      .replace(/\/api\/?$/i, '');
    apiUrl.search = '';
    apiUrl.hash = '';
    return apiUrl.toString().replace(/\/$/, '');
  } catch (error) {
    return 'http://localhost:5000';
  }
};

export const resolveImageUrl = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const imageUrl = value.trim();
  if (!imageUrl || /^(blob:|data:)/i.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const absoluteUrl = new URL(imageUrl);
    if (absoluteUrl.pathname.startsWith('/uploads/')) {
      const backendUrl = new URL(getBackendBaseUrl());
      absoluteUrl.protocol = backendUrl.protocol;
      absoluteUrl.host = backendUrl.host;
      return absoluteUrl.toString();
    }
    return imageUrl;
  } catch (error) {
    const uploadPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    if (uploadPath.startsWith('/uploads/')) {
      return `${getBackendBaseUrl()}${uploadPath}`;
    }
    return imageUrl;
  }
};

export const normalizeImageUrls = (value) => {
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return value;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeImageUrls(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeImageUrls(item)])
    );
  }

  return resolveImageUrl(value);
};

const getCsrfTokenFromCookie = () => {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const ensureCsrfToken = async (config) => {
  const method = config.method ? config.method.toUpperCase() : '';
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return config;
  }

  let csrfToken = getCsrfTokenFromCookie();
  if (!csrfToken) {
    try {
      const csrfResponse = await axios.get(`${api.defaults.baseURL}/csrf-token`, { withCredentials: true });
      csrfToken = getCsrfTokenFromCookie();
      csrfToken = csrfToken || csrfResponse.data?.data?.token;
    } catch (error) {
      console.warn('[api] unable to refresh CSRF token before request', error);
    }
  }

  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
};

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for receiving/sending cookies (refresh token & csrf cookies)
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token;
};

// Queue helper to hold requests during refresh token rotation
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

export const fetchSettings = async () => {
  if (_settingsCache) return _settingsCache;
  if (_settingsPromise) return _settingsPromise;
  _settingsPromise = api.get('/settings')
    .then((res) => {
      _settingsCache = res;
      _settingsPromise = null;
      return res;
    })
    .catch((err) => {
      _settingsPromise = null;
      throw err;
    });
  return _settingsPromise;
};

export const clearSettingsCache = () => { _settingsCache = null; _settingsPromise = null; };

export const downloadCareerResume = async (applicationId) => (
  api.get(`/careers/applications/${applicationId}/resume`, { responseType: 'blob' })
);

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // 1. Attach Bearer Access Token if present in memory
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 2. Allow FormData requests to set multipart boundaries automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // 3. Attach X-CSRF-Token header for mutating requests
    const method = config.method ? config.method.toUpperCase() : '';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCookie('csrf_token') || getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    await ensureCsrfToken(config);

    if (import.meta.env.DEV) {
      console.log('[api] request', config.method?.toUpperCase(), config.url, config.data || '');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Standardized API response contains the `data` wrapper inside success structure
    // Backend standard format: { success, message, data, errors, timestamp, requestId }
    return normalizeImageUrls(response.data);
  },
  async (error) => {
    const originalRequest = error.config;
    const responseStatus = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    // Detect request ID from backend headers
    const requestId = error.response?.headers?.['x-request-id'] || responseData?.requestId;
    if (error.response) {
      error.response.requestId = requestId;
    }

    // Do not attempt to refresh if the request was to login, logout, or refresh itself
    const isAuthRoute =
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/logout') ||
      originalRequest.url.includes('/employees/login') ||
      originalRequest.url.includes('/employees/me');

    if (responseStatus === 403 && !originalRequest._retryCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((originalRequest.method || '').toUpperCase())) {
      originalRequest._retryCsrf = true;
      try {
        const csrfResponse = await axios.get(`${api.defaults.baseURL}/csrf-token`, { withCredentials: true });
        const csrfToken = getCookie('csrf_token') || getCsrfTokenFromCookie();
        const requestToken = csrfToken || csrfResponse.data?.data?.token;
        if (requestToken) {
          originalRequest.headers['X-CSRF-Token'] = requestToken;
          return api(originalRequest);
        }
      } catch (csrfError) {
        console.warn('[api] CSRF retry failed', csrfError);
      }
    }

    if (responseStatus === 401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true;

      // If we recently failed to refresh, avoid retry storm — fail fast
      const now = Date.now();
      if (refreshFailedAt && now - refreshFailedAt < 60_000) {
        // Treat as unauthorized to avoid repeated refresh attempts
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(new Error('Session expired.'));
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Attempt to rotate tokens via POST /auth/refresh
          // Note: using direct axios call to avoid request interceptors loop
          const refreshRes = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const { success, data } = refreshRes.data;

          if (success && data?.accessToken) {
            const newAccessToken = data.accessToken;
            setAccessToken(newAccessToken);
            isRefreshing = false;
            
            // Notify subscribers and replay original request
            onRefreshed(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          refreshSubscribers = [];
          setAccessToken(null);
          refreshFailedAt = Date.now();

          // Dispatch logout event so AuthContext can clean up state and redirect
          window.dispatchEvent(new Event('auth:unauthorized'));
          
          const formattedErr = new Error(
            refreshErr.response?.data?.message || 'Session expired. Please log in again.'
          );
          formattedErr.status = 401;
          formattedErr.response = refreshErr.response;
          return Promise.reject(formattedErr);
        }
      }

      // If a refresh is already in progress, queue this request
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    if (import.meta.env.DEV) {
      console.log('[api] response', originalRequest?.method?.toUpperCase(), originalRequest?.url, responseStatus, responseData);
    }

    // Blob requests carry JSON error bodies as blobs, so decode them before exposing the error.
    let responseMessage = responseData?.message;
    if (!responseMessage && typeof Blob !== 'undefined' && responseData instanceof Blob) {
      try {
        const parsedResponse = JSON.parse(await responseData.text());
        responseMessage = parsedResponse?.message;
      } catch (parseError) {
        responseMessage = null;
      }
    }

    // Standardize error object structure for components
    const customError = new Error(responseMessage || error.message || 'An error occurred.');
    customError.status = responseStatus || 500;
    customError.errors = responseData?.errors || null;
    customError.requestId = requestId;
    customError.response = error.response;

    return Promise.reject(customError);
  }
);

export default api;
