import { Headphones, Briefcase, Settings } from 'lucide-react'
import { TreeNode, TreeProvider } from '../components/AppTree'

export type SupportableView = 'Work' | 'Manage'

export function createSupportableTreeProvider(onSelect: (view: SupportableView) => void): TreeProvider {
  return {
    getTree: (): TreeNode[] => [{
      id: 'supportable',
      label: 'Supportable',
      icon: <Headphones size={21} />,
      onSelect: () => onSelect('Work'),
      children: [
        { id: 'supportable-work', label: 'Work', icon: <Briefcase size={18} />, onSelect: () => onSelect('Work') },
        { id: 'supportable-manage', label: 'Manage', icon: <Settings size={18} />, onSelect: () => onSelect('Manage') },
      ],
    }],
  }
}
