import { currencyDigits, feeCurrency } from '../../utils/consultationCurrency.js';

export default function ClinicFeeFields({ value, onChange, doctor, videoFee = 0, onVideoFeeChange }) {
  const currency = feeCurrency(doctor || {}) || 'INR';
  return <div className="form-group">
    <label className="form-label">Clinic checkup fee ({currency || 'set your profile country'})
      <input className="form-input" aria-label="Clinic checkup fee" required type="number" min="0" max="9999999.99" step={currency ? 10 ** -currencyDigits(currency) : 'any'} value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : e.target.value)} />
    </label>
    <p>Set the fee for this clinic. You can enter the same fee for multiple clinics or a different fee for each clinic.</p>
    {onVideoFeeChange && <><label className="form-label">Video call additional fee ({currency})
      <input className="form-input" aria-label="Video call additional fee" required type="number" min="0" max="9999999.99" step={10 ** -currencyDigits(currency)} value={videoFee ?? 0} onChange={event => onVideoFeeChange(event.target.value)} />
    </label><p>Added to this clinic's checkup fee for video appointments only. Enter 0 for no additional charge.</p></>}
  </div>;
}
