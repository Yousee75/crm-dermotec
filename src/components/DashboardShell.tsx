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
  HouseSimple, UsersThree, CalendarBlank, ChartBar, Certificate, GearSix,
  CreditCard as PhCreditCard, Chalkboard, Target as PhTarget, Megaphone, BookOpen as PhBookOpen,
  UserCircle, ClipboardText, GraduationCap as PhGraduationCap, Receipt as PhReceipt, Wallet, ShoppingBag as PhShoppingBag,
  TrendUp, ShieldCheck as PhShieldCheck, Eye as PhEye
} from '@phosphor-icons/react'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
// Rappels charges directement dans NotificationBell via use-notifications
import { NotificationBell } from '@/components/ui/NotificationBell'
import { createClient } from '@/lib/infra/supabase-client'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { Badge } from '@/components/ui/Badge'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { KeyboardShortcuts } from '@/components/ui/KeyboardShortcuts'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'
import { AgentPanel } from '@/components/agent'
import { QuickAddLead } from '@/components/ui/QuickAddLead'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { SmartActionBar } from '@/components/ui/SmartActionBar'
import { NotificationTestPanel } from '@/components/ui/NotificationTestPanel'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getRoleView } from '@/lib/role-config'
import { usePageTracker } from '@/hooks/use-tracker'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

interface NavSection {
  id: string
  label: string
  defaultOpen: boolean
  items: NavItem[]
}

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: string | number
  badgeVariant?: 'primary' | 'error' | 'warning'
}

// Sidebar Zen Futur : 5 sections métier collapsibles avec 20 items total
// Structure business-oriented pour améliorer la navigation


// ============================================================
// SIDEBAR Zen Futur — 5 sections métier collapsibles
// Navigation business-oriented pour centres de formation
// ============================================================
// Phosphor wrapper — duotone weight pour la sidebar premium
function PhIcon(PhComponent: React.ElementType) {
  return function DuotoneIcon(props: { className?: string }) {
    return <PhComponent weight="duotone" {...props} />
  }
}

const NAV_SECTIONS = [
  {
    id: 'quotidien',
    label: 'QUOTIDIEN',
    defaultOpen: true,
    items: [
      { href: '/', label: 'Tableau de bord', icon: PhIcon(HouseSimple) },
      { href: '/pipeline', label: 'Pipeline', icon: PhIcon(PhTarget) },
      { href: '/sessions', label: 'Sessions', icon: PhIcon(CalendarBlank) },
      { href: '/messages', label: 'Messages', icon: MessageSquare },  // This one uses Lucide
    ]
  },
  {
    id: 'commercial',
    label: 'COMMERCIAL',
    defaultOpen: true,
    items: [
      { href: '/leads', label: 'Leads', icon: PhIcon(UsersThree) },
      { href: '/contacts', label: 'Contacts', icon: PhIcon(UserCircle) },
      { href: '/cadences', label: 'Cadences', icon: PhIcon(Megaphone) },
      { href: '/playbook', label: 'Playbook', icon: PhIcon(PhBookOpen) },
    ]
  },
  {
    id: 'formation',
    label: 'FORMATION',
    defaultOpen: false,
    items: [
      { href: '/inscriptions', label: 'Inscriptions', icon: PhIcon(ClipboardText) },
      { href: '/stagiaires', label: 'Stagiaires', icon: PhIcon(PhGraduationCap) },
      { href: '/academy', label: 'Academy', icon: PhIcon(Chalkboard) },
      { href: '/catalogue', label: 'Catalogue', icon: PhIcon(Certificate) },
    ]
  },
  {
    id: 'gestion',
    label: 'GESTION',
    defaultOpen: false,
    items: [
      { href: '/facturation', label: 'Facturation', icon: PhIcon(PhReceipt) },
      { href: '/financement', label: 'Financement', icon: PhIcon(Wallet) },
      { href: '/commandes', label: 'Commandes', icon: PhIcon(PhShoppingBag) },
      { href: '/equipe', label: 'Équipe', icon: Users },  // Lucide Users
    ]
  },
  {
    id: 'pilotage',
    label: 'PILOTAGE',
    defaultOpen: false,
    items: [
      { href: '/analytics', label: 'Analytics', icon: PhIcon(ChartBar) },
      { href: '/performance', label: 'Performance', icon: PhIcon(TrendUp) },
      { href: '/qualiopi', label: 'Qualiopi', icon: PhIcon(PhShieldCheck) },
      { href: '/audit', label: 'Audit', icon: PhIcon(PhEye) },
    ]
  },
]

