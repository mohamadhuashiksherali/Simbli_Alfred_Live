import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("access-token"));
console.log("user",user)
 if ('production') {
  console.log = function () {};
  console.warn = function () {};
  console.error = function () {};
  console.info = function () {};
  console.debug = function () {};
  console.trace = function () {};
  console.table = function () {};
  console.group = function () {};
  console.groupEnd = function () {};
  console.groupCollapsed = function () {};
  console.time = function () {};
  console.timeEnd = function () {};
  console.timeLog = function () {};
  console.clear = function () {};
  console.dir = function () {};
  console.dirxml = function () {};
  console.count = function () {};
  console.countReset = function () {};
  console.assert = function () {};
  console.profile = function () {};
  console.profileEnd = function () {};
} 
  // Configure axios defaults
  // axios.defaults.baseURL = "http://localhost:8000";
  // axios.defaults.baseURL = "https://backend-alfred.simbli.ai";
  axios.defaults.baseURL = "https://dev-backend-alfred.simbli.ai/";
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post("/auth/login", formData);
      const { access_token } = response.data;

      setToken(access_token);
      localStorage.setItem("access-token", access_token);
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await axios.post("/auth/register", userData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await axios.post("/auth/google", { id_token: idToken });
      const { access_token } = response.data;

      setToken(access_token);
      localStorage.setItem("access-token", access_token);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("access-token");
    } catch (e) {}
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
