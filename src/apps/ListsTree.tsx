import { useEffect, useState } from 'react'
import { List, ListTree } from 'lucide-react'
import { TreeNode, TreeProvider } from '../components/AppTree'
import { supabase } from '../lib/supabase'

type ListRecord = {
  id: string
  name: string
  parent_list_id: string | null
  position: number
}

function buildNodes(records: ListRecord[], onSelect: (id: string) => void): TreeNode[] {
  const byParent = new Map<string | null, ListRecord[]>()
  for (const record of records) {
    const group = byParent.get(record.parent_list_id) ?? []
    group.push(record)
    byParent.set(record.parent_list_id, group)
  }

  const makeNodes = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
      .map((record) => ({
        id: `list-${record.id}`,
        label: record.name,
        icon: <ListTree size={18} />,
        onSelect: () => onSelect(record.id),
        children: makeNodes(record.id),
      }))

  return [{
    id: 'lists',
    label: 'Lists',
    icon: <List size={21} />,
    children: makeNodes(null),
  }]
}

export function useListsTree(onSelect: (id: string) => void): TreeNode[] {
  const [records, setRecords] = useState<ListRecord[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await supabase
        .from('lists')
        .select('id,name,parent_list_id,position')
        .order('position', { ascending: true })
        .order('name', { ascending: true })

      if (!error && mounted) setRecords((data ?? []) as ListRecord[])
    }

    void load()
    return () => { mounted = false }
  }, [])

  return buildNodes(records, onSelect)
}

export function createListsTreeProvider(nodes: TreeNode[]): TreeProvider {
  return { getTree: () => nodes }
}
