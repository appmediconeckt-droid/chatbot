import test from 'node:test';
import assert from 'node:assert/strict';
import { createLedReceiverLauncher } from '../src/Component/common/ledReceiverLauncher.js';

test('receiver launcher opens the same display with autoplay in a dedicated Chrome profile', () => {
  for (const url of ['https://humaeli.com/display/clinic/clinic-1', 'https://humaeli.com/display/tv-1']) {
    const script = createLedReceiverLauncher(url);
    assert.ok(script.includes(`set "HUMAELI_LED_URL=${url}"`));
    assert.ok(script.includes('--autoplay-policy=no-user-gesture-required'));
    assert.ok(script.includes('--user-data-dir="%LOCALAPPDATA%\\Humaeli\\LEDReceiver"'));
    assert.ok(script.includes('start "" "%HUMAELI_LED_CHROME%"'));
    assert.ok(script.includes('--app="%HUMAELI_LED_URL%"'));
    assert.ok(script.includes('Google\\Chrome\\Application\\chrome.exe'));
    assert.ok(!script.replace(/\r\n/g, '').includes('\n'));
  }
});

test('receiver launcher rejects command injection and non-display URLs', () => {
  for (const url of [
    'javascript:alert(1)', 'file:///display/tv-1', 'https://user:pass@humaeli.com/display/tv-1',
    'https://humaeli.com/display/tv-1?x=%PATH%', 'https://humaeli.com/display/tv-1#%PATH%',
    'https://humaeli.com/display/tv-1%22%26calc', 'https://humaeli.com/profile',
    'https://humaeli.com&calc/display/tv-1',
  ]) assert.throws(() => createLedReceiverLauncher(url));
});
