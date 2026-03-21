import { headers } from 'next/headers'

// Force all dashboard pages to be dynamically rendered
// This prevents SSG from trying to pre-render pages that need Supabase
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function DashboardTemplate({ children }: { children: React.ReactNode }) {
  // Reading headers forces dynamic rendering
  await headers()
  return <>{children}</>
}
