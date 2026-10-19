export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const BLOCKS = [
  { id: 'am', label: 'Morning', hint: '7 – 12' },
  { id: 'mid', label: 'Afternoon', hint: '12 – 5' },
  { id: 'eve', label: 'Evening', hint: '5 – 11' },
];

export const ALL_SLOTS = DAYS.flatMap((d) => BLOCKS.map((b) => `${d.toLowerCase()}-${b.id}`));

export function slotLabel(slot) {
  const [day, blockId] = slot.split('-');
  const block = BLOCKS.find((b) => b.id === blockId);
  return `${day.toUpperCase()} ${block ? block.label : blockId}`;
}

export function slotsSummary(slots = []) {
  if (!slots.length) return 'No availability set';
  const byDay = {};
  slots.forEach((slot) => {
    const [day] = slot.split('-');
    const nice = day.charAt(0).toUpperCase() + day.slice(1);
    byDay[nice] = byDay[nice] || [];
    byDay[nice].push(slot.split('-')[1]);
  });
  return DAYS.filter((d) => byDay[d])
    .map((d) => `${d} ${byDay[d].map((b) => blockShort(b)).join('/')}`)
    .join(' · ');
}

export function blockShort(blockId) {
  return { am: 'AM', mid: 'PM', eve: 'EVE' }[blockId] ?? blockId;
}

export function overlapSlots(a = [], b = []) {
  const setB = new Set(b);
  return a.filter((slot) => setB.has(slot));
}

export function toggleSlot(slots, slot) {
  return slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot];
}
