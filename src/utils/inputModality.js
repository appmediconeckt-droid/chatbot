export function initializeInputModality(doc = document) {
  doc.documentElement.dataset.inputModality = 'keyboard';
  const pointer = () => { doc.documentElement.dataset.inputModality = 'pointer'; };
  const keyboard = event => {
    if (event.key === 'Tab') doc.documentElement.dataset.inputModality = 'keyboard';
  };
  doc.addEventListener('pointerdown', pointer, true);
  doc.addEventListener('keydown', keyboard, true);
  return () => {
    doc.removeEventListener('pointerdown', pointer, true);
    doc.removeEventListener('keydown', keyboard, true);
  };
}
