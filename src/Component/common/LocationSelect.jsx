import { useEffect, useState } from 'react';
import { loadLocations, locationPatch } from '../../utils/locationApi.js';

export default function LocationSelect({ field, address = {}, onChange, ...props }) {
  const country = address?.country || '';
  const state = field === 'city' ? address?.state || '' : '';
  const ready = field === 'country' || Boolean(country && (field !== 'city' || state));
  const [result, setResult] = useState({ options: [], loading: true, error: false });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!ready) return () => { active = false; };
    setResult({ options: [], loading: true, error: false });
    loadLocations(field, field === 'country' ? '' : country, state).then(options => {
      if (active) setResult({ options, loading: false, error: false });
    }).catch(() => {
      if (active) setResult({ options: [], loading: false, error: true });
    });
    return () => { active = false; };
  }, [field, country, state, ready, retry]);
  const label = field.charAt(0).toUpperCase() + field.slice(1);
  const value = address?.[field] || '';
  return <>
    <select {...props} aria-label={props['aria-label'] || label} value={value}
      disabled={!ready || result.loading || props.disabled}
      onChange={event => onChange(locationPatch(field, event.target.value))}>
      <option value="">{!ready ? `Select ${field === 'state' || !country ? 'country' : 'state'} first` : result.loading ? `Loading ${label.toLowerCase()}...` : `Select ${label}`}</option>
      {value && !result.options.includes(value) && <option value={value}>{value}</option>}
      {result.options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    {ready && result.error && <span role="alert">Could not load {label.toLowerCase()}. <button type="button" onClick={() => setRetry(count => count + 1)}>Retry</button></span>}
    {ready && !result.loading && !result.error && !result.options.length && <input
      {...props} aria-label={`${label} (enter manually)`} placeholder={`Enter ${label}`} value={value}
      onChange={event => onChange(locationPatch(field, event.target.value))} />}
  </>;
}
