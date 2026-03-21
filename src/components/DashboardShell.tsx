'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, ShoppingBag, Settings, Award, Phone, LogOut,
  ChevronLeft, Menu, Zap, ChevronRight, Bell, Search,
  Gauge, PanelLeft, BookOpen, MessageSquare, Keyboard, HelpCircle
} from 'lucide-react'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useOverdueRappels, useTodayRappels } from '@/hooks/use-reminders'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { Badge } from '@/components/ui/Badge'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'
import { AgentChat } from '@/components/ui/AgentChat'
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
    // Mon travail — visible par tous, usage quotidien
    items: [
      { href: '/cockpit', icon: Zap, label: 'Aujourd\'hui' },
      { href: '/leads', icon: Users, label: 'Leads' },
      { href: '/pipeline', icon: Gauge, label: 'Pipeline' },
      { href: '/sessions', icon: Calendar, label: 'Sessions' },
    ],
  },
  {
    label: 'Outils',
    items: [
      { href: '/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/financement', icon: CreditCard, label: 'Financement' },
      { href: '/playbook', icon: BookOpen, label: 'Playbook' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
      { href: '/stagiaires', icon: GraduationCap, label: 'Stagiaires' },
      { href: '/commandes', icon: ShoppingBag, label: 'Commandes' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/qualite', icon: Award, label: 'Qualite' },
      { href: '/equipe', icon: Phone, label: 'Equipe' },
      { href: '/cadences', icon: Zap, label: 'Cadences' },
      { href: '/academy', icon: GraduationCap, label: 'Academy' },
      { href: '/settings', icon: Settings, label: 'Parametres' },
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

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Notification data
  const { data: overdueRappels } = useOverdueRappels()
  const { data: todayRappels } = useTodayRappels()
  const notifCount = (overdueRappels?.length || 0) + (todayRappels?.length || 0)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
    setNotifOpen(false)
  }, [pathname])

  // ? key opens shortcuts help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && href !== '/cockpit' && (pathname ?? '').startsWith(href))

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

          {/* Keyboard shortcuts link */}
          {collapsed ? (
            <Tooltip content="Raccourcis clavier (?)" side="right" delay={0}>
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300 transition"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setShowShortcuts(true)}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[12px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Raccourcis</span>
              <kbd className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-500">?</kbd>
            </button>
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
                  {getCurrentPageTitle(pathname ?? '/')}
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
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(prev => !prev)}
                  className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-scaleIn origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {overdueRappels && overdueRappels.length > 0 && overdueRappels.slice(0, 3).map(r => (
                          <Link
                            key={r.id}
                            href={r.lead_id ? `/lead/${r.lead_id}` : '/cockpit'}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-50/50 transition border-b border-gray-50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <Bell className="w-3.5 h-3.5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-red-600 truncate">Rappel en retard</p>
                              <p className="text-xs text-gray-400 truncate">{r.titre || r.type} · {r.lead?.prenom} {r.lead?.nom}</p>
                            </div>
                          </Link>
                        ))}
                        {todayRappels && todayRappels.length > 0 && todayRappels.slice(0, 3).map(r => (
                          <Link
                            key={r.id}
                            href={r.lead_id ? `/lead/${r.lead_id}` : '/cockpit'}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition border-b border-gray-50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Bell className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-amber-600 truncate">Rappel aujourd&apos;hui</p>
                              <p className="text-xs text-gray-400 truncate">{r.titre || r.type} · {r.lead?.prenom} {r.lead?.nom}</p>
                            </div>
                          </Link>
                        ))}
                        {notifCount === 0 && (
                          <div className="py-8 text-center">
                            <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">Aucune notification</p>
                          </div>
                        )}
                      </div>
                      {notifCount > 0 && (
                        <Link
                          href="/cockpit"
                          onClick={() => setNotifOpen(false)}
                          className="block px-4 py-2.5 text-center text-xs text-[#2EC6F3] font-medium hover:bg-gray-50 transition border-t border-gray-100"
                        >
                          Voir tout dans le Cockpit
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content with subtle transition */}
        <div
          key={pathname}
          className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-[1600px] mx-auto animate-fadeIn"
        >
          {children}
        </div>
      </main>

      {/* Global components */}
      <CommandPalette />
      <KeyboardShortcuts />
      <MobileBottomNav />
      <AgentChat />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setShowShortcuts(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 animate-scaleIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-[#2EC6F3]" />
                  <h2 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Raccourcis clavier</h2>
                </div>
                <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-gray-100 transition">
                  <span className="text-gray-400 text-lg leading-none">&times;</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Général</p>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['⌘', 'K']} label="Recherche rapide" />
                    <ShortcutRow keys={['N']} label="Nouveau lead" />
                    <ShortcutRow keys={['?']} label="Afficher les raccourcis" />
                    <ShortcutRow keys={['Esc']} label="Fermer dialog / panel" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Navigation (G puis...)</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <ShortcutRow keys={['G', 'D']} label="Dashboard" />
                    <ShortcutRow keys={['G', 'L']} label="Leads" />
                    <ShortcutRow keys={['G', 'P']} label="Pipeline" />
                    <ShortcutRow keys={['G', 'S']} label="Sessions" />
                    <ShortcutRow keys={['G', 'C']} label="Cockpit" />
                    <ShortcutRow keys={['G', 'F']} label="Financement" />
                    <ShortcutRow keys={['G', 'A']} label="Analytics" />
                    <ShortcutRow keys={['G', 'Q']} label="Qualité" />
                    <ShortcutRow keys={['G', 'E']} label="Équipe" />
                    <ShortcutRow keys={['G', 'T']} label="Paramètres" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd key={i} className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 bg-gray-100 rounded text-[10px] font-medium text-gray-500 border border-gray-200">
            {key}
          </kbd>
        ))}
      </div>
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
    '/cadences': 'Cadences',
    '/settings': 'Paramètres',
    '/cockpit': 'Aujourd\'hui',
    '/playbook': 'Playbook',
    '/messages': 'Messages',
  }

  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || (path !== '/' && pathname.startsWith(path))) {
      return title
    }
  }

  // Detail pages
  if (pathname.startsWith('/lead/')) return 'Fiche lead'
  if (pathname.startsWith('/session/')) return 'Détail session'

  return 'Dermotec CRM'
}
