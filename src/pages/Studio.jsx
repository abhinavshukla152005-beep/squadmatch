import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AvailabilityGrid from '../components/AvailabilityGrid';
import ProfileCard from '../components/ProfileCard';
import SkillInput from '../components/SkillInput';
import SquadSummary from '../components/SquadSummary';
import { Button, Card, Field, Spinner, Step, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import { addPick, candidateFromPick, fetchCommunityProfiles, fetchShortlist, upsertProfile } from '../lib/api';
import { findSquad } from '../lib/matcher';
import { laneOf } from '../lib/skills';
import { slotsSummary } from '../lib/availability';

const DRAFT_KEY = 'squadmatch:draft.v1';

const EMPTY = {
  name: '',
  role: '',
  year: '',
  skills: [],
  idea: '',
  needs: [],
  slots: [],
};

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return draft ? { ...EMPTY, ...draft } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function Studio() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(loadDraft);
  const [results, setResults] = useState([]);
  const [poolSize, setPoolSize] = useState(SAMPLE_PROFILES.length);
  const [busy, setBusy] = useState(false);
  const [picks, setPicks] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const savedIds = useMemo(() => new Set(picks.map((p) => p.candidate_id)), [picks]);
  const squad = useMemo(() => picks.map(candidateFromPick), [picks]);

  useEffect(() => {
    if (!profile) return;
    // Only non-empty database values win, so a freshly triggered (blank) profile
    // never discards what the student just typed.
    setForm((f) => {
      const saved = {};
      for (const key of ['name', 'role', 'year', 'idea', 'tagline']) {
        if (profile[key]) saved[key] = profile[key];
      }
      for (const key of ['skills', 'needs', 'slots']) {
        if (profile[key]?.length) saved[key] = profile[key];
      }
      return { ...f, ...saved };
    });
  }, [profile?.id]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!user) return;
    fetchShortlist(user.id)
      .then(setPicks)
      .catch(() => {});
  }, [user]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validation = useMemo(() => {
    const problems = [];
    if (!form.skills.length) problems.push('Add at least one skill you bring.');
    if (form.slots.length < 2) problems.push('Mark at least two free blocks — overlap is 30% of the score.');
    if (form.idea.trim().length < 12) problems.push('Write a one-line project idea so keyword affinity can work.');
    return problems;
  }, [form]);

  async function runMatch() {
    setError('');
    if (validation.length) {
      setError(validation[0]);
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      if (user) await upsertProfile(user.id, form).catch(() => null);
      const community = user ? await fetchCommunityProfiles(user.id).catch(() => []) : [];
      const pool = [...toPool(community), ...SAMPLE_PROFILES];
      setPoolSize(pool.length);
      const demand = { userId: user?.id, ...form };
      setResults(findSquad(demand, pool, { limit: 3 }));
    } finally {
      setBusy(false);
    }
  }

  async function addToSquad(match) {
    if (!user) {
      navigate('/auth', { state: { next: '/studio' } });
      return;
    }
    if (picks.length >= 3) {
      setError('Your shortlist already has three builders — remove one on the squad page first.');
      return;
    }
    try {
      const pick = await addPick(user.id, match, picks.length);
      setPicks((prev) => [...prev, pick]);
      setStatus(`Saved ${match.name} to your shortlist. Edit notes and order on the squad page.`);
    } catch (err) {
      setError(`${err.message} — if the tables do not exist yet, run db/schema.sql in the Supabase SQL Editor.`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight">Squad Studio</h1>
        <p className="mt-2 text-[15.5px] text-ink-soft leading-relaxed">
          Four fields, one button. Everything below is your input; the matcher is deterministic, so the
          same answers always give the same three suggestions.
        </p>
      </header>

      <div className="mt-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <Card className="p-5 sm:p-7 space-y-8">
          <Step index="1" title="Who are you?" subtitle="This is what teammates see in the directory.">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Name" className="sm:col-span-2">
                <input className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aria Mehta" />
              </Field>
              <Field label="Year / dept">
                <input className={inputClass} value={form.year} onChange={(e) => set({ year: e.target.value })} placeholder="2nd year · CSE" />
              </Field>
              <Field label="Role" className="sm:col-span-3">
                <input
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => set({ role: e.target.value })}
                  placeholder="Frontend engineer, product designer, ML tinkerer…"
                />
              </Field>
            </div>
          </Step>

          <Step index="2" title="What can you already do?" subtitle="Your own skills — candidates who repeat these score lower.">
            <SkillInput value={form.skills} onChange={(skills) => set({ skills })} placeholder="React, Postgres, Figma… press Enter" />
          </Step>

          <Step index="3" title="Your project idea" subtitle="One or two sentences. Used for light keyword matching.">
            <textarea
              className={`${inputClass} min-h-[92px] resize-y`}
              value={form.idea}
              onChange={(e) => set({ idea: e.target.value })}
              placeholder="An offline-first attendance scanner for our fest, built in Flutter with a Supabase backend…"
            />
          </Step>

          <Step
            index="4"
            title="Which skills are you missing?"
            subtitle="The single biggest driver of your ranking — 40% of the score."
          >
            <SkillInput
              value={form.needs}
              onChange={(needs) => set({ needs })}
              tone="need"
              placeholder="Docker, Data Viz, Pitch Deck…"
            />
          </Step>

          <Step index="5" title="When are you free?" subtitle="During the hackathon weekend. Mornings, afternoons, evenings.">
            <AvailabilityGrid value={form.slots} onChange={(slots) => set({ slots })} />
          </Step>
        </Card>

        <div className="lg:sticky lg:top-24 space-y-4">
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Demand snapshot</h3>
              <dl className="mt-3 space-y-2.5 text-[13.5px]">
                <Row label="You bring" value={form.skills.length ? `${form.skills.length} skills` : '— none yet'} />
                <Row label="You need" value={form.needs.length ? form.needs.join(', ') : '— none listed'} />
                <Row label="You are free" value={slotsSummary(form.slots)} />
                <Row label="Pool" value={`${poolSize} profiles (${SAMPLE_PROFILES.length} samples${user ? ' + builders from Supabase' : ''})`} />
              </dl>
            </div>

            <Button variant="brand" size="lg" className="w-full" onClick={runMatch} disabled={busy}>
              {busy ? <Spinner /> : (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
                </svg>
              )}
              Find My Squad
            </Button>

            {error && <p className="text-[13px] text-rose">{error}</p>}
            {status && <p className="text-[13px] text-ink-soft bg-lime/25 rounded-lg px-3 py-2">{status}</p>}
            {!user && (
              <p className="text-[12.5px] text-muted leading-snug">
                Browsing as a guest — matches work, but the shortlist needs an account.{' '}
                <Link to="/auth" className="text-brand font-medium hover:underline">
                  Sign in or sign up
                </Link>
                {validation.length > 0 && <span className="block mt-1 text-muted/80">Still needed: {validation.join(' · ')}</span>}
              </p>
            )}
            {user && (
              <p className="text-[12.5px] text-muted">
                Running a match also saves this profile to Supabase, so other students can find you in Browse.
              </p>
            )}
          </Card>

          {squad.length > 0 && <SquadSummary demand={form} squad={squad} />}
        </div>
      </div>

      {results.length > 0 && (
        <section className="mt-10 animate-rise">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Your three best fits
            </h2>
            <p className="text-[13px] text-muted">Ranked by the rules shown on the home page · pool of {poolSize}</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((m) => (
              <ProfileCard
                key={m.id}
                profile={m}
                needs={form.needs}
                match={m.score}
                reasons={m.reasons}
                badge={m.id.startsWith('sample-') ? 'Sample' : 'Community'}
                footer={
                  <div className="flex flex-wrap gap-2">
                    {savedIds.has(m.id) ? (
                      <Link to="/squad" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          In your squad — review
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" className="flex-1" onClick={() => addToSquad(m)}>
                        {user ? 'Add to squad' : 'Sign in to save'}
                      </Button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function toPool(rows = []) {
  return rows.map((r) => ({
    ...r,
    lane: r.lane || laneOf(r.skills?.[0]),
    needs: r.needs ?? [],
    slots: r.slots ?? [],
    skills: r.skills ?? [],
  }));
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 justify-between">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-right text-ink-soft font-medium">{value}</dd>
    </div>
  );
}
