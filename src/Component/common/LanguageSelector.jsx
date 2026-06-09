import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';

export function LanguageSelector({ lang, setLang, t, compact = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t ? t('select_language') : 'Select Language'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: compact ? '4px 8px' : '6px 12px',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.12)', color: 'inherit',
          cursor: 'pointer', fontSize: compact ? 12 : 13, fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 16 }}>🌐</span>
        <span>{compact ? current.code.toUpperCase() : current.label}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
          minWidth: 160, background: '#fff', borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', zIndex: 9999, overflow: 'hidden',
        }}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px',
                border: 'none', background: l.code === lang ? '#f0f4ff' : 'transparent',
                cursor: 'pointer', fontSize: 13, textAlign: 'left',
                color: l.code === lang ? '#4f46e5' : '#1e293b',
                fontWeight: l.code === lang ? 600 : 400,
              }}
            >
              {l.code === lang && <span style={{ color: '#4f46e5', fontSize: 11 }}>✓</span>}
              {l.code !== lang && <span style={{ width: 11, display: 'inline-block' }} />}
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
