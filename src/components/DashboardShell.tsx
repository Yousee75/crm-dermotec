'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users, GraduationCap, CreditCard,
  ShoppingBag, Phone, LogOut,
  ChevronLeft, Menu, Zap, ChevronRight, Bell, Search,
  Gauge, PanelLeft, BookOpen, MessageSquare, Keyboard, HelpCircle, Shield, Eye,
  Building2, UserCheck, UserPlus, Kanban, Receipt, FileBarChart, ChevronDown, X, Wrench, Target,
  MessageCircle, Repeat
} from 'lucide-react'
import {
  HouseSimple, UsersThree, CalendarBlank,
  ChartBar, Certificate, GearSix,
  CreditCard as PhCreditCard,
} from '@phosphor-icons/react'
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
import { QuickAddLead } from '@/components/ui/QuickAddLead'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getRoleView } from '@/lib/role-config'
import { usePageTracker } from '@/hooks/use-tracker'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
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

// Sidebar : items principaux toujours visibles + sections dépliables
// Dashboard et Sessions = quotidien, toujours visible
// Le reste se déplie/replie, état mémorisé en localStorage

interface CollapsibleSection {
  id: string
  label: string
  icon: React.ElementType
  href: string // page principale de la section
  children: NavItem[]
}

// ============================================================
// SIDEBAR v2 — 7 sections claires, langage formateur
// Principe noCRM : "Qu'est-ce que je fais maintenant ?"
// ============================================================
// Phosphor wrapper — duotone weight pour la sidebar premium
function PhIcon(PhComponent: React.ElementType) {
  return function DuotoneIcon(props: { className?: string }) {
    return <PhComponent weight="duotone" {...props} />
  }
}

const TOP_ITEMS: NavItem[] = [
  { href: '/', icon: PhIcon(HouseSimple), label: "Aujourd'hui" },
  { href: '/leads', icon: PhIcon(UsersThree), label: 'Prospects' },
  { href: '/sessions', icon: PhIcon(CalendarBlank), label: 'Formations' },
  { href: '/financement', icon: PhIcon(PhCreditCard), label: 'Financement' },
  { href: '/analytics', icon: PhIcon(ChartBar), label: 'Tableau de bord' },
  { href: '/qualiopi', icon: PhIcon(Certificate), label: 'Qualite' },
  { href: '/parametres', icon: PhIcon(GearSix), label: 'Reglages' },
]

// Plus de sections dépliables — tout est accessible via les pages hub
// Messages et Notifications → dans le header
// Academy, Outils, Concurrents → Cmd+K ou liens depuis les pages
const COLLAPSIBLE_SECTIONS: CollapsibleSection[] = []

