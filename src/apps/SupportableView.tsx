import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./Supportable/lib/supabase";
import { Login } from "./Supportable/features/auth/Login";
import { ParticipantSelector } from "../components/ParticipantSelector";
import { RoleSelector } from "../components/RoleSelector";
import { RevoHolonGrid } from "../components/RevoHolonGrid";
import { ResponseComposer } from "./Supportable/features/responses/ResponseComposer";
import { SupportableAdmin } from "./Supportable/features/admin/SupportableAdmin";

type Participant = { id: string; name: string };
type RoleContext = { current: string; available: string[] };
type SupportableView = "Work" | "Manage";

type SupportableViewProps = {
  view?: SupportableView;
};

export default function SupportableView({ view = "Work" }: SupportableViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [intent, setIntent] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState("");
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setParticipants([]);
      setCurrentParticipantId("");
      setRoleContext(null);
      return;
    }
    async function loadParticipants() {
      setRoleError("");
      const { data, error } = await supabase!.from("participant_accounts").select("participant_id, participants(id, name)").eq("auth_user_id", user!.id);
      if (error) {
        setRoleError(error.message);
        setParticipants([]);
        setCurrentParticipantId("");
        return;
      }
      const available = (data ?? []).map((account) => {
        const participant = Array.isArray(account.participants) ? account.participants[0] : account.participants;
        return participant?.id && participant.name ? { id: participant.id, name: participant.name } : null;
      }).filter((participant): participant is Participant => participant !== null);
      setParticipants(available);
      setCurrentParticipantId((current) => available.some((participant) => participant.id === current) ? current : available[0]?.id ?? "");
    }
    loadParticipants();
  }, [user]);

  useEffect(() => {
    if (!supabase || !currentParticipantId) return;
    async function loadRoles() {
      setRoleError("");
      const { data: assignments, error } = await supabase!.from("participant_roles").select("role_id, roles(name, status)").eq("participant_id", currentParticipantId);
      if (error) {
        setRoleError(error.message);
        setRoleContext({ current: "User", available: ["User"] });
        setCurrentRole("User");
        return;
      }
      const roles = (assignments ?? []).map((assignment) => {
        const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
        return role?.status === "active" ? role.name : null;
      }).filter((role): role is string => typeof role === "string" && role.length > 0);
      const available = Array.from(new Set(roles));
      const normalizedAvailable = available.length > 0 ? available : ["User"];
      const current = normalizedAvailable.includes("Owner") ? "Owner" : normalizedAvailable[0];
      setRoleContext({ current, available: normalizedAvailable });
      setCurrentRole(current);
    }
    loadRoles();
  }, [currentParticipantId]);

  async function signOut() { await supabase?.auth.signOut(); }

  if (!isSupabaseConfigured) return <section className="supportable-view"><div className="app-kicker">eBliss App</div><h1>Supportable</h1><p className="app-lead">Helping people find and fulfill intent.</p><div className="supportable-notice"><strong>Supportable needs configuration.</strong><span>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the Cloudflare environment, then redeploy.</span></div></section>;
  if (loading) return <section className="supportable-view"><h1>Supportable</h1><p>Loading...</p></section>;
  if (!user) return <section className="supportable-view"><div className="app-kicker">eBliss App</div><h1>Supportable</h1><p className="app-lead">Helping people find and fulfill intent.</p><Login /></section>;

  return <section className="supportable-view">
    <div className="app-kicker">eBliss App</div>
    <header className="supportable-header"><div><h1>Supportable</h1><div className="supportable-identity">
      <span>Signed in as <strong>{user.email}</strong></span><span className="identity-separator">·</span>
      <ParticipantSelector currentParticipantId={currentParticipantId} participants={participants} onChange={setCurrentParticipantId} />
      <span className="identity-separator">·</span><RoleSelector currentRole={currentRole} roles={roleContext?.available ?? [currentRole]} onChange={setCurrentRole} />
    </div>{roleError && <div className="role-error" role="status">{roleError}</div>}</div><button type="button" onClick={signOut}>Sign out</button></header>
    <RevoHolonGrid />
    {view === "Manage" ? <SupportableAdmin /> : <>
      <section className="supportable-intent"><h2>What are you trying to accomplish?</h2><textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Describe your intent..." /><button type="button" disabled title="Intent processing is not implemented yet">Continue</button></section>
      <ResponseComposer />
    </>}
  </section>;
}