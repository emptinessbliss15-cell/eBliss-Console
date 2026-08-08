import { useMemo, useState } from "react";
import { LookupSelect } from "./LookupSelect";

export type DataColumn<T> = {
  key: keyof T & string;
  label: string;
  editor?: "text" | "lookup";
  options?: { value: string; label: string }[];
};

type DataTableProps<T extends { id: string }> = {
  rows: T[];
  columns: DataColumn<T>[];
  onChange?: (row: T) => void;
  onDelete?: (row: T) => void;
};

export function DataTable<T extends { id: string }>({ rows, columns, onChange, onDelete }: DataTableProps<T>) {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<keyof T & string>(columns[0]?.key ?? "id");
  const [ascending, setAscending] = useState(true);

  const visibleRows = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return [...rows]
      .filter((row) => !query || columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(query)))
      .sort((a, b) => {
        const av = String(a[sort] ?? "");
        const bv = String(b[sort] ?? "");
        return (av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }) || 0) * (ascending ? 1 : -1);
      });
  }, [rows, columns, filter, sort, ascending]);

  function update(row: T, key: keyof T & string, value: string) {
    onChange?.({ ...row, [key]: value } as T);
  }

  return <div className="data-table-wrap">
    <div className="data-table-toolbar">
      <input aria-label="Filter records" placeholder="Filter..." value={filter} onChange={(event) => setFilter(event.target.value)} />
      <span>{visibleRows.length} record{visibleRows.length === 1 ? "" : "s"}</span>
    </div>
    <div className="data-table-scroll">
      <table className="data-table">
        <thead><tr>{columns.map((column) => <th key={column.key}><button type="button" onClick={() => { if (sort === column.key) setAscending((value) => !value); else { setSort(column.key); setAscending(true); } }}>{column.label} {sort === column.key ? (ascending ? "↑" : "↓") : ""}</button></th>)}<th aria-label="Actions" /></tr></thead>
        <tbody>{visibleRows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.editor === "lookup" ? <LookupSelect value={String(row[column.key] ?? "")} options={column.options ?? []} onChange={(value) => update(row, column.key, value)} /> : <input value={String(row[column.key] ?? "")} onChange={(event) => update(row, column.key, event.target.value)} />}</td>)}<td><button className="table-delete" type="button" onClick={() => onDelete?.(row)}>Delete</button></td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