const BOTTOM_ITEMS = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reglages', label: 'Réglages', icon: PhIcon(GearSix) },
]


export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Auto-track navigation dans tout le CRM
  usePageTracker()

  const pathname = usePathname()

  // Rôle utilisateur — détermine la vue (commercial ne voit que ses leads)
  const { data: currentUser } = useCurrentUser()

  // Notifications realtime pour les alertes critiques (prospect chaud, financement stagnant, etc.)
  useRealtimeNotifications(currentUser?.auth_user_id)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  // Persister sidebar collapsed
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
    // Nettoyer le mode compact si activé par erreur
    document.documentElement.classList.remove('density-compact')
    localStorage.removeItem('density-compact')
  }, [collapsed])

  const roleView = getRoleView(currentUser?.role || 'admin')

  // Filtrer la sidebar par rôle
  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !roleView.hiddenPages.includes(item.href))
  })).filter(section => section.items.length > 0)

  // Sections dépliables — état persisté en localStorage
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(['quotidien', 'commercial'])
    try {
      const saved = localStorage.getItem('sidebar-expanded')
      if (saved) return new Set(JSON.parse(saved))
      return new Set(['quotidien', 'commercial'])
    } catch { return new Set(['quotidien', 'commercial']) }
  })
  const router = useRouter()
  const supabase = createClient()

  // Notification data gere par NotificationBell (temps reel)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
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
    // Simple: exact match or starts with path/
    if (href === '/') return pathname === '/'
    return pathname === href || (pathname?.startsWith(href + '/') ?? false)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-sidebar-bg',
          collapsed ? 'w-[64px]' : 'w-[260px]',
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
            <Link href="/" className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center font-bold text-sm text-white shadow-md shadow-primary/20">
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

        {/* Navigation — sections collapsibles */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-1">
          {visibleSections.map((section) => {
            const sectionActive = section.items.some(item => isActive(item.href))
            const isOpen = expandedSections.has(section.id) || sectionActive

            return (
              <div key={section.id}>
                {/* Section title (clickable to toggle) */}
                <button
                  onClick={() => {
                    setExpandedSections(prev => {
                      const next = new Set(prev)
                      if (next.has(section.id)) next.delete(section.id)
                      else next.add(section.id)
                      // Save to localStorage
                      try { localStorage.setItem('sidebar-expanded', JSON.stringify([...next])) } catch {}
                      return next
                    })
                  }}
                  className={cn(
                    'flex items-center gap-2.5 mx-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-[#666666] hover:text-[#999999] transition-colors w-[calc(100%-16px)]',
                    collapsed && 'justify-center'
                  )}
                >
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronDown className={cn('w-3 h-3 transition-transform duration-200',
                        isOpen ? 'rotate-0' : '-rotate-90'
                      )} />
                    </>
                  )}
                </button>

                {/* Section items */}
                {(isOpen || collapsed) && (
                  <div className={cn('space-y-0.5 mt-1', !collapsed && 'animate-fadeIn')}>
                    {section.items.map((item) => {
                      const active = isActive(item.href)
                      const content = (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 relative',
                            active
                              ? 'bg-[rgba(255,92,0,0.08)] text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:bg-primary before:rounded-r'
                              : 'text-[#999999] hover:bg-[#222222] hover:text-[#CCCCCC]',
                            collapsed && 'justify-center px-2 mx-1'
                          )}
                        >
                          <item.icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-primary fill-current')} />
                          {!collapsed && (
                            <span className="flex-1 truncate">{item.label}</span>
                          )}
                        </Link>
                      )

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href} content={item.label} side="right" delay={0}>
                            {content}
                          </Tooltip>
                        )
                      }

                      return <div key={item.href}>{content}</div>
                    })}
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

          {/* Bottom navigation items */}
          <div className="border-t border-white/10 mx-3 my-2" />
          {BOTTOM_ITEMS.map((item) => {
            const active = isActive(item.href)
            const content = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 relative',
                  active
                    ? 'bg-[rgba(255,92,0,0.08)] text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:bg-primary before:rounded-r'
                    : 'text-[#999999] hover:bg-[#222222] hover:text-[#CCCCCC]',
                  collapsed && 'justify-center px-2 mx-1'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-primary')} />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href} content={item.label} side="right" delay={0}>
                  {content}
                </Tooltip>
              )
            }

            return <div key={item.href}>{content}</div>
          })}

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
            <Avatar name={currentUser?.prenom || 'Utilisateur'} size="sm" color="var(--color-primary)" status="online" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-300 truncate">{currentUser?.prenom || 'Utilisateur'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser?.role || 'Commercial'}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          {collapsed ? (
            <Tooltip content="Déconnexion" side="right" delay={0}>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:bg-[#FF2D78]/10 hover:text-[#FF2D78] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-[#FF2D78]/10 hover:text-[#FF2D78] transition"
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
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-[56px] px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#F5F5F5] transition"
              >
                <Menu className="w-5 h-5 text-[#777777]" />
              </button>

              {/* Collapse toggle desktop */}
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="hidden md:flex p-1.5 -ml-1 rounded-md hover:bg-[#F5F5F5] text-[#999999] hover:text-[#777777] transition"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              {/* Current page title */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#111111]">
                  {getCurrentPageTitle(pathname ?? '/')}
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              {/* Search shortcut */}
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#999999] hover:bg-[#F5F5F5] hover:text-[#777777] transition">
                <Search className="w-4 h-4" />
                <span className="hidden md:block text-xs">Rechercher</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#F5F5F5] rounded text-[10px] font-medium text-[#999999] border border-[#F0F0F0]">
                  ⌘K
                </kbd>
              </button>

              {/* Espace réservé — density toggle supprimé (cassait les marges) */}

              {/* Theme toggle supprimé — Satorea light only */}

              {/* Language Switcher */}
              <LocaleSwitcher compact />

              {/* Notifications — temps reel */}
              <NotificationBell />
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
      <AgentPanel />
      <QuickAddLead />
      <OnboardingWizard />
      <SmartActionBar />
      <NotificationTestPanel />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setShowShortcuts(false)} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 animate-scaleIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#F0F0F0]/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-[#111111]">Raccourcis clavier</h2>
                </div>
                <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-[#F5F5F5] transition">
                  <span className="text-[#999999] text-lg leading-none">&times;</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999999] mb-2">Général</p>
                  <div className="space-y-1.5">
                    <ShortcutRow keys={['⌘', 'K']} label="Recherche rapide" />
                    <ShortcutRow keys={['N']} label="Nouveau lead" />
                    <ShortcutRow keys={['?']} label="Afficher les raccourcis" />
                    <ShortcutRow keys={['Esc']} label="Fermer dialog / panel" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999999] mb-2">Navigation (G puis...)</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <ShortcutRow keys={['G', 'D']} label="Tableau de bord" />
                    <ShortcutRow keys={['G', 'C']} label="Contacts" />
                    <ShortcutRow keys={['G', 'S']} label="Formations" />
                    <ShortcutRow keys={['G', 'M']} label="Messages" />
                    <ShortcutRow keys={['G', 'R']} label="Réglages" />
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
      <span className="text-xs text-[#777777]">{label}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd key={i} className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 bg-[#F5F5F5] rounded text-[10px] font-medium text-[#777777] border border-[#F0F0F0]">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}

function getCurrentPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': "Tableau de bord",
    '/cockpit': "Tableau de bord",
    '/analytics': 'Analytics',
    '/performance': 'Performance',
    '/audit': 'Audit',
    '/formatrice': 'Mon espace',
    '/contacts': 'Contacts',
    '/leads': 'Prospects',
    '/pipeline': 'Pipeline',
    '/clients': 'Clients',
    '/apprenants': 'Stagiaires',
    '/stagiaires': 'Stagiaires',
    '/cadences': 'Cadences',
    '/sessions': 'Formations',
    '/inscriptions': 'Inscriptions',
    '/emargement': 'Émargement',
    '/catalogue': 'Catalogue',
    '/financement': 'Financement',
    '/bpf': 'BPF',
    '/qualiopi': 'Qualiopi',
    '/qualite': 'Qualité',
    '/messages': 'Messages',
    '/notifications': 'Notifications',
    '/reglages': 'Réglages',
    '/parametres': 'Réglages',
    '/settings': 'Réglages',
    '/equipe': 'Équipe',
    '/facturation': 'Facturation',
    '/commandes': 'Commandes',
    '/academy': 'Academy',
    '/playbook': 'Playbook',
    '/outils': 'Outils',
    '/concurrents': 'Concurrents',
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
