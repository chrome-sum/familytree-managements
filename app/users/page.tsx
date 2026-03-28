import { redirect } from 'next/navigation'
import UserManagementPanel from '@/components/UserManagementPanel'
import { getSession } from '@/lib/auth'
import { listUsersByAdmin } from '@/lib/actions-auth'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  if (session.role !== 'admin') {
    redirect('/')
  }

  const users = await listUsersByAdmin()

  return <UserManagementPanel users={users} currentUserId={session.id} />
}

