# Language Implementation for Chat Messages

## Overview
Implemented automatic message translation when users/counselors switch languages in the chat interface. Messages that were originally in English are now translated to the selected language using Google Translate API as a fallback.

## Changes Made

### 1. New Translation Service
**File:** `src/services/messageTranslationService.js`
- Created a message translation service that:
  - Attempts to use backend `/api/translate` endpoint first
  - Falls back to Google Translate API if backend is unavailable
  - Implements client-side caching to avoid repeated API calls
  - Caches translations for 24 hours in localStorage

### 2. User Side Chat Components

#### ChatBox.jsx
- Imports `useUserTranslation()` hook to get current language
- Tracks original messages in `originalMessages` state
- Translates all messages when language changes via `lang` dependency
- Updates both incoming and sent messages with translations

#### ChatInterface.jsx (Chat List)
- Imports translation service
- Tracks original counselor list in `originalCounselors`
- Translates last messages in chat list when language changes
- Users see translated message previews in their chat history

### 3. Counselor Side Chat Components

#### Messagesou.jsx (Message List)
- Imports `useCounselorTranslation()` hook
- Tracks original user list in `originalUsers`
- Translates last messages in chat list when language changes
- Counselors see translated message previews

#### SMSInput.jsx (Chat Interface)
- Imports translation service and counselor translation hook
- Tracks original messages in `originalMessages`
- Translates all messages when language changes
- Similar to ChatBox.jsx but for counselor side

## How It Works

1. **Language Selection:** When user/counselor selects a language using LanguageSelector
2. **Dependency Tracking:** Components watch the `lang` variable from context
3. **Translation Trigger:** When `lang` changes, a useEffect automatically translates all messages
4. **Caching:** Translations are cached to improve performance
5. **Graceful Fallback:** If translation fails, original messages are shown

## Supported Languages
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Kannada (kn)
- Malayalam (ml)
- Bengali (bn)
- Gujarati (gu)
- Marathi (mr)

## Technical Details

### Translation Flow
```
User selects language → Language context updates
                     → Component detects lang change
                     → useEffect triggers
                     → Messages translated via API
                     → UI updated with translations
```

### Caching Strategy
- Translations cached by: `text_snippet + language`
- Cache stored in localStorage with 24-hour expiry
- Avoids repeated API calls for same text

### Error Handling
- Backend endpoint fails → Falls back to Google Translate API
- Google Translate fails → Shows original English text
- Individual message translation fails → Shows original for that message

## Files Modified
1. `src/services/messageTranslationService.js` - NEW
2. `src/Component/UserDashboard/Tab/ChatBox/ChatBox.jsx`
3. `src/Component/UserDashboard/Tab/chatbot/ChatInterface.jsx`
4. `src/Component/counselor-dashboard/Tab/Messages/Messagesou.jsx`
5. `src/Component/counselor-dashboard/Tab/SMSInput/SMSInput.jsx`

## Testing
To test the implementation:
1. Log in as user or counselor
2. Start/open a chat
3. Select a different language from the language selector
4. Verify that chat messages are translated to the selected language
5. Switch back to English to verify original messages
6. Try with multiple languages

## Notes
- Only counselor messages sent in English are translated
- User messages are not translated (users typically type in their own language)
- Translations are cached to minimize API calls
- Google Translate API has rate limits, consider implementing backend translation for production
