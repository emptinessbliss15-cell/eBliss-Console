import { Headphones, Briefcase, Settings } from 'lucide-react'
import type { TreeNode } from '@ebliss/tree'

export type SupportableView = 'Work' | 'Manage'

export function createSupportableTree(): TreeNode[] {
  return [{
    id: 'supportable',
    label: 'Supportable',
    icon: <Headphones size={21} />,
    children: [
      { id: 'supportable-work', label: 'Work', icon: <Briefcase size={18} /> },
      { id: 'supportable-manage', label: 'Manage', icon: <Settings size={18} /> },
    ],
  }]
}
