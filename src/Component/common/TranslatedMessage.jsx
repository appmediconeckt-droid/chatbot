import React, { useState, useEffect } from 'react';
import './TranslatedMessage.css';

const TranslatedMessage = ({ text, translate, lang }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    // en-US is the default language. Render English messages unchanged rather
    // than calling a translation provider with an equivalent target language.
    if (String(lang || '').toLowerCase().split('-')[0] === 'en') {
      setDisplayText(text);
      setIsTranslating(false);
      return;
    }

    console.log(`🔄 Translating "${text.substring(0, 30)}..." to ${lang}`);
    setIsTranslating(true);

    translate(text)
      .then(translated => {
        console.log(`✅ Translated to: "${translated?.substring(0, 30)}..."`);
        setDisplayText(translated || text);
      })
      .catch(err => {
        console.error('❌ Translation failed:', err);
        setDisplayText(text);
      })
      .finally(() => {
        setIsTranslating(false);
      });
  }, [text, lang, translate]);

  return (
    <p className="chatMsgText">
      {displayText}
      {isTranslating && <span className="translating-indicator" title="Translating...">🔄</span>}
    </p>
  );
};

export default TranslatedMessage;
