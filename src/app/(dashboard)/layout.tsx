'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, ShoppingBag, Settings, Award, Phone, LogOut,
  ChevronLeft, Menu
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/sessions', icon: Calendar, label: 'Sessions' },
  { href: '/stagiaires', icon: GraduationCap, label: 'Stagiaires' },
  { href: '/financement', icon: CreditCard, label: 'Financement' },
  { href: '/commandes', icon: ShoppingBag, label: 'E-Shop' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/qualite', icon: Award, label: 'Qualité' },
  { href: '/equipe', icon: Phone, label: 'Équipe' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-[#082545] text-white transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative
        `}
      >
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2EC6F3] flex items-center justify-center font-bold text-sm">D</div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Dermotec CRM</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block p-1 hover:bg-white/10 rounded">
            <ChevronLeft className={`w-4 h-4 transition ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition
                  ${isActive
                    ? 'bg-[#2EC6F3]/15 text-[#2EC6F3] font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Dermotec CRM</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
