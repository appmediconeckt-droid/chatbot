export const staffRoleLabels = {
  receptionist: 'Receptionist',
  nurse: 'Nurse',
  assistant: 'Medical Assistant',
  lab_technician: 'Lab Technician',
  housekeeping: 'Housekeeping',
  supervisor: 'Supervisor',
  department_manager: 'Department Manager',
  billing: 'Billing Staff',
};

export const staffRoles = Object.keys(staffRoleLabels);
export const isStaffRole = (role) => staffRoles.includes(String(role || '').trim().toLowerCase());
