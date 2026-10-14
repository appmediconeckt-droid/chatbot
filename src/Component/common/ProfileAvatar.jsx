import React, { useState } from 'react';
import { API_BASE_URL } from '../../axiosConfig.js';

export default function ProfileAvatar({ photo, name = 'Staff', className = '', size, fallback }) {
  const [failedUrl, setFailedUrl] = useState('');
  const value = typeof photo === 'string' ? photo : photo?.url || '';
  const url = value.startsWith('/') ? `${API_BASE_URL}${value}` : value;
  const initials = name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '50%', flexShrink: 0, ...(size ? { width: size, height: size } : {}) }}>
    {url && failedUrl !== url
      ? <img src={url} alt={name} onError={() => setFailedUrl(url)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
      : fallback || initials}
  </span>;
}
