import { headers } from 'next/headers'
import DashboardShell from '@/components/DashboardShell'

// CRITICAL: Force dynamic rendering for ALL dashboard pages
// This prevents Next.js from trying to pre-render pages at build time
// which would fail because Supabase env vars aren't available during SSG
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Reading headers() forces dynamic rendering at the framework level
  await headers()

  return <DashboardShell>{children}</DashboardShell>
}
