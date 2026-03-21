'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useLeads } from '@/hooks/use-leads'
import {
  Search, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, Plus, Phone, Settings, Award, ShoppingBag,
  Zap, ArrowRight, Hash, Mail, Gauge, LayoutDashboard,
  FileText, Star, Clock
} from 'lucide-react'

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

  const pages = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', shortcut: 'G D' },
    { id: 'cockpit', label: 'Cockpit', icon: Zap, path: '/cockpit', shortcut: 'G C' },
    { id: 'leads', label: 'Leads', icon: Users, path: '/leads', shortcut: 'G L' },
    { id: 'pipeline', label: 'Pipeline', icon: Gauge, path: '/pipeline', shortcut: 'G P' },
    { id: 'sessions', label: 'Sessions', icon: Calendar, path: '/sessions', shortcut: 'G S' },
    { id: 'stagiaires', label: 'Stagiaires', icon: GraduationCap, path: '/stagiaires' },
    { id: 'financement', label: 'Financement', icon: CreditCard, path: '/financement' },
    { id: 'commandes', label: 'E-Shop', icon: ShoppingBag, path: '/commandes' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'qualite', label: 'Qualité', icon: Award, path: '/qualite' },
    { id: 'equipe', label: 'Équipe', icon: Phone, path: '/equipe' },
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' },
  ], [])

  const actions = useMemo(() => [
    { id: 'new-lead', label: 'Créer un lead', icon: Plus, path: '/leads?new=1', keywords: 'nouveau ajouter créer lead prospect' },
    { id: 'new-session', label: 'Planifier une session', icon: Calendar, path: '/sessions?new=1', keywords: 'nouvelle session planifier formation' },
    { id: 'export', label: 'Exporter les données', icon: FileText, path: '/settings#export', keywords: 'export csv json données' },
  ], [])

  if (!open) return null

  const hasSearchResults = query.length >= 2 && searchResults?.leads && searchResults.leads.length > 0

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
          shouldFilter={!hasSearchResults}
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

          <Command.List className="max-h-[360px] overflow-y-auto p-1.5">
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-[#2EC6F3]/5 transition"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: getColor(lead.prenom + lead.nom) }}
                    >
                      {lead.prenom[0]}{lead.nom[0]}
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
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-[#2EC6F3] cursor-pointer data-[selected=true]:bg-[#2EC6F3]/5 transition"
                  >
                    Voir les {searchResults!.total} résultats <ArrowRight className="w-3 h-3" />
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {/* Actions rapides */}
            <Command.Group heading="Actions rapides">
              {actions.map(item => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.keywords || ''}`}
                  onSelect={() => go(item.path)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-[#2EC6F3]/5 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2EC6F3]/8 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-[#2EC6F3]" />
                  </div>
                  <span className="flex-1 text-gray-700">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Pages">
              {pages.map(item => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => go(item.path)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer data-[selected=true]:bg-[#2EC6F3]/5 transition"
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
  const colors = ['#2EC6F3', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
