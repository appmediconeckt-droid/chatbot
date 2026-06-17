import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { SUPPORTED_LANGUAGES } from '../../i18n/LanguageContext';
import './LanguageSelector.css';

const LANG_ACCENT = {
  en: '#3B82F6', hi: '#F97316', mr: '#8B5CF6', ta: '#10B981',
  pa: '#F59E0B', bn: '#EC4899', gu: '#06B6D4', kn: '#EF4444',
  ml: '#6366F1', te: '#0EA5E9', ur: '#14B8A6', zh: '#EC4899',
  es: '#0EA5E9', fr: '#06B6D4', ar: '#F97316', pt: '#14B8A6',
  ru: '#8B5CF6', ja: '#EF4444', de: '#10B981', ko: '#F59E0B',
  th: '#EC4899', ne: '#06B6D4', 'de-CH': '#3B82F6',
};

export function LanguageSelector({ lang, setLang, t, compact = false, sidebar = false }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState('bottom');
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (langCode) => {
    setLang(langCode);
    setSearchQuery('');
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!open || !ref.current || !dropdownRef.current) return;
    const button = ref.current.querySelector('button');
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight || 400;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    if (spaceBelow < dropdownHeight + 20) {
      if (spaceAbove > dropdownHeight + 20) {
        setDropdownPos('top');
      } else {
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
            <input
              type="text"
              placeholder="Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {filteredLanguages.map((l) => (
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

  // Beautiful popup version (used in chat footer, mobile modal, settings)
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t ? t('select_language') : 'Select Language'}
        className="lang-selector-trigger"
      >
        <span style={{ fontSize: 16 }}>🌐</span>
        <span>{compact ? current.code.toUpperCase() : current.label}</span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className={`lang-selector-modal lang-selector-modal--${dropdownPos}`}
          style={{
            top: dropdownPos === 'bottom' ? (ref.current?.getBoundingClientRect()?.bottom || 0) + 8 : 'auto',
            bottom: dropdownPos === 'top' ? window.innerHeight - (ref.current?.getBoundingClientRect()?.top || 0) + 8 : 'auto',
            left: Math.min(window.innerWidth - 260, Math.max(8, (ref.current?.getBoundingClientRect()?.left || 0))),
          }}
        >
          {/* Header */}
          <div className="lang-modal-header">
            <div className="lang-modal-header-left">
              <div className="lang-modal-icon-wrap">🌐</div>
              <div>
                <div className="lang-modal-title">{t ? t('select_language') : 'Select Language'}</div>
                <div className="lang-modal-subtitle">Choose your preferred language</div>
              </div>
            </div>
            <button className="lang-modal-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Divider */}
          <div className="lang-modal-divider" />

          {/* Search Bar */}
          <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
            <input
              type="text"
              placeholder="🔍 Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
          </div>

          {/* Scrollable List */}
          <div className="lang-modal-list">
            {filteredLanguages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No languages found
              </div>
            ) : (
              filteredLanguages.map((l) => {
              const isActive = l.code === lang;
              const accent = LANG_ACCENT[l.code] || '#3B82F6';
              const initial = l.label.charAt(0).toUpperCase();

                return (
                  <button
                    key={l.code}
                    type="button"
                    className={`lang-modal-item ${isActive ? 'lang-modal-item--active' : ''}`}
                    onClick={() => { handleLanguageChange(l.code); setOpen(false); }}
                    style={{
                      borderLeftColor: isActive ? accent : 'transparent',
                    }}
                  >
                    {isActive && <div className="lang-modal-active-bar" style={{ backgroundColor: accent }} />}

                    <div className="lang-modal-badge" style={{
                      backgroundColor: accent + '20',
                      borderColor: accent + '40',
                    }}>
                      <span style={{ color: accent, fontWeight: 700 }}>{initial}</span>
                    </div>

                    <div className="lang-modal-labels">
                      <div className="lang-modal-native" style={{ color: isActive ? accent : '#1E293B' }}>
                        {l.label}
                      </div>
                    </div>

                    {isActive ? (
                      <div className="lang-modal-check" style={{ backgroundColor: accent }}>✓</div>
                    ) : (
                      <div className="lang-modal-check-empty" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="lang-modal-footer">
            <div className="lang-modal-footer-pill" />
          </div>
        </div>
      )}
    </div>
  );
}
