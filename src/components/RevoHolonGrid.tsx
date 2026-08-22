import { useMemo } from 'react'
import { RevoGrid } from '@revolist/revogrid-react'
import { defineCustomElements } from '@revolist/revogrid/loader'

defineCustomElements()

type HolonRow = {
  id: string
  holon: string
  type: string
  parent: string
  state: string
}

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

  return (
    <section className="revo-holon-panel" aria-label="Holon grid">
      <div className="revo-holon-heading">
        <div>
          <div className="app-kicker">Holon Grid</div>
          <h2>Tree → Grid</h2>
        </div>
        <span>Compact dark</span>
      </div>
      <div className="revo-holon-grid-wrap">
        <RevoGrid
          source={source}
          columns={columns}
          theme="darkCompact"
          hideAttribution
          resize
          range
          stretch="last"
          readonly
          style={{ height: '220px', width: '100%' }}
        />
      </div>
    </section>
  )
}
