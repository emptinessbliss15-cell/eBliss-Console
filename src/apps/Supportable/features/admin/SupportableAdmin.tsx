import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataColumn } from "../../../../components/DataTable";
import { fetchCapabilities, fetchParticipantRoles, fetchParticipantTypes, fetchParticipants, fetchRoles, saveCapability, saveParticipant, saveParticipantRoles, saveParticipantType, saveRole, deleteParticipantType, deleteRecord, type LookupOption } from "../../lib/supportableData";

type RecordRow = { id: string; name: string; description?: string; status?: string; participant_type_id?: string; archived_at?: string | null; archived_by?: string | null; archive_reason?: string | null };
type Entity = "roles" | "capabilities" | "participants" | "participant_types";
type NewRecord = { name: string; description: string; status: string; participant_type_id: string; archive_reason: string };
const statusOptions = ["active", "draft", "inactive"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

export function SupportableAdmin() {
  const [entity, setEntity] = useState<Entity>("roles");
  const [records, setRecords] = useState<Record<Entity, RecordRow[]>>({ roles: [], capabilities: [], participants: [], participant_types: [] });
  const [participantTypes, setParticipantTypes] = useState<LookupOption[]>([]);
  const [roles, setRoles] = useState<LookupOption[]>([]);
  const [roleEditor, setRoleEditor] = useState<{ participant: RecordRow; selected: string[] } | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newRecord, setNewRecord] = useState<NewRecord | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const [roleRows, capabilityRows, participantRows, types] = await Promise.all([fetchRoles(), fetchCapabilities(), fetchParticipants(), fetchParticipantTypes()]);
      setRoles(roleRows.map((row) => ({ value: row.id, label: row.name })));
      setRecords({
        roles: roleRows.map((row) => ({ id: row.id, name: row.name, status: row.status })),
        capabilities: capabilityRows.map((row) => ({ id: row.id, name: row.name })),
        participants: participantRows.map((row) => ({ id: row.id, name: row.name, description: row.description, status: row.status, participant_type_id: row.participant_type_id, archived_at: row.archived_at, archived_by: row.archived_by, archive_reason: row.archive_reason })),
        participant_types: types.map((row) => ({ id: row.value, name: row.label })),
      });
      setParticipantTypes(types);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load Supportable data"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const rows = records[entity];
  const entityLabel = entity === "participant_types" ? "Participant Types" : entity.charAt(0).toUpperCase() + entity.slice(1);
  const singularLabel = entity === "participant_types" ? "Participant Type" : entityLabel.endsWith("s") ? entityLabel.slice(0, -1) : entityLabel;
  const countLabel = useMemo(() => `${rows.length} ${entity === "participant_types" ? "participant types" : entity}`, [rows.length, entity]);
  const columns: Record<Entity, DataColumn<RecordRow>[]> = {
    roles: [{ key: "name", label: "Name" }, { key: "status", label: "Status", editor: "lookup", options: statusOptions }],
    capabilities: [{ key: "name", label: "Name" }],
    participants: [],
    participant_types: [{ key: "name", label: "Name" }],
  };

  async function updateRow(row: RecordRow) {
    setRecords((current) => ({ ...current, [entity]: current[entity].map((item) => item.id === row.id ? row : item) }));
    setSaving(true); setError("");
    try {
      if (entity === "roles") await saveRole(row.id, row.name, row.status ?? "active");
      if (entity === "capabilities") await saveCapability(row.id, row.name);
      if (entity === "participants") await saveParticipant(row.id, row.name, row.status ?? "active", row.participant_type_id ?? "", row.description, row.archive_reason);
      if (entity === "participant_types") await saveParticipantType(row.id, row.name);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save record"); await load(); }
    finally { setSaving(false); }
  }

  function nextDraftName(prefix: string, existing: RecordRow[]) {
    const normalized = new Set(existing.map((row) => row.name.trim().toLowerCase()));
    if (!normalized.has(prefix.toLowerCase())) return prefix;
    let index = 2; while (normalized.has(`${prefix} ${index}`.toLowerCase())) index += 1;
    return `${prefix} ${index}`;
  }

  function startAdd() {
    setError("");
    setNewRecord({ name: nextDraftName(`New ${singularLabel}`, rows), description: "", status: "draft", participant_type_id: participantTypes[0]?.value ?? "", archive_reason: "" });
  }
  function cancelAdd() { setNewRecord(null); setError(""); }

  async function saveNewRecord() {
    if (!newRecord?.name.trim()) { setError(`${singularLabel} name is required.`); return; }
    if (entity === "participants" && !newRecord.participant_type_id) { setError("Participant type is required. Add an approved participant type in Manager first."); return; }
    setSaving(true); setError("");
    try {
      if (entity === "roles") await saveRole(null, newRecord.name, newRecord.status);
      if (entity === "capabilities") await saveCapability(null, newRecord.name);
      if (entity === "participants") await saveParticipant(null, newRecord.name, newRecord.status, newRecord.participant_type_id, newRecord.description, newRecord.archive_reason);
      if (entity === "participant_types") await saveParticipantType(null, newRecord.name);
      setNewRecord(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create record"); }
    finally { setSaving(false); }
  }

  async function openRoleEditor(participant: RecordRow) {
    setError(""); setLoadingRoles(true);
    try { setRoleEditor({ participant, selected: await fetchParticipantRoles(participant.id) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load participant roles"); }
    finally { setLoadingRoles(false); }
  }

  function toggleRole(roleId: string) {
    setRoleEditor((current) => current ? { ...current, selected: current.selected.includes(roleId) ? current.selected.filter((id) => id !== roleId) : [...current.selected, roleId] } : current);
  }

  async function saveRoleEditor() {
    if (!roleEditor) return;
    setSaving(true); setError("");
    try { await saveParticipantRoles(roleEditor.participant.id, roleEditor.selected); setRoleEditor(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save participant roles"); }
    finally { setSaving(false); }
  }

  async function deleteRow(row: RecordRow) {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    setSaving(true); setError("");
    try { if (entity === "participant_types") await deleteParticipantType(row.id); else await deleteRecord(entity, row.id); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete record"); }
    finally { setSaving(false); }
  }
  function changeEntity(key: Entity) { setEntity(key); setNewRecord(null); setRoleEditor(null); setError(""); }

  return <section className="supportable-admin">
    <div className="admin-heading"><div><div className="app-kicker">Manage</div><h2>Supportable data</h2><p>Live Supabase data with human-readable names.</p></div><button className="primary-button" type="button" onClick={startAdd} disabled={saving || newRecord !== null}>+ New {singularLabel}</button></div>
    <nav className="admin-tabs" aria-label="Supportable data types">{(["roles", "capabilities", "participants", "participant_types"] as Entity[]).map((key) => <button key={key} className={entity === key ? "active" : ""} type="button" onClick={() => changeEntity(key)}>{key === "participant_types" ? "participant types" : key}</button>)}</nav>
    {error && <div className="role-error" role="alert">{error}</div>}
    {!loading && newRecord && <div className="admin-create-row">
      <div className="admin-create-field"><label htmlFor="new-record-name">Name</label><input id="new-record-name" autoFocus value={newRecord.name} onChange={(event) => setNewRecord((current) => current ? { ...current, name: event.target.value } : current)} /></div>
      {entity === "participants" && <><div className="admin-create-field"><label htmlFor="new-participant-description">Description</label><input id="new-participant-description" value={newRecord.description} onChange={(event) => setNewRecord((current) => current ? { ...current, description: event.target.value } : current)} /></div><div className="admin-create-field"><label htmlFor="new-participant-type">Participant Type</label><select id="new-participant-type" value={newRecord.participant_type_id} onChange={(event) => setNewRecord((current) => current ? { ...current, participant_type_id: event.target.value } : current)}><option value="">Select type…</option>{participantTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></>}
      {entity !== "capabilities" && entity !== "participant_types" && <div className="admin-create-field"><label htmlFor="new-record-status">Status</label><select id="new-record-status" value={newRecord.status} onChange={(event) => setNewRecord((current) => current ? { ...current, status: event.target.value } : current)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
      {entity === "participants" && <div className="admin-create-field"><label htmlFor="new-participant-archive-reason">Archive Reason</label><input id="new-participant-archive-reason" value={newRecord.archive_reason} onChange={(event) => setNewRecord((current) => current ? { ...current, archive_reason: event.target.value } : current)} /></div>}
      <div className="admin-create-actions"><button className="primary-button" type="button" onClick={saveNewRecord} disabled={saving}>Save</button><button className="secondary-button" type="button" onClick={cancelAdd} disabled={saving}>Cancel</button></div>
    </div>}
    <div className="admin-summary">{loading ? "Loading..." : countLabel}{saving ? " · Saving..." : ""}</div>
    {!loading && entity === "participants" ? <div className="data-table-wrap"><div className="data-table-toolbar"><span>{rows.length} participants</span></div><div className="data-table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Participant Type</th><th>Archive Reason</th><th>Roles</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.description ?? ""}</td><td>{row.status ?? ""}</td><td>{participantTypes.find((option) => option.value === row.participant_type_id)?.label ?? ""}</td><td>{row.archive_reason ?? ""}</td><td><button className="secondary-button" type="button" onClick={() => openRoleEditor(row)}>Edit Roles</button></td><td><button className="table-delete" type="button" onClick={() => deleteRow(row)}>Delete</button></td></tr>)}</tbody></table></div></div> : !loading && <DataTable rows={rows} columns={columns[entity]} onChange={updateRow} onDelete={deleteRow} />}
    {loadingRoles && <div className="role-error">Loading participant roles…</div>}
    {roleEditor && <div className="admin-modal-backdrop" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="participant-role-title"><div className="admin-modal-heading"><div><div className="app-kicker">Participant Roles</div><h3 id="participant-role-title">{roleEditor.participant.name}</h3></div><button className="secondary-button" type="button" onClick={() => setRoleEditor(null)} disabled={saving}>Close</button></div><div className="admin-role-list">{roles.length ? roles.map((role) => <label key={role.value} className="admin-role-option"><input type="checkbox" checked={roleEditor.selected.includes(role.value)} onChange={() => toggleRole(role.value)} /> <span>{role.label}</span></label>) : <p>No roles available.</p>}</div><div className="admin-create-actions"><button className="primary-button" type="button" onClick={saveRoleEditor} disabled={saving}>Save Roles</button><button className="secondary-button" type="button" onClick={() => setRoleEditor(null)} disabled={saving}>Cancel</button></div></div></div>}
    <p className="admin-note">Roles, capabilities, participants, and controlled participant types are backed by Supabase. Participant ↔ Role is now editable as a relationship subtable.</p>
  </section>;
}
