# SquadMatch — find your missing hackathon teammate

Rule-based teammate matching for students. You enter your skills, your project idea, the skills
you are missing and the hours you are actually free; **Find My Squad** returns up to three builders
whose strengths fill your gaps, each with a plain-English reason. No AI API calls anywhere — the
ranking is transparent arithmetic you can read in `src/lib/matcher.js`.

## Stack

- React 18 + Vite 6 + Tailwind CSS 4 (single `src/index.css` theme)
- React Router (`HashRouter`, so the build works from any static folder)
- Supabase: email/password auth, Postgres tables, Row Level Security

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```

`.env` already points at project `fwmgpirjwhevifzzjghx` with the publishable key (that key is
public-by-design; the browser never sees a secret).

## One-time Supabase setup (required before saving works)

1. Supabase dashboard → project `fwmgpirjwhevifzzjghx` → **SQL Editor** → *New query*.
2. Paste the whole contents of [`db/schema.sql`](db/schema.sql) → **Run**.
3. Done. The file is idempotent — re-run it any time the schema changes.

What it creates:

| Object | Purpose |
| --- | --- |
| `public.profiles` | one row per student: name, role, year, idea, `skills[]`, `needs[]`, `slots[]`, `discoverable` |
| `public.squad_picks` | the saved shortlist: `candidate_id`, `candidate` snapshot, `score`, `reasons[]`, editable `note`, `position` |
| `handle_new_user` trigger | inserts the `profiles` row automatically for **every new signup**, so no user is ever missing one |
| backfill statement at the end | repairs accounts that signed up *before* the trigger existed (otherwise saving fails on the `squad_picks.owner` foreign key) |
| RLS policies | directory is readable by anyone; a user can only insert/update/delete their own profile and their own picks |

Two free-plan notes that bite in demos:

- Built-in SMTP sends ~2 confirmation emails/hour. For a demo, turn **Confirm email** off in
  Authentication → Providers → Email, or confirm users manually in Authentication → Users.
- The SQL Editor runs the whole script in one transaction; if you edit it and a later statement
  fails, re-run the entire corrected file.

## Pages

| Route | What happens there |
| --- | --- |
| `#/` | Landing: how the scoring works, the eight sample profiles |
| `#/studio` | Squad Studio — the five inputs, the demand snapshot, **Find My Squad**, add-to-squad |
| `#/squad` | Saved shortlist: edit the note per pick, reorder, remove, live squad summary, copy squad brief |
| `#/browse` | Directory: 8 samples + every discoverable Supabase profile, filter by lane/day/search |
| `#/auth` | Sign in / create account |

Guests get the full matcher against the sample pool; saving a shortlist needs an account.
Your Studio answers are cached in `localStorage`, and signing in promotes them to `public.profiles`.

## The eight sample profiles

`src/data/sampleProfiles.js` — Aria Mehta (frontend), Devansh Rao (backend), Mara Iyer (ML/data),
Kabir Seth (web3), Nina Fernandes (design), Omar Sheikh (infra), Tara Malhotra (product),
Ryu Nakamura (mobile). Each carries skills, skills they want in return, a project idea and a
weekly availability set, so matching is meaningful out of the box.

## Matching rules (deterministic, no AI)

Availability is a 7 × 3 grid — Mon…Sun × Morning / Afternoon / Evening — stored as slot ids like
`sat-mid`. Overlap is a plain set intersection.

Score out of 100:

| Weight | Rule |
| --- | --- |
| 40 | share of your listed missing skills the candidate covers |
| 30 | shared free blocks, relative to half of your blocks (capped) |
| 16 | candidate skills you do **not** have (3 skills = full marks) |
| 9 | mutual fit — your skills are in their "looking for" list |
| 5 | keyword affinity between your idea and their idea/role/skills |

Then two hard rules and one diversity rule: a candidate must share at least one free block with
you, must either cover a gap or bring two genuinely different skills, and at most one pick per lane
(so you never get three frontend devs). If fewer than three survive, the best remaining scores fill
in and the reason line says it was a fallback pick.

## Layout

```
db/schema.sql              run this in the Supabase SQL Editor
src/lib/supabase.js        client from VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
src/lib/api.js             profile + shortlist queries (upserts, note edits, reordering)
src/lib/matcher.js         scoring, reasons, squad summary
src/lib/availability.js    day/block model and slot helpers
src/data/sampleProfiles.js the eight sample builders
src/pages/*                Home, Studio, Squad, Browse, Auth
```
