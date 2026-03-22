'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Plus, BarChart3, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: "Aujourd'hui" },
  { href: '/leads', icon: Users, label: 'Prospects' },
  { href: '#fab', icon: Plus, label: '', isFab: true },
  { href: '/sessions', icon: Calendar, label: 'Formations' },
  { href: '/analytics', icon: BarChart3, label: 'Stats' },
]

const QUICK_ACTIONS = [
  { href: '/leads?action=create', label: 'Nouveau prospect', icon: Users, color: '#2EC6F3' },
  { href: '/sessions?action=create', label: 'Nouvelle formation', icon: Calendar, color: '#10B981' },
  { href: '/financement', label: 'Financement', icon: CreditCard, color: '#F59E0B' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <>
      {/* Quick actions overlay */}
      {fabOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setFabOpen(false)}>
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-3 items-center animate-in slide-in-from-bottom-4 duration-200">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setFabOpen(false)}
                className="flex items-center gap-3 bg-white rounded-full pl-4 pr-5 py-3 shadow-xl"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${action.color}20` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-900">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/60" style={{ WebkitBackdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            if (item.isFab) {
              return (
                <button
                  key="fab"
                  onClick={() => setFabOpen(!fabOpen)}
                  className="flex-1 flex items-center justify-center -mt-5"
                >
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200',
                    fabOpen
                      ? 'bg-gray-800 rotate-45'
                      : 'bg-primary'
                  )}>
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </button>
              )
            }

            const isActive = pathname === item.href || (item.href !== '/' && (pathname ?? '').startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-all duration-150 relative',
                  'min-h-[52px]',
                  'active:scale-90',
                  isActive ? 'text-primary' : 'text-gray-400'
                )}
              >
                <item.icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  'text-[10px] leading-none tracking-wide',
                  isActive ? 'font-bold' : 'font-medium'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
