import { NextResponse } from 'next/server'
import { hasAnyAdmin } from '@/lib/actions-auth'

export async function GET() {
  const canInitialize = !(await hasAnyAdmin())
  return NextResponse.json({ canInitialize })
}
