import { useState, useCallback } from 'react';

const TOKEN_KEY = 'auracareer_session_token';
const USER_KEY  = 'auracareer_user';

/**
 * useAuth — manages isolated per-user session tokens stored in localStorage.
 * Each browser tab / user account gets a completely isolated session key.
 */
export function useAuth() {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user,  setUserState]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  });

  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY,  JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUserState(null);
  }, []);

  /** Returns auth headers for fetch/axios requests. */
  const authHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const isLoggedIn = !!token && !!user;

  return { token, user, isLoggedIn, saveSession, clearSession, authHeaders };
}
