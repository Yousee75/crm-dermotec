'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search, Users, Calendar, GraduationCap, CreditCard,
  BarChart3, Plus, Phone, Settings, Award, ShoppingBag
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  category: string
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Ctrl+K pour ouvrir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const items: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', icon: BarChart3, action: () => router.push('/'), category: 'Navigation' },
    { id: 'nav-leads', label: 'Leads', icon: Users, action: () => router.push('/leads'), category: 'Navigation' },
    { id: 'nav-sessions', label: 'Sessions', icon: Calendar, action: () => router.push('/sessions'), category: 'Navigation' },
    { id: 'nav-stagiaires', label: 'Stagiaires', icon: GraduationCap, action: () => router.push('/stagiaires'), category: 'Navigation' },
    { id: 'nav-financement', label: 'Financement', icon: CreditCard, action: () => router.push('/financement'), category: 'Navigation' },
    { id: 'nav-eshop', label: 'E-Shop', icon: ShoppingBag, action: () => router.push('/commandes'), category: 'Navigation' },
    { id: 'nav-analytics', label: 'Analytics', icon: BarChart3, action: () => router.push('/analytics'), category: 'Navigation' },
    { id: 'nav-qualite', label: 'Qualité', icon: Award, action: () => router.push('/qualite'), category: 'Navigation' },
    { id: 'nav-settings', label: 'Paramètres', icon: Settings, action: () => router.push('/settings'), category: 'Navigation' },
    // Actions rapides
    { id: 'action-new-lead', label: 'Nouveau lead', icon: Plus, action: () => router.push('/leads?new=1'), category: 'Actions', keywords: 'créer ajouter' },
    { id: 'action-new-session', label: 'Nouvelle session', icon: Plus, action: () => router.push('/sessions?new=1'), category: 'Actions', keywords: 'créer planifier' },
    { id: 'action-appeler', label: 'Appeler un lead', icon: Phone, action: () => router.push('/leads?action=call'), category: 'Actions', keywords: 'téléphone contact' },
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Command */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <Command.Input
              placeholder="Rechercher leads, formations, actions..."
              className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-400">
              Aucun résultat
            </Command.Empty>

            {['Navigation', 'Actions'].map(category => (
              <Command.Group key={category} heading={category} className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {items
                  .filter(i => i.category === category)
                  .map(item => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords || ''}`}
                      onSelect={() => { item.action(); setOpen(false) }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-gray-50 data-[selected=true]:bg-[#2EC6F3]/5 data-[selected=true]:text-[#2EC6F3] transition"
                    >
                      <item.icon className="w-4 h-4 opacity-60" />
                      {item.label}
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>↑↓ naviguer · ↵ sélectionner · ESC fermer</span>
            <span>Ctrl+K</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
