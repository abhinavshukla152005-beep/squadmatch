import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Spinner, inputClass } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.next || '/studio';

  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-16">
        <Card className="p-7 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">You are signed in</h1>
          <p className="text-[14.5px] text-muted">{user.email}</p>
          <div className="flex gap-2 justify-center">
            <Link to="/studio">
              <Button variant="brand">Squad Studio</Button>
            </Link>
            <Link to="/squad">
              <Button variant="outline">My squad</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 6) {
      setError('Password needs at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const data = await signUp({ email: email.trim(), password, name: name.trim() });
        if (data.session) {
          navigate(next);
        } else {
          setNotice('Account created. Confirm the email Supabase sent you, then sign in.');
          setMode('signin');
        }
      } else {
        await signIn({ email: email.trim(), password });
        navigate(next);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-12">
      <Card className="p-6 sm:p-8">
        <div className="flex gap-1 p-1 rounded-xl bg-ink/[0.05] mb-6">
          {['signin', 'signup'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
                setNotice('');
              }}
              className={`flex-1 h-9 rounded-lg text-[13.5px] font-semibold transition cursor-pointer ${
                mode === m ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <h1 className="font-display text-[26px] font-bold tracking-tight">
          {mode === 'signin' ? 'Back to your squad' : 'Set up your builder profile'}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          {mode === 'signin'
            ? 'Your shortlist, notes and availability come straight from Supabase.'
            : 'One row in public.profiles is created automatically for you by the database trigger.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <Field label="Display name" hint="shown on your card">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Aria Mehta" required />
            </Field>
          )}
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              required
            />
          </Field>
          <Field label="Password" hint="min 6 characters">
            <input
              className={inputClass}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={busy}>
            {busy && <Spinner />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        {error && <p className="mt-4 text-[13px] text-rose bg-rose/[0.08] rounded-lg px-3 py-2">{error}</p>}
        {notice && <p className="mt-4 text-[13px] text-ink-soft bg-lime/25 rounded-lg px-3 py-2">{notice}</p>}
      </Card>

      <p className="mt-5 text-[12.5px] text-muted leading-relaxed">
        New to this project? Run <code className="font-mono">db/schema.sql</code> in the Supabase SQL Editor first —
        it creates the tables, RLS policies and the signup trigger. If email confirmation is enabled on the free plan,
        the built-in SMTP only sends ~2 mails an hour; turning it off in Authentication → Providers is fine for a demo.
      </p>
    </div>
  );
}
