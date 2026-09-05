import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage
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
    return data;
  };

  const verifyEmail = async (email, code) => {
    const data = await apiRequest("/auth/verify-email", {
      method: "POST",
      body: { email, code },
    });

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("dih_user", JSON.stringify(data.user));
    localStorage.setItem("dih_token", data.token);

    return data.user;
  };

  const resendVerification = async (email) => {
    return await apiRequest("/auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  };

  const forgotPassword = async (email) => {
    return await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  };

  const resetPassword = async (email, code, newPassword) => {
    return await apiRequest("/auth/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
    });
  };

  const verifyResetCode = async (email, code) => {
    return await apiRequest("/auth/verify-reset-code", {
      method: "POST",
      body: { email, code },
    });
  };

  const submitVerification = async (formData) => {
    const data = await apiRequest("/auth/verification", {
      method: "POST",
      body: formData,
    });
    setUser(data.user);
    localStorage.setItem("dih_user", JSON.stringify(data.user));
    return data.user;
  };

  const getVerificationStatus = async () => {
    return await apiRequest("/auth/verification");
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
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        verifyResetCode,
        submitVerification,
        getVerificationStatus,
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
