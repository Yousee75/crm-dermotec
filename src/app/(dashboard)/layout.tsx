'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, ShoppingBag, Settings, Award, Phone, LogOut,
  ChevronLeft, Menu, Zap, ChevronRight, Bell, Search,
  Gauge, PanelLeft
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface NavSection {
  label?: string
  items: NavItem[]
}

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: string | number
  badgeVariant?: 'primary' | 'error' | 'warning'
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/cockpit', icon: Zap, label: 'Cockpit' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { href: '/leads', icon: Users, label: 'Leads' },
      { href: '/pipeline', icon: Gauge, label: 'Pipeline' },
      { href: '/financement', icon: CreditCard, label: 'Financement' },
    ],
  },
  {
    label: 'Formation',
    items: [
      { href: '/sessions', icon: Calendar, label: 'Sessions' },
      { href: '/stagiaires', icon: GraduationCap, label: 'Stagiaires' },
      { href: '/qualite', icon: Award, label: 'Qualité' },
    ],
  },
  {
    label: 'Outils',
    items: [
      { href: '/commandes', icon: ShoppingBag, label: 'E-Shop' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/equipe', icon: Phone, label: 'Équipe' },
    ],
  },
]

function SidebarLink({ item, collapsed, isActive }: { item: NavItem; collapsed: boolean; isActive: boolean }) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-150',
        isActive
          ? 'bg-white/10 text-white font-medium shadow-sm shadow-black/10'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
        collapsed && 'justify-center px-2 mx-1'
      )}
    >
      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-[#2EC6F3]')} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && (
            <Badge
              variant={item.badgeVariant === 'error' ? 'error' : item.badgeVariant === 'warning' ? 'warning' : 'primary'}
              size="sm"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right" delay={0}>
        {content}
      </Tooltip>
    )
  }

  return content
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && href !== '/cockpit' && pathname.startsWith(href))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-[#082545]',
          collapsed ? 'w-[60px]' : 'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:relative'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-[56px] px-3 border-b border-white/[0.06]',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center font-bold text-sm text-white shadow-md shadow-[#2EC6F3]/20 group-hover:shadow-lg group-hover:shadow-[#2EC6F3]/30 transition-shadow">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[13px] text-white leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Dermotec
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">CRM v2.0</span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center font-bold text-sm text-white shadow-md shadow-[#2EC6F3]/20">
              D
            </Link>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-4">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.label && !collapsed && (
                <p className="px-5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {section.label}
                </p>
              )}
              {collapsed && section.label && (
                <div className="mx-auto w-6 h-px bg-white/10 my-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-2 space-y-1">
          {/* Expand button when collapsed */}
          {collapsed && (
            <Tooltip content="Agrandir le menu" side="right" delay={0}>
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* User area */}
          <div className={cn(
            'flex items-center gap-2.5 rounded-lg p-2 hover:bg-white/5 transition cursor-pointer group',
            collapsed && 'justify-center'
          )}>
            <Avatar name="Admin" size="sm" color="#2EC6F3" status="online" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-300 truncate">Admin</p>
                <p className="text-[10px] text-slate-500 truncate">Dermotec CRM</p>
              </div>
            )}
          </div>

          {/* Logout */}
          {collapsed ? (
            <Tooltip content="Déconnexion" side="right" delay={0}>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between h-[56px] px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* Collapse toggle desktop */}
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="hidden md:flex p-1.5 -ml-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              {/* Current page title */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  {getCurrentPageTitle(pathname)}
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              {/* Search shortcut */}
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <Search className="w-4 h-4" />
                <span className="hidden md:block text-xs">Rechercher</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-400 border border-gray-200">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <Bell className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  )
}

function getCurrentPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/leads': 'Leads',
    '/pipeline': 'Pipeline',
    '/sessions': 'Sessions',
    '/stagiaires': 'Stagiaires',
    '/financement': 'Financement',
    '/commandes': 'E-Shop',
    '/analytics': 'Analytics',
    '/qualite': 'Qualité',
    '/equipe': 'Équipe',
    '/settings': 'Paramètres',
    '/cockpit': 'Cockpit',
  }

  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || (path !== '/' && pathname.startsWith(path))) {
      return title
    }
  }
  return 'Dermotec CRM'
}
