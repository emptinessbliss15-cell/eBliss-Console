import { useMemo } from 'react'
import { RevoGrid } from '@revolist/revogrid-react'
import { defineCustomElements } from '@revolist/revogrid/loader'

defineCustomElements()

type HolonRow = { id: string; holon: string; type: string; parent: string; state: string }

export function RevoHolonGrid() {
  const columns = useMemo(() => [
    { prop: 'holon', name: 'Holon', size: 220 },
    { prop: 'type', name: 'Type', size: 150 },
    { prop: 'parent', name: 'Parent', size: 220 },
    { prop: 'state', name: 'State', size: 130 },
  ], [])
  const source = useMemo<HolonRow[]>(() => [
    { id: 'supportable', holon: 'Supportable', type: 'App Holon', parent: 'eBliss Console', state: 'active' },
    { id: 'supportable-work', holon: 'Work', type: 'View Holon', parent: 'Supportable', state: 'active' },
    { id: 'supportable-manage', holon: 'Manage', type: 'View Holon', parent: 'Supportable', state: 'active' },
  ], [])

  return <>
    <style>{`
      .app-tree [role="tree"] { gap: 1px; }
      .app-tree [role="treeitem"] {
        min-height: 30px;
        padding: 4px 8px !important;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.2;
      }
      .revo-holon-panel {
        margin-top: 18px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .revo-holon-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .revo-holon-heading h2 { margin: 3px 0 0; font-size: 20px; }
      .revo-holon-heading > span {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .revo-holon-grid-wrap {
        height: 220px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: #080d18;
      }
      .revo-holon-grid-wrap revo-grid {
        display: block;
        width: 100%;
        height: 100%;
      }
    `}</style>
    <section className="revo-holon-panel" aria-label="Holon grid">
      <div className="revo-holon-heading">
        <div><div className="app-kicker">Holon Grid</div><h2>Tree → Grid</h2></div>
        <span>Compact dark</span>
      </div>
      <div className="revo-holon-grid-wrap">
        <RevoGrid source={source} columns={columns} theme="darkCompact" hideAttribution resize range stretch="last" readonly style={{ height: '220px', width: '100%' }} />
      </div>
    </section>
  </>
}
