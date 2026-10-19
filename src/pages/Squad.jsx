import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import SquadSummary from '../components/SquadSummary';
import { Button, Card, Spinner, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { candidateFromPick, fetchProfile, fetchShortlist, removePick, setPickPositions, updatePick } from '../lib/api';
import { blockShort } from '../lib/availability';

export default function Squad() {
  const { user, loading } = useAuth();
  const [picks, setPicks] = useState([]);
  const [demand, setDemand] = useState({ skills: [], needs: [], slots: [], idea: '' });
  const [busy, setBusy] = useState(true);
  const [notes, setNotes] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    Promise.all([fetchShortlist(user.id).catch(() => []), fetchProfile(user.id).catch(() => null)])
      .then(([rows, profile]) => {
        setPicks(rows);
        setNotes(Object.fromEntries(rows.map((r) => [r.id, r.note ?? ''])));
        if (profile) setDemand({ skills: profile.skills ?? [], needs: profile.needs ?? [], slots: profile.slots ?? [], idea: profile.idea ?? '' });
      })
      .finally(() => setBusy(false));
  }, [user]);

  const squad = useMemo(() => picks.map(candidateFromPick), [picks]);

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16">
        <Card className="p-8 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold tracking-tight">Your squad lives in your account</h1>
          <p className="text-[15px] text-ink-soft">
            Shortlists are stored per student in Supabase, so you can come back the morning of the hackathon and
            find it intact. Sign in to see or edit yours.
          </p>
          <Link to="/auth" state={{ next: '/squad' }}>
            <Button variant="brand" size="lg">
              Sign in to my squad
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  async function saveNote(pick) {
    try {
      const updated = await updatePick(pick.id, { note: notes[pick.id] ?? '' });
      setPicks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setStatus('Note saved.');
    } catch (err) {
      setStatus(`Could not save — ${err.message}`);
    }
  }

  async function drop(pick) {
    try {
      await removePick(pick.id);
      setPicks((prev) => prev.filter((p) => p.id !== pick.id).map((p, i) => ({ ...p, position: i })));
      setStatus(`Removed ${pick.candidate?.name ?? 'that builder'} from your shortlist.`);
    } catch (err) {
      setStatus(`Could not save — ${err.message}`);
    }
  }

  async function move(index, delta) {
    const next = [...picks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((p, i) => ({ ...p, position: i }));
    setPicks(withPositions);
    try {
      await setPickPositions(withPositions.map((p) => ({ id: p.id, position: p.position })));
    } catch (err) {
      setStatus(`Could not save — ${err.message}`);
    }
  }

  function copyBrief() {
    const lines = [
      `Squad brief — ${demand.idea.trim() || 'Hackathon project'}`,
      '',
      `My skills: ${demand.skills.join(', ') || '—'}`,
      `Gaps I was covering: ${demand.needs.join(', ') || '—'}`,
      '',
      ...squad.map(
        (m, i) =>
          `${i + 1}. ${m.name} (${m.role}) — match ${m.score}/100\n   Brings: ${m.skills.join(', ')}\n   Free: ${
            m.slots.map((s) => `${s.split('-')[0].toUpperCase()} ${blockShort(s.split('-')[1])}`).join(', ') || '—'
          }\n   Note: ${picks[i]?.note || '—'}`,
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setStatus('Squad brief copied — paste it into your team chat.');
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-[40px] font-bold tracking-tight">My squad shortlist</h1>
          <p className="mt-2 text-[15.5px] text-ink-soft">
            {picks.length === 0
              ? 'Nothing saved yet.'
              : `${picks.length} saved · order matters for who you DM first. Everything here is editable.`}
          </p>
        </div>
        <div className="flex gap-2">
          {picks.length > 0 && (
            <Button variant="outline" onClick={copyBrief}>
              Copy squad brief
            </Button>
          )}
          <Link to="/studio">
            <Button variant="brand">{picks.length >= 3 ? 'Rerun matches' : 'Find more'}</Button>
          </Link>
        </div>
      </header>

      {status && (
        <p
          className={`mt-4 text-[13px] rounded-lg px-3 py-2 inline-block ${
            status.startsWith('Could not save') ? 'bg-rose/[0.08] text-rose' : 'bg-lime/25 text-ink-soft'
          }`}
        >
          {status}
        </p>
      )}

      {busy ? (
        <div className="mt-16 grid place-items-center text-muted">
          <Spinner className="text-brand" />
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
          <div className="space-y-4">
            {picks.length === 0 ? (
              <Card className="p-8 text-center">
                <h2 className="font-display text-xl font-semibold">No teammates shortlisted yet</h2>
                <p className="mt-2 text-[14.5px] text-muted max-w-sm mx-auto">
                  Run Squad Studio, then add up to three builders whose skills fill your gaps and whose free blocks
                  match yours.
                </p>
                <Link to="/studio" className="inline-block mt-5">
                  <Button variant="brand" size="lg">
                    Open Squad Studio
                  </Button>
                </Link>
              </Card>
            ) : (
              picks.map((pick, i) => {
                const m = candidateFromPick(pick);
                return (
                  <ProfileCard
                    key={pick.id}
                    profile={m}
                    needs={demand.needs}
                    match={m.score}
                    reasons={m.reasons}
                    badge={`Pick ${i + 1}`}
                    className="animate-rise"
                    footer={
                      <div className="space-y-2.5">
                        <textarea
                          value={notes[pick.id] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [pick.id]: e.target.value }))}
                          placeholder="Why them? Outreach plan, repo link, what you will ask them to own…"
                          className={`${inputClass} min-h-[64px] text-[13.5px] resize-y`}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => saveNote(pick)} disabled={(notes[pick.id] ?? '') === pick.note}>
                            Save note
                          </Button>
                          <div className="flex gap-1 ml-auto">
                            <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                              ↑
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === picks.length - 1} title="Move down">
                              ↓
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => drop(pick)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                );
              })
            )}
          </div>

          <div className="lg:sticky lg:top-24 space-y-4">
            <SquadSummary demand={demand} squad={squad} />
            <Card className="p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">How to use this list</h3>
              <ol className="mt-3 space-y-2 text-[13.5px] text-ink-soft list-decimal list-inside">
                <li>Message pick 1 first — the score is relative, not a guarantee they are free.</li>
                <li>Agree one shared block from the summary before writing any code.</li>
                <li>Re-run Studio after you add a skill; the ranking changes with your gap list.</li>
              </ol>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
