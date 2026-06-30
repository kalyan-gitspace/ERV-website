import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { setAccessToken } from '../services/api';

export const AuthContext = createContext(null);

// Default idle timeout fallback (30 minutes in ms)
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');
  
  const idleTimerRef = useRef(null);
  const activityEventsRef = useRef([]);
  const idleTimeoutMsRef = useRef(DEFAULT_IDLE_TIMEOUT_MS);

  /**
   * Log out the current user session
   */
  const logout = useCallback(async (reason = '') => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Stop idle monitoring
      stopIdleTimer();
      removeActivityListeners();

      if (reason === 'idle') {
        setIdleMessage('You have been logged out due to inactivity.');
        window.location.href = '/login?reason=idle';
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  /**
   * Reset idle timeout countdown
   */
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (isAuthenticated) {
      idleTimerRef.current = setTimeout(() => {
        console.warn('User idle timeout reached. Initiating logout.');
        logout('idle');
      }, idleTimeoutMsRef.current);
    }
  }, [isAuthenticated, logout]);

  /**
   * Register event listeners to track user activity
   */
  const setupActivityListeners = useCallback(() => {
    const handleActivity = () => resetIdleTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    activityEventsRef.current = { handleActivity, events };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }, [resetIdleTimer]);

  /**
   * Remove activity event listeners
   */
  const removeActivityListeners = useCallback(() => {
    if (activityEventsRef.current?.events) {
      const { handleActivity, events } = activityEventsRef.current;
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      activityEventsRef.current = [];
    }
  }, []);

  /**
   * Start the idle timer countdown
   */
  const startIdleTimer = useCallback(() => {
    resetIdleTimer();
    setupActivityListeners();
  }, [resetIdleTimer, setupActivityListeners]);

  /**
   * Clear the active idle timeout timer
   */
  const stopIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  /**
   * Fetch current admin profile
   */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.success && res.data) {
        setUser(res.data);
        setIsAuthenticated(true);
        return res.data;
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
      logout();
    }
    return null;
  }, [logout]);

  /**
   * Login action
   */
  const login = useCallback(async (email, password, rememberMe) => {
    try {
      setIdleMessage('');
      const res = await api.post('/auth/login', { email, password, rememberMe });
      
      if (res.success && res.data) {
        const { accessToken, admin } = res.data;
        setAccessToken(accessToken);
        setUser(admin);
        setIsAuthenticated(true);

        // Fetch dynamic idle timeout configuration from backend if available
        // Or configure based on environment
        try {
          // Let's assume IDLE_TIMEOUT env is 30 mins
          const configRes = await api.get('/settings');
          if (configRes.success && configRes.data?.idleTimeoutMinutes) {
            idleTimeoutMsRef.current = configRes.data.idleTimeoutMinutes * 60 * 1000;
          }
        } catch (e) {
          // Fallback to default
        }

        startIdleTimer();
        return res.data;
      }
    } catch (err) {
      throw err;
    }
  }, [startIdleTimer]);

  /**
   * Password change action
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      return res;
    } catch (err) {
      throw err;
    }
  }, []);

  /**
   * Silent Refresh on Startup / Page reload
   */
  const checkAuth = useCallback(async () => {
    try {
      // Rotate token silently
      const refreshRes = await api.post('/auth/refresh');
      if (refreshRes.success && refreshRes.data?.accessToken) {
        setAccessToken(refreshRes.data.accessToken);
        setUser(refreshRes.data.admin);
        setIsAuthenticated(true);
        startIdleTimer();
      }
    } catch (err) {
      console.log('No active session found on initialization.');
    } finally {
      setLoading(false);
    }
  }, [startIdleTimer]);

  // Run silent check on mount
  useEffect(() => {
    checkAuth();

    // Handle session expirations detected inside the Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      stopIdleTimer();
      removeActivityListeners();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      stopIdleTimer();
      removeActivityListeners();
    };
  }, [checkAuth, stopIdleTimer, removeActivityListeners]);

  const value = {
    user,
    isAuthenticated,
    loading,
    idleMessage,
    login,
    logout,
    changePassword,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
