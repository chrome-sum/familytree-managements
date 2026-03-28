import { getTreeData } from '@/lib/actions'
import { FamilyTreeProvider } from '@/components/FamilyTreeContext'
import TreeContainer from '@/components/TreeContainer'
import { requireSession } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let data

  try {
    await requireSession()
    data = await getTreeData()
  } catch {
    redirect('/login')
  }

  return (
    <FamilyTreeProvider data={data}>
      <TreeContainer />
    </FamilyTreeProvider>
  )
}
