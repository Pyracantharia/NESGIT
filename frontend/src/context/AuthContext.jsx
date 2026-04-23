import { createContext, useContext, useMemo, useState } from "react";
import { login, register } from "../lib/api.js";

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
  }

  const value = useMemo(
    () => ({
      token,
      userClaims,
      loginUser,
      registerUser,
      logout,
    }),
    [token, userClaims],
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
