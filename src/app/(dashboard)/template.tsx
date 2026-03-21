export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
