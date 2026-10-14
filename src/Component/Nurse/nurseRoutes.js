export const nurseMenuItems = [
  { path: '/hospital/nurse-dashboard', icon: 'fa-gauge-high', text: 'Dashboard' },
  { path: '/hospital/nurse-profile', icon: 'fa-user', text: 'My Profile' },
  { path: '/hospital/staff-appointments', icon: 'fa-calendar-check', text: 'Appointments' },
  { path: '/hospital/patient-list', icon: 'fa-user-injured', text: 'Patient List' },
  { path: '/hospital/patient-history', icon: 'fa-file-prescription', text: 'Patient History & Rx' },
  { path: '/hospital/vital-signs', icon: 'fa-heart-pulse', text: 'Vital Signs' },
  { path: '/hospital/medication', icon: 'fa-pills', text: 'Medication' },
  { path: '/hospital/shift-report', icon: 'fa-clipboard-list', text: 'Shift Report' },
  { path: '/hospital/emergency-cases', icon: 'fa-truck-medical', text: 'Emergency' },
  { path: '/hospital/nurse-notifications', icon: 'fa-bell', text: 'Notifications' },
  { path: '/hospital/nurse-settings', icon: 'fa-gear', text: 'Settings' },
];
export const isNurseRoute = (path) => nurseMenuItems.some((item) => item.path === path);
