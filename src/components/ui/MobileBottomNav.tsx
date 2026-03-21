'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Zap, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/cockpit', icon: Zap, label: 'Cockpit' },
  { href: '/sessions', icon: Calendar, label: 'Sessions' },
  { href: '/analytics', icon: BarChart3, label: 'Plus' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200 safe-area-bottom">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors',
                'min-h-[52px]',
                'active:scale-95',
                isActive
                  ? 'text-[#2EC6F3]'
                  : 'text-gray-400'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-sm')} />
              <span className={cn(
                'text-[11px] leading-none',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#2EC6F3] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
