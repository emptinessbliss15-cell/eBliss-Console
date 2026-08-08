import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "../../../../components/DataTable";

type RecordRow = { id: string; name: string; status: string; role?: string };

const roleOptions = ["Agent", "Helper", "Owner", "Requester"].map((name) => ({ value: name, label: name }));
const statusOptions = ["Active", "Draft", "Inactive"].map((name) => ({ value: name, label: name }));

const columns: Record<string, DataColumn<RecordRow>[]> = {
  roles: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status", editor: "lookup", options: statusOptions },
  ],
  capabilities: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status", editor: "lookup", options: statusOptions },
  ],
  participants: [
    { key: "name", label: "Name" },
    { key: "role", label: "Role", editor: "lookup", options: roleOptions },
    { key: "status", label: "Status", editor: "lookup", options: statusOptions },
  ],
};

const initial: Record<string, RecordRow[]> = {
  roles: [
    { id: "role-1", name: "Helper", status: "Active" },
    { id: "role-2", name: "Requester", status: "Active" },
    { id: "role-3", name: "Agent", status: "Draft" },
  ],
  capabilities: [
    { id: "cap-1", name: "Communication", status: "Active" },
    { id: "cap-2", name: "Research", status: "Active" },
    { id: "cap-3", name: "Screen Sharing", status: "Active" },
  ],
  participants: [
    { id: "participant-1", name: "Example Participant", role: "Requester", status: "Active" },
  ],
};

export function SupportableAdmin() {
  const [entity, setEntity] = useState<keyof typeof initial>("roles");
  const [records, setRecords] = useState(initial);
  const rows = records[entity];
  const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1);
  const singularLabel = entityLabel.endsWith("s") ? entityLabel.slice(0, -1) : entityLabel;
  const countLabel = useMemo(() => `${rows.length} ${entity}`, [rows.length, entity]);

  function updateRow(row: RecordRow) {
    setRecords((current) => ({ ...current, [entity]: current[entity].map((item) => item.id === row.id ? row : item) }));
  }

  function addRow() {
    setRecords((current) => ({ ...current, [entity]: [...current[entity], { id: crypto.randomUUID(), name: `New ${singularLabel}`, status: "Draft", ...(entity === "participants" ? { role: "Requester" } : {}) }] }));
  }

  function deleteRow(row: RecordRow) {
    setRecords((current) => ({ ...current, [entity]: current[entity].filter((item) => item.id !== row.id) }));
  }

  return <section className="supportable-admin">
    <div className="admin-heading"><div><div className="app-kicker">Manage</div><h2>Supportable data</h2><p>Reusable CRUD tables with relationship fields displayed by name.</p></div><button className="primary-button" type="button" onClick={addRow}>+ New {singularLabel}</button></div>
    <nav className="admin-tabs" aria-label="Supportable data types">{Object.keys(initial).map((key) => <button key={key} className={entity === key ? "active" : ""} type="button" onClick={() => setEntity(key as keyof typeof initial)}>{key}</button>)}</nav>
    <div className="admin-summary">{countLabel}</div>
    <DataTable rows={rows} columns={columns[entity]} onChange={updateRow} onDelete={deleteRow} />
    <p className="admin-note">This first pass establishes the UI pattern. Persistence and Supabase relationship metadata will be connected to the same components next.</p>
  </section>;
}
