import { lazy, Suspense, useState, useEffect } from "react";
import "./App.css";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "../setupAxios"; // 🔥 THIS LINE MAGIC
import ProtectedRoute from "./Component/common/ProtectedRoute";

const Leanding = lazy(() => import("./authtication/Leanding"));
const UserDashboard = lazy(
  () => import("./Component/UserDashboard/Dashboard/UserDashboard"),
);
const ChatBox = lazy(
  () => import("./Component/UserDashboard/Tab/ChatBox/ChatBox"),
);
// const Login = lazy(() => import("./authtication/Login"));
const RoleSelector = lazy(() => import("./authtication/RoleSelector"));
const CounselorSignup = lazy(() => import("./authtication/CounselorSignup"));
const UserSignup = lazy(() => import("./authtication/UserSignup"));

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

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check screen size on mount and resize
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

  return (
    <>
      <Suspense fallback={<div className="app-loading">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Leanding />} />
          {/* <Route path="/login" element={<Login />} /> */}
          <Route path="/role-selector" element={<RoleSelector />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/counselor-signup" element={<CounselorSignup />} />

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
                <ChatBox />
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
