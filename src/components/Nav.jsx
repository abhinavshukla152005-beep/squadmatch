import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';

const LINKS = [
  { to: '/browse', label: 'Browse builders' },
  { to: '/studio', label: 'Squad Studio' },
  { to: '/squad', label: 'My squad' },
];

export default function Nav() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-[19px] font-bold tracking-tight">
          SquadMatch<span className="h-2 w-2 rounded-full bg-lime ring-2 ring-lime/40" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-ink/10 text-ink' : 'text-muted hover:text-ink hover:bg-ink/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && !user && (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
          {user && (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-ink-soft px-2">
                <span className="h-7 w-7 rounded-full bg-brand-soft text-brand grid place-items-center font-semibold text-xs">
                  {initials(profile?.name || user.email)}
                </span>
                {profile?.name || user.email}
              </span>
              <Button size="sm" variant="ghost" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-line/70 flex overflow-x-auto px-3 gap-1">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `whitespace-nowrap px-3 py-2.5 text-sm font-medium ${isActive ? 'text-ink border-b-2 border-ink' : 'text-muted'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';
}