// Backward compat : garder NAV_SECTIONS pour le code existant
const NAV_SECTIONS: NavSection[] = [{ items: TOP_ITEMS }]

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
      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')} />
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
  // Auto-track navigation dans tout le CRM
  usePageTracker()

  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Rôle utilisateur — détermine la vue (commercial ne voit que ses leads)
  const { data: currentUser } = useCurrentUser()
  const roleView = getRoleView(currentUser?.role || 'admin')

  // Filtrer la sidebar par rôle
  const visibleTopItems = TOP_ITEMS.filter(item =>
    roleView.topItems.includes(item.href) && !roleView.hiddenPages.includes(item.href)
  )
  const visibleSections = COLLAPSIBLE_SECTIONS.filter(section =>
    roleView.sections.includes(section.id)
  ).map(section => ({
    ...section,
    children: section.children.filter(c => !roleView.hiddenPages.includes(c.href))
  }))

  // Sections dépliables — état persisté en localStorage
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>()
    try {
      const saved = localStorage.getItem('sidebar-expanded')
      return saved ? new Set(JSON.parse(saved)) : new Set<string>()
    } catch { return new Set<string>() }
  })
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

  const isActive = (href: string): boolean => {
    if (pathname === href) return true
    if (href === '/') return pathname === '/' || pathname === '/cockpit'

    const p = pathname ?? ''

    // Prospects : leads + pipeline + contacts + clients + fiche lead
    if (href === '/leads') {
      return p.startsWith('/leads') ||
             p.startsWith('/contacts') ||
             p.startsWith('/clients') ||
             p.startsWith('/pipeline') ||
             p.startsWith('/lead/') ||
             p.startsWith('/messages') ||
             p.startsWith('/cadences')
    }
    // Formations : sessions + inscriptions + stagiaires + émargement
    if (href === '/sessions') {
      return p.startsWith('/sessions') ||
             p.startsWith('/session/') ||
             p.startsWith('/inscriptions') ||
             p.startsWith('/apprenants') ||
             p.startsWith('/stagiaires') ||
             p.startsWith('/emargement') ||
             p.startsWith('/catalogue')
    }
    // Financement : financement + BPF
    if (href === '/financement') {
      return p.startsWith('/financement') ||
             p.startsWith('/bpf')
    }
    // Tableau de bord : analytics + performance + cockpit + audit
    if (href === '/analytics') {
      return p.startsWith('/analytics') ||
             p.startsWith('/performance') ||
             p.startsWith('/audit')
    }
    // Qualité : qualiopi + qualite
    if (href === '/qualiopi') {
      return p.startsWith('/qualiopi') ||
             p.startsWith('/qualite')
    }
    // Réglages : parametres + settings + equipe + facturation + commandes
    if (href === '/parametres') {
      return p.startsWith('/parametres') ||
             p.startsWith('/settings') ||
             p.startsWith('/equipe') ||
             p.startsWith('/facturation') ||
             p.startsWith('/commandes') ||
             p.startsWith('/onboarding')
    }

    return p.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-[#082545]',
          collapsed ? 'w-[64px]' : 'w-[240px]',
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
              <Image
                src="/logo-dermotec.png"
                alt="Dermotec"
                width={140}
                height={36}
                className="object-contain"
                priority
              />
            </Link>
          ) : (
            <Link href="/" className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center font-bold text-sm text-white shadow-md shadow-[#2EC6F3]/20">
              <Image
                src="/logo-dermotec.png"
                alt="D"
                width={32}
                height={32}
                className="object-contain rounded-lg"
                priority
              />
            </Link>
          )}

          {!collapsed && (
            <>
              {/* Bouton de fermeture mobile */}
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Bouton de collapse desktop */}
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:flex p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-slate-300 transition"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation — items fixes + sections dépliables */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-1">
          {/* Items toujours visibles — filtrés par rôle */}
          <div className="space-y-0.5">
            {visibleTopItems.map((item) => (
              <SidebarLink key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href)} />
            ))}
          </div>

          {/* Séparateur */}
          <div className="mx-3 h-px bg-white/[0.06] my-2" />

          {/* Sections dépliables — filtrées par rôle */}
          {visibleSections.map((section) => {
            const sectionActive = section.children.some(c => isActive(c.href)) || isActive(section.href)
            const isOpen = expandedSections.has(section.id) || sectionActive

            return (
              <div key={section.id}>
                {/* Header de section (cliquable pour déplier) */}
                <button
                  onClick={() => {
                    setExpandedSections(prev => {
                      const next = new Set(prev)
                      if (next.has(section.id)) next.delete(section.id)
                      else next.add(section.id)
                      // Sauvegarder en localStorage
                      try { localStorage.setItem('sidebar-expanded', JSON.stringify([...next])) } catch {}
                      return next
                    })
                  }}
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 w-[calc(100%-16px)]',
                    sectionActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                    collapsed && 'justify-center px-2 mx-1'
                  )}
                >
                  <section.icon className={cn('w-[18px] h-[18px] shrink-0', sectionActive && 'text-primary')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{section.label}</span>
                      <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 transition-transform duration-200', isOpen && 'rotate-180')} />
                    </>
                  )}
                </button>

                {/* Children (dépliables) */}
                {isOpen && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5 animate-fadeIn">
                    {section.children.map((item) => (
                      <SidebarLink key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
                <p className="text-sm font-medium text-gray-900">
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

              {/* Language Switcher */}
              <LocaleSwitcher compact />

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
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="block px-4 py-2.5 text-center text-xs text-primary font-medium hover:bg-gray-50 transition border-t border-gray-100"
                        >
                          Voir toutes les notifications
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
          className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1600px] mx-auto animate-fadeIn"
        >
          {children}
        </div>
      </main>

      {/* Global components */}
      <CommandPalette />
      <KeyboardShortcuts />
      <MobileBottomNav />
      <AgentChat />
      <QuickAddLead />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setShowShortcuts(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 animate-scaleIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-gray-900">Raccourcis clavier</h2>
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
                    <ShortcutRow keys={['G', 'D']} label="Aujourd'hui" />
                    <ShortcutRow keys={['G', 'L']} label="Prospects" />
                    <ShortcutRow keys={['G', 'P']} label="Pipeline" />
                    <ShortcutRow keys={['G', 'S']} label="Formations" />
                    <ShortcutRow keys={['G', 'F']} label="Financement" />
                    <ShortcutRow keys={['G', 'A']} label="Tableau de bord" />
                    <ShortcutRow keys={['G', 'Q']} label="Qualité" />
                    <ShortcutRow keys={['G', 'T']} label="Réglages" />
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
    '/': "Aujourd'hui",
    '/cockpit': "Aujourd'hui",
    '/leads': 'Prospects',
    '/pipeline': 'Suivi commercial',
    '/contacts': 'Contacts',
    '/clients': 'Clients',
    '/messages': 'Messages',
    '/cadences': 'Relances auto',
    '/sessions': 'Formations planifiées',
    '/inscriptions': 'Inscriptions',
    '/apprenants': 'Mes stagiaires',
    '/stagiaires': 'Mes stagiaires',
    '/emargement': 'Émargement',
    '/catalogue': 'Catalogue formations',
    '/financement': 'Financement',
    '/bpf': 'Bilan pédagogique',
    '/analytics': 'Tableau de bord',
    '/performance': 'Performance',
    '/audit': 'Audit',
    '/qualiopi': 'Qualité Qualiopi',
    '/qualite': 'Qualité',
    '/parametres': 'Réglages',
    '/settings': 'Réglages',
    '/equipe': 'Équipe',
    '/facturation': 'Facturation',
    '/commandes': 'Commandes',
    '/academy': 'Mon coaching',
    '/playbook': 'Scripts de vente',
    '/outils': 'Outils',
    '/concurrents': 'Concurrents',
    '/notifications': 'Notifications',
  }

  for (const [path, title] of Object.entries(titles)) {
    if (pathname === path || (path !== '/' && pathname.startsWith(path))) {
      return title
    }
  }

  if (pathname.startsWith('/lead/')) return 'Fiche prospect'
  if (pathname.startsWith('/session/')) return 'Détail formation'

  return 'Dermotec CRM'
}
