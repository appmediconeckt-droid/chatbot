// The launcher configures only a dedicated LED Chrome profile on the receiver.
// Never insert arbitrary link text into a Windows command file.
export function createLedReceiverLauncher(displayUrl) {
  const url = new URL(displayUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      !/^[a-z0-9.\-:\[\]]+$/i.test(url.host) ||
      !/^\/display\/(?:clinic\/)?[a-zA-Z0-9_-]{1,191}$/.test(url.pathname) || url.search || url.hash) {
    throw new Error('Use a valid Humaeli LED display link.');
  }
  const link = `${url.origin}${url.pathname}`;
  return [
    '@echo off', 'setlocal',
    'rem Run this file on the receiving Windows laptop or LED/TV PC.',
    'rem Chrome uses a separate LED profile; normal browser settings stay unchanged.',
    `set "HUMAELI_LED_URL=${link}"`,
    'set "HUMAELI_LED_CHROME="',
    'if exist "%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe" set "HUMAELI_LED_CHROME=%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe"',
    'if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "HUMAELI_LED_CHROME=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"',
    'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "HUMAELI_LED_CHROME=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined HUMAELI_LED_CHROME (',
    '  echo Google Chrome was not found. Install Chrome on this receiving device, then run this file again.',
    '  pause', '  exit /b 1', ')',
    'start "" "%HUMAELI_LED_CHROME%" --user-data-dir="%LOCALAPPDATA%\\Humaeli\\LEDReceiver" --no-first-run --autoplay-policy=no-user-gesture-required --start-fullscreen --app="%HUMAELI_LED_URL%"',
    'endlocal', '',
  ].join('\r\n');
}

export function downloadLedReceiverLauncher(displayUrl) {
  const blob = new Blob([createLedReceiverLauncher(displayUrl)], { type: 'application/octet-stream' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'Humaeli-LED-Receiver.cmd';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
