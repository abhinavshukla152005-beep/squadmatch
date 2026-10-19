import { BLOCKS, DAYS } from '../lib/availability';
import { toggleSlot } from '../lib/availability';

const QUICK = [
  { label: 'Weekends', slots: ['sat-am', 'sat-mid', 'sat-eve', 'sun-am', 'sun-mid', 'sun-eve'] },
  { label: 'Weeknights', slots: ['mon-eve', 'tue-eve', 'wed-eve', 'thu-eve', 'fri-eve'] },
  { label: 'Daytime', slots: ['sat-am', 'sat-mid', 'sun-am', 'sun-mid'] },
];

export default function AvailabilityGrid({ value = [], onChange, highlight = [], disabled = false }) {
  const set = new Set(value);
  const hi = new Set(highlight);

  const cellState = (slot) => {
    if (set.has(slot) && hi.has(slot)) return 'both';
    if (set.has(slot)) return 'mine';
    if (hi.has(slot)) return 'theirs';
    return 'off';
  };

  return (
    <div>
      <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-1.5 text-center">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {d}
          </span>
        ))}
        {BLOCKS.map((b) => (
          <div key={b.id} className="contents">
            <span className="flex items-center gap-1.5 pr-2 text-xs text-ink-soft whitespace-nowrap">
              {b.label}
              <span className="hidden lg:inline text-muted text-[10px]">{b.hint}</span>
            </span>
            {DAYS.map((d) => {
              const slot = `${d.toLowerCase()}-${b.id}`;
              const state = cellState(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(toggleSlot(value, slot))}
                  title={slot}
                  className={`h-9 rounded-lg border text-[11px] font-semibold transition-all duration-150 disabled:cursor-default ${
                    {
                      both: 'bg-brand text-white border-brand shadow-card',
                      mine: 'bg-ink text-paper border-ink',
                      theirs: 'bg-lime/40 border-lime text-ink',
                      off: 'bg-surface border-line text-transparent hover:border-ink/25 hover:bg-ink/[0.04]',
                    }[state]
                  }`}
                >
                  {state === 'both' ? '✓' : state === 'mine' ? '•' : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange([...new Set([...value, ...q.slots])])}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft hover:border-ink/25 hover:text-ink cursor-pointer"
            >
              + {q.label}
            </button>
          ))}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-muted hover:text-rose cursor-pointer"
            >
              Clear all {value.length} blocks
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <Legend className="bg-ink" label="Your free block" />
        {highlight.length > 0 && <Legend className="bg-brand" label="You both are free" />}
        {highlight.length > 0 && <Legend className="bg-lime/60" label="They are free" />}
      </div>
    </div>
  );
}

function Legend({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded ${className}`} /> {label}
    </span>
  );
}
