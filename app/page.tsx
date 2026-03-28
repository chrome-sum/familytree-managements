import { getTreeData } from '@/lib/actions'
import { FamilyTreeProvider } from '@/components/FamilyTreeContext'
import TreeContainer from '@/components/TreeContainer'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const data = await getTreeData()
  
  return (
    <FamilyTreeProvider data={data}>
      <TreeContainer />
    </FamilyTreeProvider>
  )
}
