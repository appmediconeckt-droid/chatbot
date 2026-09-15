import React, { useState, useEffect } from 'react';
import './TranslatedMessage.css';
import { translationService } from '../../i18n/translationService';

const MENTION_PATTERN = /(^|\s)(@[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}.'’_-]*(?:\s+[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}.'’_-]*){0,3})(?=\s|$|[,.!?;:])/gu;

const TRANSLATION_ERROR_PATTERN = /please select two distinct languages|invalid language pair|translation failed/i;

const TranslatedMessage = ({ text, lang, onConsultantMentionClick }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!text) {
      setDisplayText('');
      return () => { cancelled = true; };
    }

    // Preserve human chat text exactly when English is selected. Auto-detect
    // translation to English can misread short text ("hii" -> "Huh") or
    // return a provider error as if it were the translated message.
    const targetLanguage = String(lang || 'en').split('-')[0].toLowerCase();
    if (targetLanguage === 'en') {
      setDisplayText(text);
      setIsTranslating(false);
      return () => { cancelled = true; };
    }

    console.log(`🔄 Translating "${text.substring(0, 30)}..." to ${lang}`);
    setIsTranslating(true);

    translationService.translate(text, lang, 'auto')
      .then(translated => {
        console.log(`✅ Translated to: "${translated?.substring(0, 30)}..."`);
        const safeTranslation =
          typeof translated === 'string' &&
          translated.trim() &&
          !TRANSLATION_ERROR_PATTERN.test(translated)
            ? translated
            : text;
        if (!cancelled) setDisplayText(safeTranslation);
      })
      .catch(err => {
        console.error('❌ Translation failed:', err);
        if (!cancelled) setDisplayText(text);
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => { cancelled = true; };
  }, [text, lang]);

  const renderText = () => {
    if (!onConsultantMentionClick || typeof displayText !== 'string') return displayText;

    const parts = [];
    let lastIndex = 0;
    for (const match of displayText.matchAll(MENTION_PATTERN)) {
      const mentionStart = match.index + match[1].length;
      const mention = match[2];
      if (mentionStart > lastIndex) parts.push(displayText.slice(lastIndex, mentionStart));
      parts.push(
        <button
          type="button"
          className="consultant-mention-link"
          key={`${mentionStart}-${mention}`}
          onClick={() => onConsultantMentionClick(mention.slice(1).trim())}
          title={`View ${mention.slice(1).trim()}'s consultant profile`}
        >
          {mention}
        </button>,
      );
      lastIndex = mentionStart + mention.length;
    }
    if (lastIndex === 0) return displayText;
    if (lastIndex < displayText.length) parts.push(displayText.slice(lastIndex));
    return parts;
  };

  return (
    <p className="chatMsgText">
      {renderText()}
      {isTranslating && <span className="translating-indicator" title="Translating...">🔄</span>}
    </p>
  );
};

export default TranslatedMessage;
