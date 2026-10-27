// Keep demo and live balances separate, while opening the latest payment's view.
export function earningsMode(data, selected = 'auto') {
  if (selected === 'demo' || selected === 'live') return selected;
  const latest = rows => Math.max(0, ...(rows || []).map(row => Date.parse(row.createdAt) || 0));
  if (data?.demo?.transactions?.length && (!data?.transactions?.length || latest(data.demo.transactions) > latest(data.transactions))) return 'demo';
  return 'live';
}
