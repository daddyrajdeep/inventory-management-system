import { createContext, useContext, useState } from 'react';

// OWNER: Leader
// Holds the logged-in user. The token and user are kept in localStorage so a page refresh keeps you logged in.
// services/api.js reads the token from localStorage and sends it with every request.

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));

  // Called after a successful POST /auth/login
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.settings) {
      // the saved preferences follow the user to this device
      localStorage.setItem('preferences', JSON.stringify(userData.settings));
    }
    setUser(userData);
  };

  // Update part of the logged-in user, e.g. updateUser({ name: 'New name' })
  const updateUser = (changes) => {
    setUser((current) => {
      const next = { ...current, ...changes };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
