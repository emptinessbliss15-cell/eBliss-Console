import { useEffect, useState } from 'react'
import { List, ListTree } from 'lucide-react'
import type { TreeNode } from '@ebliss/tree'
import { supabase } from '../lib/supabase'

type ListRecord = {
  id: string
  name: string
  parent_list_id: string | null
  position: number
}

function buildNodes(records: ListRecord[]): TreeNode[] {
  const byParent = new Map<string | null, ListRecord[]>()
  for (const record of records) {
    const group = byParent.get(record.parent_list_id) ?? []
    group.push(record)
    byParent.set(record.parent_list_id, group)
  }

  const makeNodes = (parentId: string | null, ancestors = new Set<string>()): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
      .map((record) => {
        if (ancestors.has(record.id)) {
          return {
            id: `list-${record.id}`,
            label: `${record.name} (cycle)`,
            icon: <ListTree size={18} />,
          }
        }

        const nextAncestors = new Set(ancestors)
        nextAncestors.add(record.id)
        return {
          id: `list-${record.id}`,
          label: record.name,
          icon: <ListTree size={18} />,
          children: makeNodes(record.id, nextAncestors),
        }
      })

  return [{
    id: 'lists',
    label: 'Lists',
    icon: <List size={21} />,
    children: makeNodes(null),
  }]
}

export function useListsTree(): TreeNode[] {
  const [records, setRecords] = useState<ListRecord[]>([])

  useEffect(() => {
    let mounted = true

    async function load(userId: string | undefined) {
      if (!userId) {
        if (mounted) setRecords([])
        return
      }

      const { data, error } = await supabase
        .from('lists')
        .select('id,name,parent_list_id,position')
        .order('position', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Unable to load Lists tree:', error)
        return
      }
      if (mounted) setRecords((data ?? []) as ListRecord[])
    }

    supabase.auth.getSession().then(({ data }) => {
      void load(data.session?.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user.id)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return buildNodes(records)
}
