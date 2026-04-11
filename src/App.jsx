import { lazy, Suspense, useState, useEffect } from "react";
import "./App.css";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "../setupAxios"; // 🔥 THIS LINE MAGIC
const Leanding = lazy(() => import("./authtication/Leanding"));
const UserDashboard = lazy(
  () => import("./Component/UserDashboard/Dashboard/UserDashboard"),
);
const ChatBox = lazy(
  () => import("./Component/UserDashboard/Tab/ChatBox/ChatBox"),
);
const Login = lazy(() => import("./authtication/Login"));
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

      // Agar mobile hai to sirf login page dikhao, home page mat dikhao
      if (mobile && currentPath === "/") {
        navigate("/");
      }

      // Agar mobile nahi hai (desktop) to kuch mat karo - user jo chahe wahan ja sakta hai
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [navigate, location.pathname]);

  return (
    <>
      <Suspense fallback={<div className="app-loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Leanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/role-selector" element={<RoleSelector />} />
          <Route path="/otp-verification" element={<OTPVerification />} />

          <Route path="/user-signup" element={<UserSignup />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/chat/:id" element={<ChatBox />} />

          <Route path="/counselor-signup" element={<CounselorSignup />} />
          <Route path="/counselor-directory" element={<CounselorTable />} />
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route path="/sms-input" element={<SMSInput />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
