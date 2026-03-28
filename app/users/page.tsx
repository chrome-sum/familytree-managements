import { redirect } from 'next/navigation'
import UserManagementPanel from '@/components/UserManagementPanel'
import { listUsersByAdmin } from '@/lib/actions-auth'
import { requireRole } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  let session
  let users

  try {
    session = await requireRole(['admin'])
    users = await listUsersByAdmin()
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      redirect('/login')
    }

    redirect('/')
  }

  return <UserManagementPanel users={users} currentUserId={session.id} />
}

