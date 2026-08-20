import { List } from 'lucide-react'
import { TreeNode, TreeProvider } from '../components/AppTree'

export function createListsTreeProvider(onSelect: () => void): TreeProvider {
  return {
    getTree: (): TreeNode[] => [{
      id: 'lists',
      label: 'Lists',
      icon: <List size={21} />,
      onSelect,
    }],
  }
}
