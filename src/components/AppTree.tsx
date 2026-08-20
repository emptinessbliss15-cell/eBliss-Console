import { ReactNode } from 'react'

export interface TreeNode {
  id: string
  label: string
  icon: ReactNode
  children?: TreeNode[]
  onSelect?: () => void
}

export interface TreeProvider {
  getTree(): TreeNode[]
}

interface AppTreeProps {
  nodes: TreeNode[]
  activeId: string | null
}

export default function AppTree({ nodes, activeId }: AppTreeProps) {
  function renderNode(node: TreeNode, depth = 0): ReactNode {
    return <div key={node.id} className="tree-node-group">
      <button className={`tree-app ${depth > 0 ? 'tree-child' : ''} ${activeId === node.id ? 'active' : ''}`} onClick={node.onSelect} title={node.label} aria-label={node.label}>{node.icon}</button>
      {node.children?.map((child) => renderNode(child, depth + 1))}
    </div>
  }

  return <aside className="app-tree" aria-label="Apps">
    <div className="tree-title">Apps</div>
    {nodes.map((node) => renderNode(node))}
  </aside>
}
