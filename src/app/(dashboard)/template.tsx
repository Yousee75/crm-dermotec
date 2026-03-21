// Force all dashboard pages to be dynamic (not pre-rendered at build time)
// This prevents Supabase URL errors during static page generation
export const dynamic = 'force-dynamic'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
