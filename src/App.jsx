import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatHistoryProvider } from "./contexts/ChatHistoryContext";
import { CookieConsentProvider } from "./contexts/CookieConsentContext";
import { AyrshareConnectionProvider } from "./contexts/AyrshareConnectionContext";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/Dashboard";
import Split from "./components/split/split";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CookieConsent from "./components/CookieConsent";
import AlfredLanding from "../src/AlfredLandingComponent/pages/AlfredLanding";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import logosim from "../src/assets/simbli-logo.png";
import { COMMON_BASE_URL, FRONTEND_URL, logoutApi, SIMBLI_URL } from "./api/api";
import { jwtDecode } from "jwt-decode";
import Profilepop from "./components/Profilepop";
import Loading from "./assets/simbli_loader.gif";
import Error from "./components/404error";
// Component to handle onboarding check and routing
function OnboardingWrapper() {

//   if ('production') {
//   console.log = function () {};
//   console.warn = function () {};
//   console.error = function () {};
//   console.info = function () {};
//   console.debug = function () {};
//   console.trace = function () {};
//   console.table = function () {};
//   console.group = function () {};
//   console.groupEnd = function () {};
//   console.groupCollapsed = function () {};
//   console.time = function () {};
//   console.timeEnd = function () {};
//   console.timeLog = function () {};
//   console.clear = function () {};
//   console.dir = function () {};
//   console.dirxml = function () {};
//   console.count = function () {};
//   console.countReset = function () {};
//   console.assert = function () {};
//   console.profile = function () {};
//   console.profileEnd = function () {};
// }
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [onboardingData, setOnboardingData] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkUserStatus();
    } else if (!authLoading && !isAuthenticated) {
      setOnboardingLoading(false);
    }
  }, [authLoading, isAuthenticated]);
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/landing");
      } else {
        checkUserStatus();
      }
    }
  }, [authLoading, isAuthenticated, navigate]);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setOnboardingLoading(false);
        return;
      }

      // Check if user is new by checking if they have any subscription
      const subscriptionResponse = await axios.get(
        "/subscription/my-subscription",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If no subscription exists, user is new
      const hasSubscription =
        subscriptionResponse.data.status === "success" &&
        subscriptionResponse.data.subscription;
      setIsNewUser(!hasSubscription);

      // Check onboarding status
      const onboardingResponse = await axios.get("/onboarding/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOnboardingData(onboardingResponse.data);
    } catch (error) {
      console.error("Error checking user status:", error);
      // If there's an error, assume user is existing and onboarding is not needed
      setIsNewUser(false);
      setOnboardingData({
        show_onboarding: false,
        current_step: 1,
        is_completed: true,
      });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const checkUserStatusAfterLanding = async () => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) {
        return;
      }

      // Check if user is new by checking if they have any subscription
      const subscriptionResponse = await axios.get(
        "/subscription/my-subscription",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If no subscription exists, user is new
      const hasSubscription =
        subscriptionResponse.data.status === "success" &&
        subscriptionResponse.data.subscription;
      setIsNewUser(!hasSubscription);

      // Check onboarding status
      const onboardingResponse = await axios.get("/onboarding/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOnboardingData(onboardingResponse.data);
    } catch (error) {
      console.error("Error checking user status after landing:", error);
      // If there's an error, assume user is existing and onboarding is not needed
      setIsNewUser(false);
      setOnboardingData({
        show_onboarding: false,
        current_step: 1,
        is_completed: true,
      });
    }
  };

  const handleOnboardingUpdate = (newOnboardingData) => {
    setOnboardingData(newOnboardingData);
  };

  const handleLandingComplete = () => {
    // After landing completion, check user status again without showing loader
    checkUserStatusAfterLanding();
  };

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div> */}
          {/* <p className="mt-4 text-gray-600">Loading...</p> */}
          {/* <div className="loader"></div> */}
          <img src={Loading} alt=""  className="w-24 h-24"/>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   // return (window.location.href = `${SIMBLI_URL}/login`);
  //   return window.location.href = "http://localhost:5173/landing";
  // }

  // For new users: Show Alfred Landing screen first
  console.log("isNewUser",isNewUser)
  if (isNewUser) {
    const params = new URLSearchParams(window.location.search);
    console.log("params",params)
    const planIdValue = params.get("planId");
console.log("planIdValue",planIdValue)
    return (
      <AlfredLanding  onComplete={handleLandingComplete} isNewUser={isNewUser} planIdValue={planIdValue} />
    );
  }

  // For existing users: Check onboarding status
  if (onboardingData?.show_onboarding) {
    return (
      <Split
        currentStep={onboardingData.current_step}
        onOnboardingUpdate={handleOnboardingUpdate}
        isOnboardingCompleted={false}
      />
    );
  }

  // Show dashboard if onboarding is completed or not needed
  return <Dashboard />;
}

