import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { refreshSession, logout, clearAuth } from '../store/slices/authSlice';

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;
const SESSION_REFRESH_THRESHOLD = 10 * 60 * 1000;

export const useSessionManagement = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, sessionExpiry } = useAppSelector((state) => state.auth);
  const intervalRef = useRef<number | null>(null);
  const handleSessionCheck = useCallback(async () => {
    if (!isAuthenticated || !sessionExpiry) return;
    const now = Date.now();
    const timeUntilExpiry = sessionExpiry - now;
    if (timeUntilExpiry <= 0) {
      await dispatch(logout());
      return;
    }
    if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
      try {
        await dispatch(refreshSession()).unwrap();
      } catch (error) {
        // Session expired - user will be logged out
        await dispatch(logout());
      }
    }
  }, [isAuthenticated, sessionExpiry, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      handleSessionCheck();
      intervalRef.current = setInterval(handleSessionCheck, SESSION_CHECK_INTERVAL);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, handleSessionCheck]);

  useEffect(() => {
    const handleLogout = () => {
      dispatch(clearAuth());
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [dispatch]);
};