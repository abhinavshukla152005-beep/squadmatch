import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav';
import Home from './pages/Home';
import Studio from './pages/Studio';
import Squad from './pages/Squad';
import Browse from './pages/Browse';
import Auth from './pages/Auth';
import { isSupabaseConfigured } from './lib/supabase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Nav />
      {!isSupabaseConfigured && (
        <div className="bg-amber/15 border-y border-amber/40 text-ink-soft text-sm px-4 py-3 text-center">
          Supabase keys are missing — add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code className="font-mono">.env</code>.
          Matching still works; saving a shortlist will not.
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>
      <footer className="border-t border-line/70 mt-16">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-muted">
          <p>
            SquadMatch — rule-based teammate matching. No AI calls, just complementary skills and
            shared calendar blocks.
          </p>
          <p className="font-display text-ink-soft">Built for hackathon teams</p>
        </div>
      </footer>
    </div>
  );
}
