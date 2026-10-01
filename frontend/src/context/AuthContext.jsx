/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Read initial user synchronously from localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("isse_user");
      const storedToken = localStorage.getItem("isse_token");
      if (storedUser && storedToken && storedUser !== "undefined") {
        return JSON.parse(storedUser);
      }
    } catch (err) {
      console.error("Error reading initial user state:", err);
    }
    return null;
  });

  const [loading] = useState(false);

  const login = (userData, token) => {
    localStorage.setItem("isse_user", JSON.stringify(userData));
    localStorage.setItem("isse_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("isse_user");
    localStorage.removeItem("isse_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}