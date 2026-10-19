import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile, upsertProfile } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return null;
    }
    let row = await fetchProfile(user.id).catch(() => null);
    if (!row) {
      // Accounts created before db/schema.sql's handle_new_user trigger has no row yet.
      row = await upsertProfile(user.id, {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'New builder',
      }).catch(() => null);
    }
    setProfile(row);
    return row;
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        return data.session?.user ? loadProfile(data.session.user) : undefined;
      })
      .finally(() => active && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user);
      else setProfile(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      loading,
      setProfile,
      refreshProfile: () => (session?.user ? loadProfile(session.user) : Promise.resolve(null)),
      async signUp({ email, password, name }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw authError(error);
        return data;
      },
      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw authError(error);
        return data;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function authError(error) {
  const message = error.message || 'Something went wrong';
  if (/rate limit/i.test(message)) {
    return new Error('Supabase is rate-limiting emails on the free plan. Try again in an hour, or turn off "Confirm email" in Authentication → Providers.');
  }
  if (/invalid login credentials/i.test(message)) {
    return new Error('That email and password do not match an account.');
  }
  if (/already registered/i.test(message)) {
    return new Error('That email is already signed up — sign in instead.');
  }
  return new Error(message);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
