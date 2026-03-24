import { getTreeData } from '@/lib/actions'
import { FamilyTreeProvider } from '@/components/FamilyTreeContext'
import TreeContainer from '@/components/TreeContainer'

export default async function Home() {
  const data = await getTreeData()
  
  return (
    <FamilyTreeProvider data={data}>
      <TreeContainer />
    </FamilyTreeProvider>
  )
}
