import React from 'react';
import { PortalText } from './PortalTranslation';
import './EmergencyReason.css';

export default function EmergencyReason({ appointment }) {
  const reason = appointment?.emergencyReason || appointment?.emergency_reason;
  if (typeof reason !== 'string' || !reason.trim()) return null;
  return <div className="doctor-emergency-reason-note"><strong><PortalText text="Emergency reason" />: </strong><span>{reason.trim()}</span></div>;
}
