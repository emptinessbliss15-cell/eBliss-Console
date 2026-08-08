import { useMemo, useState } from "react";

type Option = { value: string; label: string };

type Props = { label: string; selected: string[]; options: Option[]; onChange: (values: string[]) => Promise<void> | void };

export function RelationshipEditor({ label, selected, options, onChange }: Props) {
  const [saving, setSaving] = useState(false);
  const available = useMemo(() => options.filter((option) => !selected.includes(option.value)), [options, selected]);
  async function change(values: string[]) { setSaving(true); try { await onChange(values); } finally { setSaving(false); } }
  return <div className="relationship-editor">
    <div className="relationship-label">{label}</div>
    <div className="relationship-values">
      {selected.length === 0 && <span className="relationship-empty">None assigned</span>}
      {selected.map((value) => { const option = options.find((item) => item.value === value); return <span className="relationship-chip" key={value}>{option?.label ?? value}<button type="button" aria-label={`Remove ${option?.label ?? value}`} onClick={() => change(selected.filter((item) => item !== value))} disabled={saving}>×</button></span>; })}
    </div>
    <select value="" onChange={(event) => event.target.value && change([...selected, event.target.value])} disabled={saving || available.length === 0} aria-label={`Add ${label}`}>
      <option value="">+ Add {label}</option>
      {available.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </div>;
}
