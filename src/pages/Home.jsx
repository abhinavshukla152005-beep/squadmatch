import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import { Button, Card } from '../components/ui';

const STEPS = [
  {
    title: 'Say what you can build',
    body: 'Pick your skills, describe the project idea, and list the two or three skills you are missing.',
  },
  {
    title: 'Mark your real free hours',
    body: 'A 7 × 3 grid of mornings, afternoons and evenings. Availability overlap is weighted as heavily as skills.',
  },
  {
    title: 'Find My Squad',
    body: 'Transparent rules rank the pool: gap coverage, non-overlapping skills, shared blocks and mutual fit. Top three, each with its reasoning.',
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="pt-14 pb-10 sm:pt-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Rule-based matching · no AI API calls
          </span>
          <h1 className="mt-5 font-display text-[40px] leading-[1.05] sm:text-[54px] font-bold tracking-tight">
            Find your missing<br />hackathon teammate.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] text-ink-soft max-w-xl leading-relaxed">
            SquadMatch reads your skills, your project idea and the hours you are actually free —
            then recommends three builders whose strengths fill your gaps instead of repeating them.
            Shortlist them, edit the list, and see your squad&apos;s coverage in one summary.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/studio">
              <Button size="lg" variant="brand">
                Open Squad Studio
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h11M11 5.5 15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline">
                Browse {SAMPLE_PROFILES.length} sample builders
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Sign in to save a shortlist. Guest mode still runs the full matcher against the sample pool.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 grid-pattern rounded-3xl opacity-60" />
          <div className="relative space-y-3 sm:px-6">
            {SAMPLE_PROFILES.slice(0, 2).map((p, i) => (
              <div key={p.id} className={i === 1 ? 'sm:translate-x-6' : ''}>
                <ProfileCard profile={p} needs={['Postgres', 'Figma', 'Data Viz']} badge="Sample" className="animate-rise" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-line/70">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">How the matching works</h2>
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="p-5" hover>
              <span className="font-display text-[13px] font-bold text-brand">0{i + 1}</span>
              <h3 className="mt-2 font-semibold text-[16px]">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] text-muted leading-relaxed">{s.body}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-4 p-5 sm:p-6 bg-surface/70">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Scoring weights</h3>
          <div className="mt-4 grid sm:grid-cols-5 gap-3 text-[13px]">
            {[
              ['Covers your listed gaps', 40],
              ['Shared availability blocks', 30],
              ['Skills you do not have', 16],
              ['Mutual fit (they want you)', 9],
              ['Idea keyword affinity', 5],
            ].map(([label, w]) => (
              <div key={label}>
                <div className="h-1.5 rounded-full bg-ink/[0.07] overflow-hidden">
                  <div className="h-full bg-brand/80 rounded-full" style={{ width: `${w * 2.5}%` }} />
                </div>
                <p className="mt-2 text-ink-soft leading-snug">
                  <span className="font-display font-bold text-ink">{w}</span> · {label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] text-muted">
            Two hard rules first: a candidate must share at least one free block with you, and must either cover
            a listed gap or bring two genuinely different skills. Then at most one pick per lane, so you do not
            end up with three frontend devs.
          </p>
        </Card>
      </section>

      <section className="py-10 border-t border-line/70">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">The sample pool</h2>
            <p className="mt-2 text-[15px] text-muted">
              Eight labelled profiles across frontend, backend, ML, design, web3, infra, product and mobile.
            </p>
          </div>
          <Link to="/browse" className="text-sm font-medium text-brand hover:text-brand-dark">
            Browse all →
          </Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_PROFILES.map((p) => (
            <ProfileCard key={p.id} profile={p} badge="Sample" className="sm:p-4" />
          ))}
        </div>
      </section>
    </div>
  );
}
