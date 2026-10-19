import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { Button, Card, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import { fetchCommunityProfiles } from '../lib/api';
import { DAYS } from '../lib/availability';
import { SKILL_CATALOG, laneOf } from '../lib/skills';

export default function Browse() {
  const { user } = useAuth();
  const [community, setCommunity] = useState([]);
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState('all');
  const [day, setDay] = useState('all');

  useEffect(() => {
    fetchCommunityProfiles(user?.id).then(setCommunity).catch(() => setCommunity([]));
  }, [user]);

  const pool = useMemo(
    () => [
      ...SAMPLE_PROFILES,
      ...community.map((r) => ({ ...r, lane: r.lane || laneOf(r.skills?.[0]), tagline: r.tagline || r.pitch })),
    ],
    [community],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((p) => {
      const matchesQuery =
        !q ||
        [p.name, p.role, p.tagline, p.idea, ...(p.skills ?? []), ...(p.needs ?? [])]
          .filter(Boolean)
          .some((text) => text.toLowerCase().includes(q));
      const matchesLane = lane === 'all' || (p.lane || laneOf(p.skills?.[0])) === lane;
      const matchesDay = day === 'all' || (p.slots ?? []).some((s) => s.startsWith(`${day}-`));
      return matchesQuery && matchesLane && matchesDay;
    });
  }, [pool, query, lane, day]);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight">Browse builders</h1>
          <p className="mt-2 text-[15.5px] text-ink-soft">
            {SAMPLE_PROFILES.length} sample profiles{community.length > 0 && ` + ${community.length} from your Supabase project`} — this is the pool{' '}
            <Link to="/studio" className="text-brand font-medium hover:underline">
              Squad Studio
            </Link>{' '}
            ranks against.
          </p>
        </div>
        <Link to="/studio">
          <Button variant="brand">Find my squad</Button>
        </Link>
      </header>

      <Card className="mt-6 p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills, roles, ideas…"
          className={`${inputClass} lg:max-w-xs`}
        />
        <div className="flex flex-wrap gap-1.5 flex-1">
          <Chip active={lane === 'all'} onClick={() => setLane('all')}>
            All lanes
          </Chip>
          {SKILL_CATALOG.map((g) => (
            <Chip key={g.lane} active={lane === g.lane} onClick={() => setLane(g.lane)}>
              {g.group}
            </Chip>
          ))}
        </div>
        <select value={day} onChange={(e) => setDay(e.target.value)} className={`${inputClass} lg:w-auto lg:py-2`}>
          <option value="all">Any day</option>
          {DAYS.map((d) => (
            <option key={d} value={d.toLowerCase()}>
              Free on {d}
            </option>
          ))}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">No profile matches those filters. Clear the search or pick another day.</p>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProfileCard key={p.id} profile={p} badge={p.id.startsWith('sample-') ? 'Sample' : 'Community'} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition cursor-pointer border ${
        active ? 'bg-ink text-paper border-ink' : 'bg-surface text-ink-soft border-line hover:border-ink/30'
      }`}
    >
      {children}
    </button>
  );
}