// Component to handle AlfredLanding for both new and existing users
function AlfredLandingWrapper() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);
  const [isTrialUser, setIsTrialUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkUserStatus();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setLoading(false);
        return;
      }                                      

      // Check if user is new by checking if they have any subscription
      const subscriptionResponse = await axios.get(
        "/subscription/my-subscription",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If no subscription exists, user is new
      if (
        !subscriptionResponse.data ||
        !subscriptionResponse.data.subscription
      ) {
        setIsNewUser(true);
        setIsTrialUser(false);
      } else {
        // Check if user has trial subscription
        const subscription = subscriptionResponse.data.subscription;
        if (subscription.trial_info && subscription.trial_info.is_trial) {
          setIsNewUser(false);
          setIsTrialUser(true);
        } else {
          setIsNewUser(false);
          setIsTrialUser(false);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      // If there's an error, assume user is existing
      setIsNewUser(false);
      setIsTrialUser(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLandingComplete = () => {
    if (isNewUser) {
      // For new users, proceed with the normal flow
      navigate("/");
    } else {
      // For existing users, go to dashboard
      navigate("/dashboard");
    }
  };

  const handleSubscribe = () => {
    // if (isTrialUser) {
    //   // For trial users, navigate to billing screen to show upgrade options
    //   navigate("/dashboard");
    // } else {
    //   // For paid users, navigate to billing screen
    //   // navigate("/dashboard?tab=billing");
    //   navigate("/dashboard");
    // }
    navigate("/dashboard");
  };

  // const handleLogin = () => {
  //   // Navigate to login page
  //   window.location.href = `${SIMBLI_URL}/login`;
  // };

  const handleLogin = (planId) => {
    const redirectUrl = encodeURIComponent(`${FRONTEND_URL}/landing?planId=${planId}`);
    window.location.href = `${SIMBLI_URL}/login?redirectUrl=${redirectUrl}`;
  };

  const handleLogout = () => {
    Swal.fire({ 
      title: "Confirm Log Out",
      text: "Are you sure you want to log out?",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Log Out",
      reverseButtons: true,
      imageUrl: logosim,
      background: "#FFFFFF",
      color: "#374151",
      buttonsStyling: false,
      width: 460,
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
        image: "logo",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        logoutApi()
          .then((res) => {
            if (res?.status === 200) {
              // Clear auth context and axios defaults
              try {
                logout();
              } catch (e) {}
              localStorage.removeItem("access-token");
              localStorage.removeItem("mail");
              localStorage.removeItem("ayrshare_profile");
              localStorage.removeItem("simbli_chat_messages");
              localStorage.removeItem("simbli_publish_success_map");
              console.log("Cleared Ayrshare localStorage on component mount");
              Swal.fire({
                text: "Logged out successfully.",
                icon: "success",
                background: "#FFFFFF",
                color: "#374151",
                customClass: {
                  popup: "swal2-popup-custom",
                  confirmButton: "swal2-confirm-custom",
                },
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                willClose: () => {
                  window.location.href = `${SIMBLI_URL}`;
                  // window.location.href = "http://localhost:5173";
                },
              });
            } else {
              Swal.fire({
                text: "Logout failed. Please try again.",
                icon: "error",
                background: "#FFFFFF",
                color: "#374151",
                timer: 4000,
                timerProgressBar: true,
                showConfirmButton: true,
              });
            }
          })
          .catch(() => {
            Swal.fire({
              text: "Logout failed. Please try again.",
              icon: "error",
              timer: 4000,
              timerProgressBar: true,
              background: "#FFFFFF",
              color: "#374151",
              showConfirmButton: true,
            });
          });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div> */}
          {/* <p className="mt-4 text-gray-600">Loading...</p> */}
          {/* <div className="loader"></div> */}
          <img src={Loading} alt="" className="w-24 h-24" />

        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   return (window.location.href = `${SIMBLI_URL}/login`);
  // }

  return (
    <AlfredLanding
      onComplete={handleLandingComplete}
      onSubscribe={handleSubscribe}
      onLogin={handleLogin}
      onLogout={handleLogout}
      isNewUser={isNewUser}
      isTrialUser={isTrialUser}
      isAuthenticated={isAuthenticated}
    />
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  // const [isGateAuthed, setIsGateAuthed] = useState(false);
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [error, setError] = useState("");
  // const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("params",params)
    const token = params.get("token");
    console.log("token",token)
    const email = params.get("email");
    const planId = params.get("planId");
    console.log("email",email)
    console.log("planId",planId)
  
    if (token && email) {
      localStorage.setItem("access-token", token);
      localStorage.setItem("mail", email);
     
      localStorage.removeItem("simbli_publish_success_map")
      localStorage.removeItem("simbli_chat_messages")

      // Preserve planId in URL if it exists
      const newUrl = planId 
        ? `${window.location.pathname}?planId=${planId}`
        : window.location.pathname;
      window.location.replace(newUrl);
    } else {
      setLoading(false);
    }
  }, []);

  // useEffect(() => {
  //   // Derive gate auth solely from server-issued JWT with role=superuser
  //   const token = localStorage.getItem("super-token");
  //   if (!token) {
  //     setIsGateAuthed(false);
  //     return;
  //   }
  //   try {
  //     const decoded = jwtDecode(token);
  //     const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
  //     const role = decoded?.role;
  //     setIsGateAuthed(!isExpired && role === "superuser");
  //   } catch {
  //     setIsGateAuthed(false);
  //   }
  // }, []);

  // const showEntryModal = useMemo(() => !isGateAuthed, [isGateAuthed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* <div className="loader"></div> */}
          <img src={Loading} alt="" className="w-24 h-24"/>

        </div>
      </div>
    );
  }

  // const handleGateSubmit = async (e) => {
  //   e.preventDefault();
  //   setError("");
  //   setSubmitting(true);
  //   try {
  //     const res = await axios.post(
  //       `${COMMON_BASE_URL}/api/v1/admin/login`,
  //       {
  //         email,
  //         password,
  //       }
  //     );

  //     const token = res?.data?.token;
  //     if (!token) {
  //       setError("Invalid response from server");
  //       setSubmitting(false);
  //       return;
  //     }

  //     const decoded = jwtDecode(token);
  //     const role = decoded?.role;
  //     if (role !== "superuser") {
  //       setError("Access denied: requires superuser role");
  //       setSubmitting(false);
  //       return;
  //     }

  //     localStorage.setItem("super-token", token);
  //     if (decoded?.email) localStorage.setItem("super-email", decoded.email);
  //     setIsGateAuthed(true);
  //   } catch (err) {
  //     const msg = err?.response?.data?.message || "Login failed";
  //     setError(msg);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  return (
    <AuthProvider>
      {/* {showEntryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.75) 100%)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          aria-modal="true"
          role="dialog"
        >
          <form
            onSubmit={handleGateSubmit}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
              color: "#111",
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 4,
                color: "#111",
                fontWeight: "600",
              }}
            >
              Sign in
            </h3>
            <p style={{ marginTop: 0, color: "#444", fontSize: 14 }}>
              Enter the credentials to access the site
            </p>

            <label style={{ fontSize: 14, color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the Email"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 12,
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#111",
                outline: "none",
              }}
              autoFocus
            />

            <label style={{ fontSize: 14, color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the Password"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 8,
                background: "#fff",
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#111",
                outline: "none",
              }}
            />

            {error && (
              <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 8 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                marginTop: 8,
                background: "linear-gradient(90deg,#54c754,#7ddd7d)",
                color: "#000",
                border: "none",
                borderRadius: "12px",
                padding: "12px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      )} */}
      <ChatHistoryProvider>
        <CookieConsentProvider>
          <AyrshareConnectionProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route element={<ProtectedRoute/>}>
                  <Route path="/" element={<OnboardingWrapper />} />
                  <Route path="/dashboard" element={<OnboardingWrapper />} />
                  <Route path="/split" element={<OnboardingWrapper />} />
                  </Route>
                  <Route path="/landing" element={<AlfredLandingWrapper />} />
                  <Route path="/Profile" element={<Profilepop />} />
                  <Route path="*" element={<Error />} />
                </Routes>
                <CookieConsent />
              </div>
            </Router>
          </AyrshareConnectionProvider>
        </CookieConsentProvider>
      </ChatHistoryProvider>
    </AuthProvider>
  );
}

export default App;
