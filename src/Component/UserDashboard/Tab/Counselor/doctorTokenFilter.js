export const isDoctorTokenItem = item => {
  const doctor = item?.appointment?.doctor;
  const number = item?.token?.myToken;
  return (String(doctor?.role || '').toLowerCase() === 'doctor' ||
    String(doctor?.accountType || '').toLowerCase() === 'doctor') &&
    number !== null && number !== undefined && Number.isInteger(Number(number)) && Number(number) > 0;
};
