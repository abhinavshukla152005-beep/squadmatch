import { slotsSummary } from '../lib/availability';
import SkillTag, { laneStyle } from './SkillTag';
import { initials } from './Nav';

export default function ProfileCard({ profile, needs = [], match, reasons, footer, badge, className = '' }) {
  const color = laneStyle(profile.lane);
  const needSet = new Set(needs.map((n) => n.toLowerCase()));

  return (
    <article
      className={`bg-surface border border-line rounded-[20px] p-5 flex flex-col gap-3.5 shadow-card ${className}`}
    >
      <header className="flex items-start gap-3.5">
        <div
          className="h-11 w-11 shrink-0 rounded-2xl grid place-items-center font-display font-bold text-[15px]"
          style={{ background: color.bg, color: color.fg }}
        >
          {initials(profile.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[17px] leading-tight truncate">{profile.name}</h3>
            {badge && (
              <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[13px] text-muted mt-0.5">
            {profile.role}
            {profile.year ? ` · ${profile.year}` : ''}
          </p>
        </div>
        {match !== undefined && <Score value={match} />}
      </header>

      {profile.tagline && <p className="text-[14px] text-ink-soft -mt-1">{profile.tagline}</p>}

      <div className="flex flex-wrap gap-1.5">
        {profile.skills.map((skill) => (
          <SkillTag
            key={skill}
            skill={skill}
            state={needSet.has(skill.toLowerCase()) ? 'match' : 'own'}
            title={needSet.has(skill.toLowerCase()) ? 'Covers one of your gaps' : undefined}
          />
        ))}
      </div>

      {profile.needs?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="text-muted text-[11px] uppercase tracking-wide font-semibold mr-1">Wants</span>
          {profile.needs.slice(0, 4).map((skill) => (
            <SkillTag key={skill} skill={skill} state="need" />
          ))}
        </div>
      )}

      {profile.idea && (
        <p className="border-l-2 border-line pl-3 text-[13.5px] text-muted italic leading-snug">
          {profile.idea}
        </p>
      )}

      {profile.slots?.length > 0 && (
        <p className="flex items-start gap-2 text-[12.5px] text-ink-soft">
          <svg viewBox="0 0 20 20" className="h-4 w-4 mt-0.5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="4.5" width="14" height="12" rx="2.5" />
            <path d="M3 8h14M7 3v3M13 3v3" strokeLinecap="round" />
          </svg>
          <span className="leading-snug">{slotsSummary(profile.slots)}</span>
        </p>
      )}

      {reasons?.length > 0 && (
        <ul className="rounded-xl bg-brand-soft/60 p-3 space-y-1.5">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-snug text-ink-soft">
              <span className="text-brand font-bold mt-px">→</span>
              {r}
            </li>
          ))}
        </ul>
      )}

      {footer && <div className="mt-auto pt-1">{footer}</div>}
    </article>
  );
}

function Score({ value }) {
  const tone = value >= 75 ? 'bg-lime text-ink' : value >= 55 ? 'bg-brand text-white' : 'bg-ink/[0.06] text-ink-soft';
  return (
    <div className="text-center shrink-0">
      <div className={`h-12 w-12 rounded-2xl grid place-items-center font-display font-bold text-[15px] ${tone}`}>
        {value}
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted mt-1">match</p>
    </div>
  );
}
