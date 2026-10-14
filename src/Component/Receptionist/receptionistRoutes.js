export const receptionistBase = '/receptionist';
export const receptionistMenu = [
  { path: '/receptionist/dashboard', title: 'Dashboard', icon: 'dashboard', description: 'Your front desk at a glance' },
  { path: '/receptionist/appointments', title: 'Appointments', icon: 'appointments', description: 'Manage your view of online and walk-in bookings' },
  { path: '/receptionist/live-queue', title: 'Live Queue', icon: 'queue', description: "Follow the doctor's current checkups and waiting patients" },
  { path: '/receptionist/led-display', title: 'LED Display', icon: 'display', description: "Launch your doctor's live token screen on an LED or TV" },
  { path: '/receptionist/patients', title: 'Patients & Prescriptions', icon: 'patients', description: 'Doctor-wise completed checkups and prescribed treatment' },
  { path: '/receptionist/doctor', title: 'Doctor & Clinics', icon: 'doctor', description: 'Assigned doctor and clinic contact information' },
  { path: '/receptionist/profile', title: 'My Profile', icon: 'profile', description: 'Your account and staff assignment' },
  { path: '/receptionist/settings', title: 'Settings', icon: 'settings', description: 'Keep your account secure' },
];
export const isReceptionistRoute = path => path === receptionistBase || path.startsWith(`${receptionistBase}/`);
