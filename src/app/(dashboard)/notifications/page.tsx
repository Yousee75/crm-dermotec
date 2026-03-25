'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import {
  Bell, Check, CheckCheck, Trash2, Filter,
  AlertTriangle, CreditCard, Users, Calendar,
  GraduationCap, MessageSquare, TrendingUp, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

const NOTIF_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  lead: { icon: Users, color: 'text-[#6B8CAE]', bg: 'bg-[#E0EBF5]' },
  payment: { icon: CreditCard, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  session: { icon: Calendar, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  formation: { icon: GraduationCap, color: 'text-[#FF8C42]', bg: 'bg-[#FFF3E8]' },
  rappel: { icon: Clock, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  system: { icon: Bell, color: 'text-[#777777]', bg: 'bg-[#FAF8F5]' },
  alert: { icon: AlertTriangle, color: 'text-[#FF2D78]', bg: 'bg-[#FFE0EF]' },
  message: { icon: MessageSquare, color: 'text-[#FF5C00]', bg: 'bg-[#FFF0E5]' },
  analytics: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
}

interface Notification {
  id: string
  type: string
  title: string
  description: string
  link?: string
  read: boolean
  created_at: string
}

function useNotifications() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Charger depuis activites récentes + rappels en retard
      const [{ data: activites }, { data: rappels }] = await Promise.all([
        supabase
          .from('activites')
          .select('id, type, description, lead_id, session_id, created_at')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('rappels')
          .select('id, titre, description, type, date_rappel, lead_id, statut')
          .eq('statut', 'EN_ATTENTE')
          .lte('date_rappel', new Date().toISOString())
          .order('date_rappel', { ascending: true })
          .limit(10),
      ])

      const notifications: Notification[] = []

      // Rappels en retard → notifications urgentes
      for (const r of (rappels || [])) {
        notifications.push({
          id: `rappel-${r.id}`,
          type: 'rappel',
          title: r.titre || `Rappel ${r.type}`,
          description: r.description || `En retard depuis ${formatDate(r.date_rappel)}`,
          link: r.lead_id ? `/lead/${r.lead_id}` : '/cockpit',
          read: false,
          created_at: r.date_rappel,
        })
      }

      // Activités récentes → notifications
      for (const a of (activites || [])) {
        const typeMap: Record<string, string> = {
          LEAD_CREE: 'lead', STATUT_CHANGE: 'lead', PAIEMENT: 'payment',
          INSCRIPTION: 'formation', SESSION: 'session', EMAIL: 'message',
          SYSTEME: 'system',
        }
        notifications.push({
          id: `act-${a.id}`,
          type: typeMap[a.type] || 'system',
          title: a.type.replace(/_/g, ' '),
          description: a.description,
          link: a.lead_id ? `/lead/${a.lead_id}` : a.session_id ? `/session/${a.session_id}` : undefined,
          read: true, // Les activités sont "lues" par défaut
          created_at: a.created_at,
        })
      }

      return notifications.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
    staleTime: 30_000,
  })
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = notifications?.filter(n =>
    filter === 'unread' ? !n.read : true
  ) || []

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Notifications" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
      >
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications?.length || 0})
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </Button>
        </div>
      </PageHeader>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-10 h-10 text-[#999999] mx-auto mb-3" />
          <p className="text-[#777777] text-sm">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system
            const Icon = config.icon

            const content = (
              <div
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition hover:shadow-sm',
                  !notif.read
                    ? 'bg-primary/[0.03] border-primary/20'
                    : 'bg-white border-[#F4F0EB]'
                )}
              >
                <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', !notif.read ? 'text-accent' : 'text-[#3A3A3A]')}>
                      {notif.title}
                    </p>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-[#777777] mt-0.5 line-clamp-2">{notif.description}</p>
                  <p className="text-[10px] text-[#999999] mt-1">{formatDate(notif.created_at)}</p>
                </div>
              </div>
            )

            return notif.link ? (
              <Link key={notif.id} href={notif.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
