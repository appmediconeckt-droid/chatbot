import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';

export function LanguageSelector({ lang, setLang, t, compact = false, sidebar = false }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState('bottom'); // 'bottom' or 'top'
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (langCode) => {
    console.log('🌐 Language Changed:', langCode);
    console.log('Current lang before change:', lang);
    setLang(langCode);
    console.log('Language change triggered for:', langCode);
  };

  // Detect viewport boundaries and adjust dropdown position
  useEffect(() => {
    if (!open || !ref.current || !dropdownRef.current) return;

    const button = ref.current.querySelector('button');
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight || 300;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    // Check if there's enough space below
    if (spaceBelow < dropdownHeight + 20) {
      // Not enough space below, try above
      if (spaceAbove > dropdownHeight + 20) {
        setDropdownPos('top');
      } else {
        // Not enough space above either, use bottom but with scroll
        setDropdownPos('bottom');
      }
    } else {
      setDropdownPos('bottom');
    }
  }, [open]);

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
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
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
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            ...(dropdownPos === 'bottom'
              ? { top: (ref.current?.getBoundingClientRect()?.bottom || 0) + 8 }
              : { bottom: window.innerHeight - (ref.current?.getBoundingClientRect()?.top || 0) + 8 }),
            left: Math.max(8, (ref.current?.getBoundingClientRect()?.left || 0)),
            minWidth: 'clamp(160px, 90vw, 240px)',
            maxHeight: 'clamp(200px, 60vh, 400px)',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '1px solid #e5e7eb',
            zIndex: 10000,
          }}
        >
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
