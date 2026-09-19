import { dashboardForRole, isProfessionalRole } from "./authtication/authSession.js";
import { lazy, Suspense, useEffect } from "react";
import "./App.css";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "../setupAxios";
import ProtectedRoute from "./Component/common/ProtectedRoute";
import axiosInstance from "./axiosConfig";

import { isDoctorRoute } from "./Component/DoctorDashboard/doctorRoutes";

const PublicDoctorProfile = lazy(() => import("./Component/DoctorDashboard/Setting/SettingProfileQR/PublicDoctorProfile.jsx"));
const DoctorLayout = lazy(() => import("./Component/DoctorDashboard/DoctorLayout"));
const Leanding = lazy(() => import("./authtication/Leanding"));
const LandingPrivacyPolicy = lazy(
  () => import("./authtication/LandingPrivacyPolicy"),
);
const LandingSupport = lazy(() => import("./authtication/LandingSupport"));
const UserDashboard = lazy(
  () => import("./Component/UserDashboard/Dashboard/UserDashboard"),
);
const ChatBox = lazy(
  () => import("./Component/UserDashboard/Tab/ChatBox/ChatBox"),
);
const Signup = lazy(() => import("./authtication/Signup"));
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

const DoctorDashboard = lazy(() => import("./Component/DoctorDashboard/Dashboard/DoctorDashboard"));
const DoctorCalendar = lazy(() => import("./Component/DoctorDashboard/Calendar/Calendar"));
const DoctorProfileFlow = lazy(() => import("./Component/DoctorDashboard/DoctorProfile/ActivateProfile"));
const QRcode = lazy(() => import("./Component/DoctorDashboard/AppointmentQR/AllQRcode"));
const AppointmentList = lazy(() => import("./Component/DoctorDashboard/AppointmentList/Appointment List"));
const SettingsPage = lazy(() => import("./Component/DoctorDashboard/Setting/Setting"));
const DoctorNotificationPage = lazy(() => import("./Component/DoctorDashboard/Notification/NotificationPage"));
const ClinicPage = lazy(() => import("./Component/DoctorDashboard/ClinicAllView/ClinicPage"));
const WalkInAppointment = lazy(() => import("./Component/DoctorDashboard/Walk-in/WalkInAppointment"));
const AppointmentForm = lazy(() => import("./Component/DoctorDashboard/Walk-in/AppointmentForm"));
const PatientList = lazy(() => import("./Component/DoctorDashboard/DoctorDashboardChat/DoctorSmsPatient"));
const DoctorChat = lazy(() => import("./Component/DoctorDashboard/DoctorDashboardChat/DoctorChat"));
const FollowUp = lazy(() => import("./Component/DoctorDashboard/Follow-Up/FollowUp"));
const PatientDetailsPage = lazy(() => import("./Component/DoctorDashboard/PatientAppointmentDetails/PatientDetailsPage"));
const DoctorUserManagement = lazy(() => import("./Component/DoctorDashboard/DoctorUserManagement/DoctorUserManagement"));

const UserAwareChatRoute = () => {
  const role = String(localStorage.getItem("userRole") || "").toLowerCase();
  return isProfessionalRole(role) || role === "counselor"
    ? <ChatBox />
    : <UserDashboard />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;

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
    const isProtectedPage = isDoctorRoute(location.pathname) || protectedPaths.some(
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
          <Route path="/privacy-policy" element={<LandingPrivacyPolicy />} />
          <Route path="/support" element={<LandingSupport />} />
          <Route path="/login" element={<UserSignup key="login" />} />
          <Route path="/role-selector" element={<Navigate to="/login" replace />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user-signup" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password-otp" element={<ForgotPasswordOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/counselor-signup" element={<Navigate to="/login" replace />} />
          <Route
            path="/verify-login-otp"
            element={<LoginOtpVerification />}
          />
          <Route path="/doctor-profile-qr" element={<PublicDoctorProfile />} />
          <Route path="/walk-in-appointment" element={<AppointmentForm />} />

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

          <Route element={<ProtectedRoute allowedRoles={["doctor"]} exactRoles><DoctorLayout /></ProtectedRoute>}>
            <Route path="/doctordashboard" element={<DoctorDashboard />} />
            <Route path="/doctorcalendar" element={<DoctorCalendar />} />
            <Route path="/doctorprofile" element={<DoctorProfileFlow />} />
            <Route path="/qrcode" element={<QRcode />} />
            <Route path="/appointmentlist" element={<AppointmentList />} />
            <Route path="/setting" element={<SettingsPage />} />
            <Route path="/doctor-notifications" element={<DoctorNotificationPage />} />
            <Route path="/clinicpage" element={<ClinicPage />} />
            <Route path="/walkinappointment" element={<WalkInAppointment />} />
            <Route path="/patient-sms" element={<PatientList />} />
            <Route path="/patient-chat/:patientId" element={<DoctorChat />} />
            <Route path="/followup" element={<FollowUp />} />
            <Route path="/patient-details" element={<PatientDetailsPage />} />
            <Route path="/doctor-user-management" element={<DoctorUserManagement />} />
          </Route>

          {/* Counselor Protected Routes */}
          <Route
            path="/counselor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["counsellor", "counselor", "counsellour", "consultant"]} exactRoles>
                <CounselorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sms-input"
            element={
              <ProtectedRoute allowedRoles={["counsellor", "counselor", "counsellour", "consultant"]} exactRoles>
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
