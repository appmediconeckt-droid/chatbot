import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';

export function LanguageSelector({ lang, setLang, t, compact = false, sidebar = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (langCode) => {
    console.log('🌐 Language Changed:', langCode);
    setLang(langCode);
  };

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (sidebar) {
    return (
      <div ref={ref} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`ud-sidebar-item ud-lang-trigger${open ? ' ud-lang-trigger--open' : ''}`}
          title={t ? t('select_language') : 'Select Language'}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="ud-sidebar-icon" style={{ fontSize: 18 }}>🌐</span>
          <span className="ud-sidebar-text" style={{ flex: 1 }}>{current.label}</span>
          <span className="ud-lang-chevron">
            {open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
          </span>
        </button>

        {open && (
          <div className="ud-lang-dropdown" role="listbox">
            <div className="ud-lang-dropdown-header">
              {t ? t('select_language') : 'Select Language'}
            </div>
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => { handleLanguageChange(l.code); setOpen(false); }}
                className={`ud-lang-option${l.code === lang ? ' ud-lang-option--active' : ''}`}
              >
                <span className="ud-lang-check">{l.code === lang ? '✓' : ''}</span>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default inline variant (used in chat footer, mobile modal, etc.)
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t ? t('select_language') : 'Select Language'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
          padding: compact ? '6px 10px' : '6px 12px',
          borderRadius: compact ? 18 : 20,
          border: `1.5px solid ${compact ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)'}`,
          background: compact ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: compact ? 11 : 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease',
          width: compact ? '100%' : 'auto',
        }}
        onMouseEnter={(e) => {
          if (compact) {
            e.target.style.background = 'rgba(255,255,255,0.25)';
            e.target.style.borderColor = 'rgba(255,255,255,0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (compact) {
            e.target.style.background = 'rgba(255,255,255,0.18)';
            e.target.style.borderColor = 'rgba(255,255,255,0.4)';
          }
        }}
      >
        <span style={{ fontSize: compact ? 14 : 16 }}>🌐</span>
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
              type="button"
              onClick={() => { handleLanguageChange(l.code); setOpen(false); }}
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
