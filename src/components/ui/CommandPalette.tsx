'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useLeads } from '@/hooks/use-leads'
import {
  Search, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, Plus, Phone, Settings, Award, ShoppingBag,
  Zap, ArrowRight, Mail, Gauge, LayoutDashboard,
  FileText, Clock, BookOpen, MessageSquare, Send
} from 'lucide-react'

// Track recently viewed leads in sessionStorage
function getRecentLeads(): { id: string; name: string; email?: string }[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem('recentLeads') || '[]')
  } catch {
    return []
  }
}

export function trackLeadView(id: string, name: string, email?: string) {
  if (typeof window === 'undefined') return
  const recent = getRecentLeads().filter(l => l.id !== id)
  recent.unshift({ id, name, email })
  sessionStorage.setItem('recentLeads', JSON.stringify(recent.slice(0, 5)))
}

// Simple fuzzy match: checks if all characters of query appear in text in order
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let ti = 0
  for (let qi = 0; qi < q.length; qi++) {
    const idx = t.indexOf(q[qi], ti)
    if (idx === -1) return false
    ti = idx + 1
  }
  return true
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  // Search leads live when query length >= 2
  const { data: searchResults } = useLeads({
    search: query.length >= 2 ? query : undefined,
    per_page: 5,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const go = useCallback((path: string) => {
    router.push(path)
    setOpen(false)
    setQuery('')
  }, [router])

  const recentLeads = useMemo(() => getRecentLeads(), [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const pages = useMemo(() => [
    { id: 'dashboard', label: "Aujourd'hui", icon: LayoutDashboard, path: '/', shortcut: 'G D' },
    { id: 'leads', label: 'Prospects', icon: Users, path: '/leads', shortcut: 'G L' },
    { id: 'pipeline', label: 'Suivi commercial', icon: Gauge, path: '/pipeline', shortcut: 'G P' },
    { id: 'sessions', label: 'Formations', icon: Calendar, path: '/sessions', shortcut: 'G S' },
    { id: 'financement', label: 'Financement', icon: CreditCard, path: '/financement', shortcut: 'G F' },
    { id: 'analytics', label: 'Tableau de bord', icon: BarChart3, path: '/analytics', shortcut: 'G A' },
    { id: 'qualite', label: 'Qualité', icon: Award, path: '/qualiopi', shortcut: 'G Q' },
    { id: 'parametres', label: 'Réglages', icon: Settings, path: '/parametres', shortcut: 'G T' },
    { id: 'academy', label: 'Mon coaching', icon: GraduationCap, path: '/academy' },
    // Messages retiré — WhatsApp/SMS/Tel via applis natives sur la fiche lead
    { id: 'playbook', label: 'Scripts de vente', icon: BookOpen, path: '/playbook' },
    { id: 'stagiaires', label: 'Mes stagiaires', icon: GraduationCap, path: '/stagiaires' },
    { id: 'commandes', label: 'Commandes', icon: ShoppingBag, path: '/commandes' },
    { id: 'equipe', label: 'Équipe', icon: Phone, path: '/equipe', shortcut: 'G E' },
    { id: 'cadences', label: 'Relances auto', icon: Zap, path: '/cadences' },
    { id: 'outils', label: 'Outils', icon: Settings, path: '/outils' },
    { id: 'concurrents', label: 'Concurrents', icon: Users, path: '/concurrents' },
  ], [])

  // Détecter si on est sur une fiche lead
  const isLeadPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/lead/')
  const currentLeadId = isLeadPage ? window.location.pathname.split('/lead/')[1]?.split('/')[0] : null

  const actions = useMemo(() => [
    { id: 'new-lead', label: 'Nouveau prospect', icon: Plus, path: '/leads?new=1', shortcut: 'N', keywords: 'nouveau ajouter créer lead prospect' },
    { id: 'new-session', label: 'Planifier une formation', icon: Calendar, path: '/sessions?new=1', keywords: 'nouvelle session planifier formation' },
    // Envoyer email → directement via mailto sur la fiche lead
    { id: 'export', label: 'Exporter les données', icon: FileText, path: '/parametres', keywords: 'export csv json données' },
    // Actions contextuelles fiche lead
    ...(currentLeadId ? [
      { id: 'enrich-lead', label: 'Enrichir ce prospect (IA)', icon: Zap, path: '', shortcut: 'E', keywords: 'enrichir briefing analyse intelligence pipeline scraping', action: () => { const btn = document.querySelector('[data-action="enrich"]') as HTMLButtonElement; if (btn) btn.click() } },
      { id: 'pdf-lead', label: 'Rapport PDF', icon: FileText, path: '', shortcut: 'R', keywords: 'pdf rapport télécharger imprimer', action: () => window.open(`/api/enrichment/report/pdf?leadId=${currentLeadId}`, '_blank') },
      { id: 'word-lead', label: 'Rapport Word', icon: FileText, path: '', shortcut: 'W', keywords: 'word docx rapport télécharger briefing', action: () => window.open(`/api/enrichment/report/word?leadId=${currentLeadId}`, '_blank') },
    ] : []),
  ], [currentLeadId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter pages with fuzzy matching
  const filteredPages = useMemo(() => {
    if (!query) return pages
    return pages.filter(p => fuzzyMatch(p.label, query))
  }, [query, pages])

  const filteredActions = useMemo(() => {
    if (!query) return actions
    return actions.filter(a => fuzzyMatch(a.label + ' ' + (a.keywords || ''), query))
  }, [query, actions])

  if (!open) return null

  const hasSearchResults = query.length >= 2 && searchResults?.leads && searchResults.leads.length > 0
  const showRecent = !query && recentLeads.length > 0

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
        onClick={() => { setOpen(false); setQuery('') }}
      />

      {/* Command */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-full max-w-xl px-4 animate-scaleIn">
        <Command
          className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden"
          shouldFilter={false}
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Chercher un lead, une page, une action..."
              className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400 bg-transparent"
              autoFocus
            />
            <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-1.5">
            <Command.Empty className="py-10 text-center">
              <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun résultat pour &quot;{query}&quot;</p>
              <p className="text-xs text-gray-300 mt-1">Essayez un autre terme</p>
            </Command.Empty>

            {/* Live lead search results */}
            {hasSearchResults && (
              <Command.Group heading="Leads trouvés">
                {searchResults!.leads.map(lead => (
                  <Command.Item
                    key={lead.id}
                    value={`lead-${lead.id}`}
                    onSelect={() => go(`/lead/${lead.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-primary/5 transition"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: getColor(lead.prenom + (lead.nom || '')) }}
                    >
                      {lead.prenom[0]}{(lead.nom || '')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{lead.prenom} {lead.nom}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.email || lead.telephone || '—'} · {lead.formation_principale?.nom || 'Pas de formation'}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </Command.Item>
                ))}
                {searchResults!.total > 5 && (
                  <Command.Item
                    value="see-all-leads"
                    onSelect={() => go(`/leads?search=${encodeURIComponent(query)}`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-primary cursor-pointer data-[selected=true]:bg-primary/5 transition"
                  >
                    Voir les {searchResults!.total} résultats <ArrowRight className="w-3 h-3" />
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {/* Recently viewed leads */}
            {showRecent && (
              <Command.Group heading="Leads récents">
                {recentLeads.map(lead => (
                  <Command.Item
                    key={`recent-${lead.id}`}
                    value={`recent-${lead.id}-${lead.name}`}
                    onSelect={() => go(`/lead/${lead.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-primary/5 transition"
                  >
                    <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="flex-1 text-gray-600 truncate">{lead.name}</span>
                    {lead.email && <span className="text-xs text-gray-300 truncate max-w-[140px]">{lead.email}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions rapides */}
            {filteredActions.length > 0 && (
              <Command.Group heading="Actions rapides">
                {filteredActions.map(item => (
                  <Command.Item
                    key={item.id}
                    value={`action-${item.id}-${item.label}`}
                    onSelect={() => { if ((item as any).action) { (item as any).action(); setOpen(false); setQuery('') } else { go(item.path) } }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-primary/5 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="flex-1 text-gray-700">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            {filteredPages.length > 0 && (
              <Command.Group heading="Pages">
                {filteredPages.map(item => (
                  <Command.Item
                    key={item.id}
                    value={`page-${item.id}-${item.label}`}
                    onSelect={() => go(item.path)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-primary/5 transition"
                  >
                    <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="flex-1 text-gray-600">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> naviguer</span>
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded">↵</kbd> ouvrir</span>
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded">esc</kbd> fermer</span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-100 px-1 rounded">⌘K</kbd>
            </span>
          </div>
        </Command>
      </div>
    </div>
  )
}

function getColor(name: string): string {
  const colors = ['var(--color-primary)', '#8B5CF6', '#F59E0B', 'var(--color-success)', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
