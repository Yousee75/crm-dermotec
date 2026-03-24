'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, CheckCheck, Users, CreditCard, Calendar,
  GraduationCap, MessageSquare, AlertTriangle, Clock,
  TrendingUp
} from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  lead: { icon: Users, color: 'text-[#6B8CAE]', bg: 'bg-[#E0EBF5]' },
  paiement: { icon: CreditCard, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  inscription: { icon: GraduationCap, color: 'text-[#FF8C42]', bg: 'bg-[#FFF3E8]' },
  session: { icon: Calendar, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  rappel: { icon: Clock, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  systeme: { icon: Bell, color: 'text-[#777777]', bg: 'bg-[#F4F0EB]' },
  alerte: { icon: AlertTriangle, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  message: { icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-50' },
}

function NotificationItem({
  notif,
  onRead,
  onClose,
}: {
  notif: Notification
  onRead: (id: string) => void
  onClose: () => void
}) {
  const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.systeme
  const Icon = config.icon

  const handleClick = () => {
    if (!notif.lu) onRead(notif.id)
    onClose()
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition border-b border-[#FAF8F5] cursor-pointer',
        !notif.lu
          ? 'bg-primary/[0.04] hover:bg-primary/[0.08]'
          : 'hover:bg-[#FAF8F5]'
      )}
      onClick={notif.lien ? undefined : handleClick}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
        <Icon className={cn('w-3.5 h-3.5', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            'text-xs font-medium truncate',
            !notif.lu ? 'text-[#111111]' : 'text-[#777777]'
          )}>
            {notif.titre}
          </p>
          {!notif.lu && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-[#777777] truncate mt-0.5">{notif.message}</p>
        <p className="text-[10px] text-[#999999] mt-0.5">{formatRelativeDate(notif.created_at)}</p>
      </div>
    </div>
  )

  if (notif.lien) {
    return (
      <Link href={notif.lien} onClick={handleClick} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    // Ajouter un delai pour eviter de fermer immediatement apres l'ouverture
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg text-[#999999] hover:bg-[#F4F0EB] hover:text-[#777777] transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2D78] text-[10px] font-bold text-white px-1 animate-in fade-in zoom-in duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-white rounded-xl shadow-xl border border-[#F4F0EB] z-50 overflow-hidden animate-scaleIn origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4F0EB]">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#111111]">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                }}
                className="flex items-center gap-1 text-[11px] text-[#999999] hover:text-primary transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-[#EEEEEE] border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#999999] mt-2">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-[#EEEEEE] mx-auto mb-2" />
                <p className="text-xs text-[#999999]">Aucune notification</p>
                <p className="text-[10px] text-[#999999] mt-0.5">Vous etes a jour</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={markAsRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs text-primary font-medium hover:bg-[#FAF8F5] transition border-t border-[#F4F0EB]"
            >
              Voir toutes les notifications
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
