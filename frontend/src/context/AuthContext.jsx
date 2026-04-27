import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUserById, login, register, updateMe } from "../lib/api.js";

const TOKEN_KEY = "neschat_token";
const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payloadBase64.padEnd(
    payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
    "=",
  );
  return JSON.parse(window.atob(padded));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [userClaims, setUserClaims] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;

    try {
      return decodeJwtPayload(stored);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token || !userClaims?.sub) {
        setUserProfile(null);
        return;
      }

      try {
        const profile = await getUserById(userClaims.sub, token);
        if (!cancelled) setUserProfile(profile);
      } catch {
        if (!cancelled) setUserProfile(null);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token, userClaims?.sub]);

  async function loginUser(email, password) {
    const data = await login(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUserClaims(decodeJwtPayload(data.access_token));
  }

  async function registerUser(payload) {
    const data = await register(payload);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUserClaims(decodeJwtPayload(data.access_token));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUserClaims(null);
    setUserProfile(null);
  }

  async function updateProfile(payload) {
    if (!token) throw new Error("Not authenticated");
    const updated = await updateMe(payload, token);
    setUserProfile(updated);
    return updated;
  }

  const value = useMemo(
    () => ({
      token,
      userClaims,
      userProfile,
      loginUser,
      registerUser,
      updateProfile,
      logout,
    }),
    [token, userClaims, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used in AuthProvider");
  }
  return context;
}
