import { lazy, Suspense, useState, useEffect } from "react";
import "./App.css";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "../setupAxios";
import ProtectedRoute from "./Component/common/ProtectedRoute";
import axiosInstance from "./axiosConfig";

const Leanding = lazy(() => import("./authtication/Leanding"));
const UserDashboard = lazy(
  () => import("./Component/UserDashboard/Dashboard/UserDashboard"),
);
const ChatBox = lazy(
  () => import("./Component/UserDashboard/Tab/ChatBox/ChatBox"),
);
const RoleSelector = lazy(() => import("./authtication/RoleSelector"));
const CounselorSignup = lazy(() => import("./authtication/CounselorSignup"));
const UserSignup = lazy(() => import("./authtication/UserSignup"));

// Add .jsx extension explicitly
const ForgotPassword = lazy(() => import("./authtication/ForgotPassword.jsx"));
const ForgotPasswordOTP = lazy(
  () => import("./authtication/ForgotPasswordOTP.jsx"),
);
const ResetPassword = lazy(() => import("./authtication/ResetPassword.jsx"));

// FIX: Change from .js to .jsx (the file is named LoginOtpVerification.jsx)
const LoginOtpVerification = lazy(
  () => import("./authtication/LoginOtpVerification.jsx"),
);

const CounselorDashboard = lazy(
  () => import("./Component/counselor-dashboard/Dashboard/dashboard"),
);
const CounselorTable = lazy(
  () => import("./Component/UserDashboard/Tab/Counselor/CounselorDirectory"),
);
const SMSInput = lazy(
  () => import("./Component/counselor-dashboard/Tab/SMSInput/SMSInput"),
);
const OTPVerification = lazy(() => import("./authtication/OTPVerification"));

const UserAwareChatRoute = () => {
  const role = String(localStorage.getItem("userRole") || "").toLowerCase();
  return role === "counsellor" || role === "counselor"
    ? <ChatBox />
    : <UserDashboard />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      const currentPath = location.pathname;

      if (mobile && currentPath === "/") {
        navigate("/");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [navigate, location.pathname]);

  // Keep the server-side login session alive while a protected web page is
  // open. Closing the browser stops this signal, allowing the backend to
  // release the one-device lock automatically.
  useEffect(() => {
    const protectedPaths = [
      "/user-dashboard",
      "/counselor-dashboard",
      "/counselor-directory",
      "/chat",
      "/sms-input",
    ];
    const isProtectedPage = protectedPaths.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
    const hasToken =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (!isProtectedPage || !hasToken) return undefined;

    let stopped = false;
    const sendHeartbeat = async () => {
      if (stopped) return;
      try {
        await axiosInstance.post("/api/auth/session-heartbeat");
      } catch (error) {
        // Token refresh/session expiry is handled by the shared interceptor.
        // Temporary network loss must not immediately eject the user.
        if (error.response?.status !== 401) {
          console.debug("Session heartbeat delayed:", error.message);
        }
      }
    };

    sendHeartbeat();
    const heartbeatTimer = window.setInterval(sendHeartbeat, 15_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };

    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      window.clearInterval(heartbeatTimer);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [location.pathname]);

  return (
    <>
      <Suspense fallback={<div className="app-loading">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Leanding />} />
          <Route path="/role-selector" element={<RoleSelector />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password-otp" element={<ForgotPasswordOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/counselor-signup" element={<CounselorSignup />} />
          <Route
            path="/verify-login-otp"
            element={<LoginOtpVerification />}
          />

          {/* User Protected Routes */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute allowedRoles={["user", "counsellor", "counselor"]}>
                <UserAwareChatRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["user", "counsellor", "counselor"]}>
                <UserAwareChatRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counselor-directory"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <CounselorTable />
              </ProtectedRoute>
            }
          />

          {/* Counselor Protected Routes */}
          <Route
            path="/counselor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["counsellor", "counselor"]}>
                <CounselorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms-input"
            element={
              <ProtectedRoute allowedRoles={["counsellor", "counselor"]}>
                <SMSInput />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
