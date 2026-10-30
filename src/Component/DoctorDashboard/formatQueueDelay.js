export function formatQueueDelay(value) {
  const numeric = Number(value);
  const minutes = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}${remainder ? ` ${remainder} min` : ''}`;
}
