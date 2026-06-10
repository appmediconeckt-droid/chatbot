# Translation Debugging Guide

## Step-by-Step Testing

### 1. **Clear Cache and Refresh**
```javascript
// Open Browser Console (F12 > Console tab) and run:
localStorage.clear();
location.reload();
```

### 2. **Test Translation Service Directly**
```javascript
// In browser console, test the translation API:
fetch('https://api.mymemory.translated.net/get?q=hello&langpair=en|hi')
  .then(r => r.json())
  .then(d => console.log('Translation result:', d.responseData.translatedText))
```

Expected output: `नमस्ते` (hello in Hindi)

### 3. **Test Full Flow**
Follow these exact steps:

**Step A: Load Chat**
1. Log in as user
2. Open a chat with a counselor
3. **Wait 3-5 seconds** for messages to load
4. Check console for logs like:
   ```
   🔄 Translating to hi: [message text]...
   ✓ MyMemory: [original] → [translated]
   ```

**Step B: Switch Language**
1. Click language selector (🌐)
2. Select **हिन्दी** (Hindi)
3. **Watch console immediately** - you should see translation logs
4. **Wait 5-10 seconds** for translation to complete

**Step C: Verify Results**
- Chat messages should show in Hindi
- Counselor name should be visible
- If messages are still in English, check console for errors

### 4. **Common Console Messages**

✅ **Good - Translation working:**
```
🌐 Starting translation to language: hi Messages count: 5
📝 Translating 5 messages...
✓ MyMemory: hello → नमस्ते
✅ Translation complete! Updating UI...
```

❌ **Bad - Translation not working:**
```
Translation skipped: lang = en messages = 0
⚠️ MyMemory API error: network error
❌ Translation failed for: [message]
```

### 5. **Check Network Activity**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Select language
4. Look for requests to:
   - `api.mymemory.translated.net` ✅ (Should work)
   - `translate.google.com` ⚠️ (Fallback)
5. Click each request to see status (should be 200 OK)

### 6. **Test Each Component Separately**

**Test ChatInterface (Chat List):**
```
1. Go to AI Chat tab (ChatInterface)
2. View last message in each chat item
3. Switch language
4. Last messages should translate
5. Check console for "ChatInterface" logs
```

**Test ChatBox (Active Chat):**
```
1. Open a chat conversation
2. Load messages
3. Switch language
4. All messages should translate
5. Check console for "ChatBox" logs
```

### 7. **If Translation Not Working**

**Try this sequence:**

1. **Clear everything:**
   ```javascript
   localStorage.clear()
   localStorage.removeItem('messageTranslations_v2')
   location.reload()
   ```

2. **Wait for messages to load** (watch console)

3. **Switch language slowly:**
   - Click language button
   - Wait 2 seconds
   - Select language
   - Wait 5-10 seconds
   - Check if messages changed

4. **Check browser:**
   - Chrome: ✅ Works well
   - Firefox: ✅ Works well
   - Safari: ⚠️ Might have CORS issues

5. **Check internet:**
   - Disable VPN if using one
   - Try on mobile hotspot
   - MyMemory API might be blocked

### 8. **Manual Test in Console**

```javascript
// Test if originalMessages has data
console.log('Original messages:', window.__originalMessages)

// Test translation function
import { translateMessage } from '/src/services/messageTranslationService.js'
translateMessage('hello', 'hi').then(result => console.log(result))
```

## Expected Timeline

After selecting a different language:
- **0-2 seconds:** Console shows "Starting translation"
- **2-5 seconds:** Each message gets translated
- **5-10 seconds:** All messages appear on screen in new language

If nothing happens after 10 seconds, check console for errors.

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Chat still English | originalMessages empty | Wait for messages to load first |
| Messages not updating | API blocked | Check network tab, try VPN off |
| Very slow translation | API slow | Normal, can take 10+ seconds |
| Some messages English | Translation failed | Check console for specific errors |
| Cache issue | Old translations cached | Run `localStorage.clear()` |

## API Status Check

Open console and run:
```javascript
// Check MyMemory API
fetch('https://api.mymemory.translated.net/get?q=test&langpair=en|hi')
  .then(r => r.json())
  .then(d => console.log('MyMemory Status:', d.responseStatus === 200 ? '✓ OK' : '✗ Failed'))

// Check Google Translate (might be blocked)
fetch('https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=hello')
  .then(r => r.json())
  .then(d => console.log('Google Status:', d ? '✓ OK' : '✗ Failed'))
  .catch(e => console.log('Google Status: ✗ Blocked or Failed'))
```

## Get Help

1. Open DevTools (F12)
2. Go to Console tab
3. Select a language
4. **Copy all logs** that appear
5. Check if you see:
   - ✅ "Starting translation" message
   - ✅ Individual message translations
   - ❌ or error messages

If errors appear, that's the issue to fix!
