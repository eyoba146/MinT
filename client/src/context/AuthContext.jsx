import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage; optionally validate later via /auth/me if available
  useEffect(() => {
    const savedUser = localStorage.getItem("dih_user");
    const savedToken = localStorage.getItem("dih_token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem("dih_user");
        localStorage.removeItem("dih_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("dih_user", JSON.stringify(data.user));
    localStorage.setItem("dih_token", data.token);

    return data.user;
  };

  const register = async (fullName, email, password, role) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: { fullName, email, password, role },
    });

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("dih_user", JSON.stringify(data.user));
    localStorage.setItem("dih_token", data.token);

    return data.user;
  };

  const updateProfile = async (profileData) => {
    const data = await apiRequest("/auth/profile", {
      method: "PUT",
      body: profileData,
    });

    setUser(data.user);
    localStorage.setItem("dih_user", JSON.stringify(data.user));

    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("dih_user");
    localStorage.removeItem("dih_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateProfile,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}