import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listAuditLogsByAdmin } from '@/lib/actions-audit'
import { requireRole } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

function formatDetails(details: unknown) {
  if (!details || typeof details !== 'object') return '-'
  const text = JSON.stringify(details)
  return text.length > 140 ? `${text.slice(0, 140)}...` : text
}

export default async function AuditLogsPage() {
  try {
    await requireRole(['admin'])
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      redirect('/login')
    }

    redirect('/')
  }

  const logs = await listAuditLogsByAdmin(300)

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Audit Logs</h1>
          <p className="text-zinc-400 mt-1">Riwayat aksi admin/editor untuk keamanan dan pelacakan perubahan.</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300">
              Kembali ke silsilah
            </Link>
            <Link href="/users" className="text-emerald-400 hover:text-emerald-300">
              Kelola user
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400">
            Total Log: {logs.length}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80">
                <tr className="text-left text-zinc-400 border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Aktor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-200">{log.actor_email || '-'}</div>
                      <div className="text-xs text-zinc-500">{log.actor_role || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{log.target_type}</div>
                      <div className="text-xs text-zinc-500 break-all">{log.target_id || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs break-all">
                      {formatDetails(log.details)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Belum ada audit log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

