import { squadSummary } from '../lib/matcher';
import { blockShort } from '../lib/availability';
import SkillTag, { laneStyle } from './SkillTag';
import { Card } from './ui';

export default function SquadSummary({ demand, squad = [], maxPicks = 3 }) {
  const s = squadSummary(demand, squad);
  const needs = demand.needs ?? [];

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Squad summary</h3>
          <p className="text-[13px] text-muted mt-0.5">
            {squad.length} of {maxPicks} shortlisted · average match {s.avgScore || 0}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {s.lanes.map((lane) => {
            const c = laneStyle(lane);
            return (
              <span
                key={lane}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                style={{ background: c.bg, color: c.fg }}
              >
                {lane}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Block title="Gaps covered" count={`${s.coveredGaps.length}/${needs.length || 0}`}>
          {needs.length === 0 ? (
            <p className="text-[13px] text-muted">You did not list any missing skills — add them in the Studio for sharper matches.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {s.coveredGaps.map((skill) => (
                  <SkillTag key={skill} skill={skill} state="match" />
                ))}
              </div>
              {s.remainingGaps.length > 0 && (
                <p className="text-[12.5px] text-ink-soft">
                  Still open:{' '}
                  <span className="font-semibold text-rose">{s.remainingGaps.join(', ')}</span>
                </p>
              )}
            </div>
          )}
        </Block>

        <Block title="Combined skill set" count={`${s.combinedSkills.length} skills`}>
          <div className="flex flex-wrap gap-1.5">
            {s.combinedSkills.slice(0, 14).map((skill) => (
              <SkillTag key={skill} skill={skill} state="own" />
            ))}
            {s.combinedSkills.length > 14 && (
              <span className="text-[12px] text-muted self-center">+{s.combinedSkills.length - 14} more</span>
            )}
          </div>
        </Block>

        <Block title="Shared time with you" count={s.commonWithMe.length ? `${s.commonWithMe.length} block${s.commonWithMe.length > 1 ? 's' : ''} everyone is free` : 'none'}>
          {s.busiest.length === 0 ? (
            <p className="text-[13px] text-muted">No calendar overlap yet — your squad members are free at different times.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {s.busiest.map(({ slot, count }) => (
                <span
                  key={slot}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ${
                    count >= squad.length && squad.length > 1 ? 'bg-brand text-white' : 'bg-ink/[0.06] text-ink-soft'
                  }`}
                >
                  {slot.split('-')[0].toUpperCase()} {blockShort(slot.split('-')[1])}
                  <span className="opacity-70 ml-1">×{count}</span>
                </span>
              ))}
            </div>
          )}
        </Block>

        <Block title="Coverage health" count={`${Math.round((s.coveredGaps.length / (needs.length || 1)) * 100)}%`}>
          <div className="h-2 rounded-full bg-ink/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-all duration-500"
              style={{ width: `${Math.min(100, (s.coveredGaps.length / (needs.length || 1)) * 100)}%` }}
            />
          </div>
          <p className="text-[12.5px] text-muted mt-2">
            {s.remainingGaps.length === 0 && needs.length > 0
              ? 'Every listed gap has an owner. Ship it.'
              : `Next best hire should bring: ${s.remainingGaps.slice(0, 3).join(', ') || 'depth in what you already have'}.`}
          </p>
        </Block>
      </div>
    </Card>
  );
}

function Block({ title, count, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h4>
        {count && <span className="text-[11px] font-semibold text-ink-soft">{count}</span>}
      </div>
      {children}
    </div>
  );
}
