import React, { forwardRef, useContext, useEffect, useState } from 'react';
import { usePortalLanguage } from '../../i18n/LanguageContext';
import { formatPortalTemplate, lookupPortalCopy } from '../../i18n/portalCopy';
import { translationService } from '../../i18n/translationService';
import { LanguageSelector } from './LanguageSelector';
import { PortalLanguageScope } from './portalLanguageScope';
const queued = new Map();
let timer;
function requestCopy(text, lang) {
 const key = `${lang}:${text}`;
 if (queued.has(key)) return queued.get(key).promise;
 let resolve;
 const promise = new Promise(done => { resolve = done; });
 queued.set(key, { text, lang, promise, resolve });
 if (!timer) timer = setTimeout(async () => {
  timer = null;
  const jobs = [...queued.entries()].filter(([, job]) => !job.started);
  for (const [, job] of jobs) job.started = true;
  const languages = [...new Set(jobs.map(([, job]) => job.lang))];
  await Promise.all(languages.map(async language => {
   const group = jobs.filter(([, job]) => job.lang === language);
   try {
    const values = await translationService.translateBatch(group.map(([, job]) => job.text), language, 'en');
    group.forEach(([jobKey, job], index) => { job.resolve(values[index] || job.text); queued.delete(jobKey); });
   } catch {
    group.forEach(([jobKey, job]) => { job.resolve(job.text); queued.delete(jobKey); });
   }
  }));
 }, 25);
 return promise;
}
function usePortalCopy(text) {
 const scope = useContext(PortalLanguageScope);
 const { lang, messages } = usePortalLanguage(scope);
 const staticCopy = lookupPortalCopy(text, lang, messages);
 const [translated, setTranslated] = useState(null);
 useEffect(() => {
  let active = true;
  if (staticCopy === null && text) requestCopy(text.trim(), lang).then(value => {
   if (active) setTranslated({ text, lang, value });
  });
  return () => { active = false; };
 }, [text, lang, staticCopy]);
 const copy = staticCopy ?? (translated?.text === text && translated?.lang === lang ? translated.value : text);
 if (!text || copy === text) return copy;
 return `${text.match(/^\s*/)?.[0] || ''}${copy.trim()}${text.match(/\s*$/)?.[0] || ''}`;
}
export function PortalText({ text }) { return usePortalCopy(text); }
export function PortalTemplate({ text, values }) {
 const localized = usePortalCopy(text);
 return formatPortalTemplate(localized, text, values);
}
export const PortalElement = forwardRef(function PortalElement({ as: Tag, children, ...props }, ref) {
 const placeholder = usePortalCopy(typeof props.placeholder === 'string' ? props.placeholder : '');
 const title = usePortalCopy(typeof props.title === 'string' ? props.title : '');
 const ariaLabel = usePortalCopy(typeof props['aria-label'] === 'string' ? props['aria-label'] : '');
 const option = usePortalCopy(Tag === 'option' && typeof children === 'string' ? children : '');
 return <Tag {...props} ref={ref} {...(props.placeholder ? {placeholder} : {})} {...(props.title ? {title} : {})} {...(props['aria-label'] ? {'aria-label': ariaLabel} : {})}>{Tag === 'option' && option ? option : children}</Tag>;
});
export function PatientLanguageControl() {
 const { lang, setLang, t } = usePortalLanguage('patient');
 return <div className="patient-language-control" lang={lang}><LanguageSelector lang={lang} setLang={setLang} t={t} /></div>;
}
