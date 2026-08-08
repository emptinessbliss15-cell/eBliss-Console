import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./Supportable/lib/supabase";
import { Login } from "./Supportable/features/auth/Login";
import { RoleSelector } from "../components/RoleSelector";

type RoleContext = { current: string; available: string[] };

export default function Supportable() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [intent, setIntent] = useState("");
  const [roleContext, setRoleContext] = useState<RoleContext | null>(null);
  const [currentRole, setCurrentRole] = useState("User");
  const [roleError, setRoleError] = useState("");

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

  useEffect(() => {
    if (!supabase || !user) {
      setRoleContext(null);
      return;
    }

    async function loadRoles() {
      setRoleError("");
      const { data: account, error: accountError } = await supabase!
        .from("participant_accounts")
        .select("participant_id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();

      if (accountError || !account) {
        setRoleError("No participant account is linked to this login.");
        setRoleContext({ current: "User", available: ["User"] });
        setCurrentRole("User");
        return;
      }

      const { data: assignments, error: rolesError } = await supabase!
        .from("participant_roles")
        .select("role_id, roles(name, status)")
        .eq("participant_id", account.participant_id);

      if (rolesError) {
        setRoleError(rolesError.message);
        setRoleContext({ current: "User", available: ["User"] });
        setCurrentRole("User");
        return;
      }

      const roles = (assignments ?? [])
        .map((assignment) => {
          const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
          return role?.status === "active" ? role.name : null;
        })
        .filter((role): role is string => typeof role === "string" && role.length > 0);

      const available = Array.from(new Set(roles));
      const current = available.includes("Owner") ? "Owner" : available[0] ?? "User";
      const normalizedAvailable = available.length > 0 ? available : ["User"];
      setRoleContext({ current, available: normalizedAvailable });
      setCurrentRole(current);
    }

    loadRoles();
  }, [user]);

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
          <div className="supportable-identity">
            <span>Signed in as <strong>{user.email}</strong></span>
            <span className="identity-separator">·</span>
            <RoleSelector currentRole={currentRole} roles={roleContext?.available ?? [currentRole]} onChange={setCurrentRole} />
          </div>
          {roleError && <div className="role-error" role="status">{roleError}</div>}
        </div>
        <button type="button" onClick={signOut}>Sign out</button>
      </header>
      <section className="supportable-intent">
        <h2>What are you trying to accomplish?</h2>
        <textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." />
        <button type="button" onClick={() => console.log("Intent:", intent, "Role:", currentRole)} disabled={!intent.trim()}>Continue</button>
      </section>
    </section>
  );
}
