import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./Supportable/lib/supabase";
import { Login } from "./Supportable/features/auth/Login";

export default function Supportable() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [intent, setIntent] = useState("");

  useEffect(() => {
    if (!supabase) return;

    async function loadSession() {
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="supportable-view">
        <div className="app-kicker">eBliss App</div>
        <h1>Supportable</h1>
        <p className="app-lead">Helping people find and fulfill intent.</p>
        <div className="supportable-notice">
          <strong>Supportable needs configuration.</strong>
          <span>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the Cloudflare environment, then redeploy.</span>
        </div>
      </section>
    );
  }

  if (loading) {
    return <section className="supportable-view"><h1>Supportable</h1><p>Loading...</p></section>;
  }

  if (!user) {
    return (
      <section className="supportable-view">
        <div className="app-kicker">eBliss App</div>
        <h1>Supportable</h1>
        <p className="app-lead">Helping people find and fulfill intent.</p>
        <Login />
      </section>
    );
  }

  return (
    <section className="supportable-view">
      <div className="app-kicker">eBliss App</div>
      <header className="supportable-header">
        <div>
          <h1>Supportable</h1>
          <p>Signed in as <strong>{user.email}</strong></p>
        </div>
        <button type="button" onClick={signOut}>Sign out</button>
      </header>
      <section className="supportable-intent">
        <h2>What are you trying to accomplish?</h2>
        <textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." />
        <button type="button" onClick={() => console.log("Intent:", intent)} disabled={!intent.trim()}>Continue</button>
      </section>
    </section>
  );
}
