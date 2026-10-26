import { currencyDigits, feeCurrency, formatFee } from '../../utils/consultationCurrency.js';
import { useEffect, useState } from 'react';

export default function ClinicFeeFields({ value, onChange, doctor }) {
  const currency = feeCurrency(doctor || {});
  const [custom, setCustom] = useState(value !== '' && value != null);
  useEffect(() => { if (value === '') setCustom(false); }, [value]);
  return <div className="form-group">
    <label className="form-label">Clinic checkup fee
      <select className="form-input" value={custom ? 'custom' : 'profile'} onChange={e => { setCustom(e.target.value === 'custom'); onChange(e.target.value === 'profile' ? '' : (doctor?.consultationFee ?? '0')); }}>
        <option value="profile">Use common profile fee</option>
        <option value="custom">Set a different fee for this clinic</option>
      </select>
    </label>
    {custom ? <label>Checkup fee ({currency || 'set currency in your profile'})
      <input className="form-input" aria-label="Clinic checkup fee" required type="number" min="0" max="9999999.99" step={currency ? 10 ** -currencyDigits(currency) : 'any'} value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : e.target.value)} />
    </label> : <p>Common fee: {formatFee(doctor?.consultationFee, currency)}. Update it in your doctor profile. Clinics using the common fee follow profile fee changes.</p>}
  </div>;
}
