import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataColumn } from "../../../../components/DataTable";
import { fetchCapabilities, fetchParticipants, fetchRoles, saveCapability, saveParticipant, saveRole, deleteRecord } from "../../lib/supportableData";

type RecordRow = { id: string; name: string; status?: string };
type Entity = "roles" | "capabilities" | "participants";

const statusOptions = ["active", "draft", "inactive"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

export function SupportableAdmin() {
  const [entity, setEntity] = useState<Entity>("roles");
  const [records, setRecords] = useState<Record<Entity, RecordRow[]>>({ roles: [], capabilities: [], participants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [roles, capabilities, participants] = await Promise.all([fetchRoles(), fetchCapabilities(), fetchParticipants()]);
      setRecords({
        roles: roles.map((row) => ({ id: row.id, name: row.name, status: row.status })),
        capabilities: capabilities.map((row) => ({ id: row.id, name: row.name })),
        participants: participants.map((row) => ({ id: row.id, name: row.name, status: row.status })),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load Supportable data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const rows = records[entity];
  const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1);
  const singularLabel = entityLabel.endsWith("s") ? entityLabel.slice(0, -1) : entityLabel;
  const countLabel = useMemo(() => `${rows.length} ${entity}`, [rows.length, entity]);
  const columns: Record<Entity, DataColumn<RecordRow>[]> = {
    roles: [{ key: "name", label: "Name" }, { key: "status", label: "Status", editor: "lookup", options: statusOptions }],
    capabilities: [{ key: "name", label: "Name" }],
    participants: [{ key: "name", label: "Name" }, { key: "status", label: "Status", editor: "lookup", options: statusOptions }],
  };

  async function updateRow(row: RecordRow) {
    setRecords((current) => ({ ...current, [entity]: current[entity].map((item) => item.id === row.id ? row : item) }));
    setSaving(true);
    setError("");
    try {
      if (entity === "roles") await saveRole(row.id, row.name, row.status ?? "active");
      if (entity === "capabilities") await saveCapability(row.id, row.name);
      if (entity === "participants") await saveParticipant(row.id, row.name, row.status ?? "active");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save record");
      await load();
    } finally { setSaving(false); }
  }

  async function addRow() {
    setSaving(true); setError("");
    try {
      if (entity === "roles") await saveRole(null, `New ${singularLabel}`, "draft");
      if (entity === "capabilities") await saveCapability(null, `New ${singularLabel}`);
      if (entity === "participants") await saveParticipant(null, `New ${singularLabel}`, "draft");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create record"); }
    finally { setSaving(false); }
  }

  async function deleteRow(row: RecordRow) {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    setSaving(true); setError("");
    try { await deleteRecord(entity, row.id); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete record"); }
    finally { setSaving(false); }
  }

  return <section className="supportable-admin">
    <div className="admin-heading"><div><div className="app-kicker">Manage</div><h2>Supportable data</h2><p>Live Supabase data with human-readable names.</p></div><button className="primary-button" type="button" onClick={addRow} disabled={saving}>+ New {singularLabel}</button></div>
    <nav className="admin-tabs" aria-label="Supportable data types">{(["roles", "capabilities", "participants"] as Entity[]).map((key) => <button key={key} className={entity === key ? "active" : ""} type="button" onClick={() => setEntity(key)}>{key}</button>)}</nav>
    {error && <div className="role-error" role="alert">{error}</div>}
    <div className="admin-summary">{loading ? "Loading..." : countLabel}{saving ? " · Saving..." : ""}</div>
    {!loading && <DataTable rows={rows} columns={columns[entity]} onChange={updateRow} onDelete={deleteRow} />}
    <p className="admin-note">Roles, capabilities, and participants are now backed by Supabase. Many-to-many role/capability and participant/role editing is the next layer.</p>
  </section>;
}
