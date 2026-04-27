import { useEffect, useState } from 'react';

export const ADMIN_SESSION_STORAGE_KEY = 'sportz_admin_username';

const SESSION_CHANGE = 'sportz-admin-session-change';

function readUsername(): string | null {
  try {
    return localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function notifyAdminSessionChange() {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE));
}

export function saveAdminSession(username: string) {
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, username);
  notifyAdminSessionChange();
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  notifyAdminSessionChange();
}

export function useAdminSession(): string | null {
  const [username, setUsername] = useState<string | null>(readUsername);

  useEffect(() => {
    const sync = () => setUsername(readUsername());
    window.addEventListener(SESSION_CHANGE, sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_CHANGE, sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return username;
}
