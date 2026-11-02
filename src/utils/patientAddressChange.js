import { phoneCountryForLocation } from './locationApi.js';
import { limitPhoneDigits } from './profileCompletion.js';

export function applyPatientAddressChange(form, patch) {
  const phone = phoneCountryForLocation(patch.country);
  const updated = { ...form, address: { ...form.address, ...patch } };
  if (!phone) return updated;
  return {
    ...updated,
    phoneCountry: phone.iso,
    phone: limitPhoneDigits(form.phone, phone.dial),
    emergencyPhoneCountry: phone.iso,
    emergencyContact: {
      ...form.emergencyContact,
      phone: limitPhoneDigits(form.emergencyContact?.phone, phone.dial),
    },
  };
}
