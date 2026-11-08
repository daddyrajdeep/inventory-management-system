import { createContext, useContext, useEffect, useState } from 'react';

// OWNER: Leader
// Stores the user's preferences (dark mode, notifications, language) in the browser.
// Backend phase: also save them on the user record via the API.

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
  const [prefs, setPrefs] = useState(readStoredPrefs);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.darkMode);
    localStorage.setItem('preferences', JSON.stringify(prefs));
  }, [prefs]);

  // setPref('darkMode', true)
  const setPref = (key, value) => setPrefs((current) => ({ ...current, [key]: value }));

  return <PreferencesContext.Provider value={{ prefs, setPref }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
