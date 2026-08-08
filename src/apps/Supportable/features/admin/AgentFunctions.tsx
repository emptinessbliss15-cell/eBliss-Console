import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { AgentPanel } from "./AgentPanel";

type AgentFunction = { id: string; name: string; description: string | null; status: string };
type Capability = { id: string; name: string };

export function AgentFunctions() {
  const [functions, setFunctions] = useState<AgentFunction[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!supabase) return;
    setLoading(true); setError("");
    try {
      const [{ data: functionRows, error: functionError }, { data: capabilityRows, error: capabilityError }] = await Promise.all([
        supabase.from("agent_functions").select("id,name,description,status").order("name"),
        supabase.from("capabilities").select("id,name").order("name"),
      ]);
      if (functionError) throw functionError;
      if (capabilityError) throw capabilityError;
      setFunctions(functionRows ?? []);
      setCapabilities(capabilityRows ?? []);
      if (selectedFunction) {
        const { data, error: relationError } = await supabase.from("capability_agent_functions").select("capability_id").eq("agent_function_id", selectedFunction);
        if (relationError) throw relationError;
        setSelectedCapabilities((data ?? []).map((row) => row.capability_id));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load agent functions"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function selectFunction(id: string) {
    if (!supabase) return;
    setSelectedFunction(id); setError("");
    const { data, error: relationError } = await supabase.from("capability_agent_functions").select("capability_id").eq("agent_function_id", id);
    if (relationError) { setError(relationError.message); return; }
    setSelectedCapabilities((data ?? []).map((row) => row.capability_id));
  }

  async function saveFunction() {
    if (!supabase || !newName.trim()) return;
    setSaving(true); setError("");
    try {
      const { error: saveError } = await supabase.from("agent_functions").insert({ name: newName.trim(), description: newDescription.trim() || null }).select().single();
      if (saveError) throw saveError;
      setNewName(""); setNewDescription(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create agent function"); }
    finally { setSaving(false); }
  }

  async function saveCapabilities() {
    if (!supabase || !selectedFunction) return;
    setSaving(true); setError("");
    try {
      const { error: deleteError } = await supabase.from("capability_agent_functions").delete().eq("agent_function_id", selectedFunction);
      if (deleteError) throw deleteError;
      if (selectedCapabilities.length) {
        const { error: insertError } = await supabase.from("capability_agent_functions").insert(selectedCapabilities.map((capability_id) => ({ capability_id, agent_function_id: selectedFunction })));
        if (insertError) throw insertError;
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save capability assignments"); }
    finally { setSaving(false); }
  }

  async function deleteFunction(id: string) {
    if (!supabase || !window.confirm("Delete this agent function?")) return;
    setSaving(true); setError("");
    try {
      const { error: deleteError } = await supabase.from("agent_functions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      if (selectedFunction === id) { setSelectedFunction(null); setSelectedCapabilities([]); }
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete agent function"); }
    finally { setSaving(false); }
  }

  return <>
    <section className="supportable-admin">
      <div className="admin-heading"><div><div className="app-kicker">Manage</div><h2>Agent Functions</h2><p>Actions an agent may perform when granted by a capability.</p></div><div className="admin-heading-actions"><button className="secondary-button" type="button" onClick={() => void load()} disabled={loading || saving}>↻ Refresh</button></div></div>
      {error && <div className="role-error" role="alert">{error}</div>}
      <div className="admin-create-row"><div className="admin-create-field"><label htmlFor="agent-function-name">Name</label><input id="agent-function-name" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. browser.navigate" /></div><div className="admin-create-field"><label htmlFor="agent-function-description">Description</label><input id="agent-function-description" value={newDescription} onChange={(event) => setNewDescription(event.target.value)} /></div><div className="admin-create-actions"><button className="primary-button" type="button" onClick={() => void saveFunction()} disabled={saving || !newName.trim()}>Save</button></div></div>
      <div className="data-table-wrap"><div className="data-table-toolbar"><span>{loading ? "Loading…" : `${functions.length} agent functions`}</span></div><div className="data-table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Description</th><th>Status</th><th /></tr></thead><tbody>{functions.map((item) => <tr key={item.id}><td><button className="secondary-button" type="button" onClick={() => void selectFunction(item.id)}>{item.name}</button></td><td>{item.description ?? ""}</td><td>{item.status}</td><td><button className="table-delete" type="button" onClick={() => void deleteFunction(item.id)}>Delete</button></td></tr>)}</tbody></table></div></div>
      {selectedFunction && <div className="admin-modal-backdrop" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="agent-function-capabilities-title"><div className="admin-modal-heading"><div><div className="app-kicker">Capability Access</div><h3 id="agent-function-capabilities-title">{functions.find((item) => item.id === selectedFunction)?.name}</h3></div><button className="secondary-button" type="button" onClick={() => setSelectedFunction(null)}>Close</button></div><div className="admin-modal-list">{capabilities.map((capability) => <label key={capability.id} className="admin-check-row"><input type="checkbox" checked={selectedCapabilities.includes(capability.id)} onChange={() => setSelectedCapabilities((current) => current.includes(capability.id) ? current.filter((id) => id !== capability.id) : [...current, capability.id])} /> <span>{capability.name}</span></label>)}</div><div className="admin-create-actions"><button className="primary-button" type="button" onClick={() => void saveCapabilities()} disabled={saving}>Save</button><button className="secondary-button" type="button" onClick={() => setSelectedFunction(null)} disabled={saving}>Cancel</button></div></div></div>}
    </section>
    <AgentPanel />
  </>;
}
