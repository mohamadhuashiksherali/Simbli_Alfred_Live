// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { COMMON_BASE_URL, SIMBLI_URL } from "../../api/api";
import Loading from "../../assets/simbli_loader.gif";

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
    const token = localStorage.getItem("access-token");
    if (!token || isTokenExpired(token)) {
        localStorage.removeItem("access-token");
      setIsAuthenticated(false);
      return;
    }

    // ✅ Call backend to validate token version
    axios
      .get(`${COMMON_BASE_URL}/api/v1/check-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        localStorage.removeItem("access-token");
        setIsAuthenticated(false);
      });
    };

    // Initial auth check
    checkAuth();

    // Check for token expiry periodically (every 30 seconds)
    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem("access-token");
      if (token && isTokenExpired(token)) {
        console.log("Token expired, redirecting to login...");
        localStorage.removeItem("access-token");
        setIsAuthenticated(false);
      }
    }, 30000); // Check every 30 seconds

    // Listen for storage changes (e.g., token removed in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "access-token" && !e.newValue) {
        console.log("Token removed, redirecting to login...");
        setIsAuthenticated(false);
      }
    };

    // Listen for window focus to immediately check token expiry
    const handleFocus = () => {
      const token = localStorage.getItem("access-token");
      if (!token || isTokenExpired(token)) {
        console.log("Token expired on focus, redirecting to login...");
        localStorage.removeItem("access-token");
        setIsAuthenticated(false);
      }
    };

    // Listen for visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(tokenCheckInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (isAuthenticated === null)
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          // backgroundColor: "#1e1e1e",
          height: "100vh",
        }}
      >
        {/* <div className="loader"></div> */}
        <img src={Loading} alt="" className="w-24 h-24" />
      </div>
    );

  if (!isAuthenticated) {
    // Redirect to login page
    window.location.href = `${SIMBLI_URL}`;
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
