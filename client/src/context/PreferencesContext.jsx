import { createContext, useContext, useEffect, useState } from 'react';
import { saveSettings } from '../services/authService';
import { useAuth } from './AuthContext';

// OWNER: Leader
// Stores the user's preferences (dark mode, notifications, language) in the browser,
// and saves them on the user record when logged in, so they follow you across devices.

const PreferencesContext = createContext(null);

const defaults = { darkMode: false, notifications: true, language: 'en' };

function readStoredPrefs() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('preferences')) };
  } catch {
    return defaults;
  }
}

export function PreferencesProvider({ children }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(readStoredPrefs);

  // On login, AuthContext puts the user's saved settings into localStorage; pick them up
  const userId = user?.id;
  const [seenUserId, setSeenUserId] = useState(userId);
  if (userId !== seenUserId) {
    setSeenUserId(userId);
    if (userId) setPrefs(readStoredPrefs());
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.darkMode);
    localStorage.setItem('preferences', JSON.stringify(prefs));
  }, [prefs]);

  // setPref('darkMode', true)
  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (localStorage.getItem('token')) saveSettings(next).catch(() => {}); // preferences must never break the page
  };

  return <PreferencesContext.Provider value={{ prefs, setPref }}>{children}</PreferencesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
