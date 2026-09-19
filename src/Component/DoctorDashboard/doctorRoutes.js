export const doctorMenuItems = [
  { path: "/doctordashboard", icon: "fa-gauge-high", text: "Dashboard" },
  { path: "/doctorcalendar", icon: "fa-calendar-days", text: "Calendar" },
  { path: "/appointmentlist", icon: "fa-list-check", text: "Appointment List" },
  { path: "/patient-details", icon: "fa-user", text: "Patient Details" },
  { path: "/walkinappointment", icon: "fa-person-walking", text: "Walk in" },
  { path: "/followup", icon: "fa-history", text: "Follow Up" },
  { path: "/patient-sms", icon: "fa-message", text: "Patient SMS" },
  { path: "/qrcode", icon: "fa-qrcode", text: "QR Code" },
  { path: "/doctor-user-management", icon: "fa-user-shield", text: "User Management" },
  { path: "/clinicpage", icon: "fa-hospital", text: "Clinic Page" },
];

export const doctorRoutePaths = [
  ...doctorMenuItems.map(({ path }) => path),
  "/doctorprofile", "/setting", "/doctor-notifications",
];

export const isDoctorRoute = (pathname) =>
  doctorRoutePaths.includes(pathname) || pathname.startsWith("/patient-chat/");
