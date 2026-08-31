import React, { useState, useEffect } from 'react';
import './TranslatedMessage.css';

const MENTION_PATTERN = /(^|\s)(@[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}.'’_-]*(?:\s+[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}.'’_-]*){0,3})(?=\s|$|[,.!?;:])/gu;

const TranslatedMessage = ({ text, translate, lang, onConsultantMentionClick }) => {
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
