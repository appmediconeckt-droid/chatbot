export const defaultShiftTimes = {
  Morning: ['06:00', '14:00'], Evening: ['14:00', '22:00'], Night: ['22:00', '06:00'],
};
export function staffIdentity(profile = {}) {
  return profile.staffId || profile.staff_id || profile.assistantId || profile.technicianId || profile.housekeepingStaffId || profile.supervisorId || profile.managerId || profile.billingId || profile._id || profile.id || 'Not assigned';
}
export function staffShiftTiming(profile = {}) {
  const start = profile.shiftStartTime || profile.shift_start_time;
  const end = profile.shiftEndTime || profile.shift_end_time;
  if (start && end) return `${start} - ${end}`;
  return profile.shiftTime || profile.shift_time || 'Not assigned';
}
