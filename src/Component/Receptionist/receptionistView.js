export const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
export const displayTime = value => value ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '--';
export const statusLabel = value => String(value || 'Not recorded').replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
export const clinicName = (clinics, id) => clinics.find(row => String(row._id || row.id) === String(id))?.clinic_name || 'Unassigned';
export const patientKey = row => `${row.source}:${row.id}`;
export const pageRecords = (records, page, size = 10) => records.slice((page - 1) * size, page * size);
export const filterAppointments = (rows, search, status) => rows.filter(row =>
  `${row.patientName} ${row.phoneNumber} ${row.token ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()) &&
  (status === 'all' || row.queueStatus === status || row.status === status));
