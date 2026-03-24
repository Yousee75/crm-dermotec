'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  Upload,
  Download,
  Calendar,
  QrCode,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface ActionButton {
  id: string
  label: string
  icon: React.ElementType
  variant: 'primary' | 'secondary'
  onClick: () => void
}

export function SmartActionBar() {
  const pathname = usePathname()

  const getActionsForRoute = (path: string): ActionButton[] => {
    // Dashboard (/)
    if (path === '/' || path.startsWith('/cockpit') || path.startsWith('/analytics') || path.startsWith('/performance') || path.startsWith('/audit') || path.startsWith('/formatrice')) {
      return [
        {
          id: 'new-contact',
          label: 'Nouveau contact',
          icon: Plus,
          variant: 'primary',
          onClick: () => {
            // Ouvrir le dialog QuickAddLead
            const event = new CustomEvent('open-quick-add-lead')
            window.dispatchEvent(event)
          }
        },
        {
          id: 'schedule-session',
          label: 'Planifier session',
          icon: Calendar,
          variant: 'secondary',
          onClick: () => {
            window.location.href = '/sessions'
          }
        }
      ]
    }

    // Contacts (/contacts, /leads, /pipeline, etc.)
    if (path.startsWith('/contacts') || path.startsWith('/leads') || path.startsWith('/pipeline') || path.startsWith('/clients') || path.startsWith('/apprenants') || path.startsWith('/stagiaires') || path.startsWith('/cadences')) {
      return [
        {
          id: 'new-contact',
          label: 'Nouveau contact',
          icon: Plus,
          variant: 'primary',
          onClick: () => {
            const event = new CustomEvent('open-quick-add-lead')
            window.dispatchEvent(event)
          }
        },
        {
          id: 'import-csv',
          label: 'Importer CSV',
          icon: Upload,
          variant: 'secondary',
          onClick: () => {
            // TODO: Implémenter l'import CSV
            logger.debug('Import CSV action clicked', { service: 'ui', feature: 'import-csv' })
          }
        },
        {
          id: 'export',
          label: 'Exporter',
          icon: Download,
          variant: 'secondary',
          onClick: () => {
            // TODO: Implémenter l'export
            logger.debug('Export data action clicked', { service: 'ui', feature: 'export-data' })
          }
        }
      ]
    }

    // Fiche contact (/lead/[id])
    if (path.startsWith('/lead/')) {
      return [
        {
          id: 'call',
          label: 'Appeler',
          icon: Phone,
          variant: 'primary',
          onClick: () => {
            // TODO: Intégrer avec le système d'appel
            logger.debug('Call prospect action clicked', { service: 'ui', feature: 'call-prospect' })
          }
        },
        {
          id: 'email',
          label: 'Email',
          icon: Mail,
          variant: 'secondary',
          onClick: () => {
            // TODO: Ouvrir l'éditeur d'email
            logger.debug('Send email action clicked', { service: 'ui', feature: 'send-email' })
          }
        },
        {
          id: 'whatsapp',
          label: 'WhatsApp',
          icon: MessageCircle,
          variant: 'secondary',
          onClick: () => {
            // TODO: Ouvrir WhatsApp
            logger.debug('Send WhatsApp action clicked', { service: 'ui', feature: 'send-whatsapp' })
          }
        },
        {
          id: 'inscrire',
          label: 'Inscrire',
          icon: UserPlus,
          variant: 'secondary',
          onClick: () => {
            // TODO: Ouvrir le dialog d'inscription
            logger.debug('Enroll in formation action clicked', { service: 'ui', feature: 'enroll-formation' })
          }
        }
      ]
    }

    // Formations (/sessions)
    if (path.startsWith('/sessions') || path.startsWith('/session/') || path.startsWith('/inscriptions') || path.startsWith('/emargement') || path.startsWith('/catalogue') || path.startsWith('/financement') || path.startsWith('/bpf') || path.startsWith('/qualiopi') || path.startsWith('/qualite')) {
      return [
        {
          id: 'new-session',
          label: 'Nouvelle session',
          icon: Plus,
          variant: 'primary',
          onClick: () => {
            // TODO: Ouvrir le dialog de création de session
            logger.debug('Create new session action clicked', { service: 'ui', feature: 'create-session' })
          }
        },
        {
          id: 'qr-emargement',
          label: 'Émargement QR',
          icon: QrCode,
          variant: 'secondary',
          onClick: () => {
            window.location.href = '/emargement'
          }
        }
      ]
    }

    // Messages (/messages)
    if (path.startsWith('/messages') || path.startsWith('/notifications')) {
      return [
        {
          id: 'new-message',
          label: 'Nouveau message',
          icon: Send,
          variant: 'primary',
          onClick: () => {
            // TODO: Ouvrir l'éditeur de message
            logger.debug('New message action clicked', { service: 'ui', feature: 'new-message' })
          }
        }
      ]
    }

    // Réglages - pas de barre d'action
    if (path.startsWith('/reglages') || path.startsWith('/parametres') || path.startsWith('/settings') || path.startsWith('/equipe') || path.startsWith('/facturation') || path.startsWith('/commandes') || path.startsWith('/onboarding')) {
      return []
    }

    return []
  }

  const actions = getActionsForRoute(pathname || '/')

  // Ne pas afficher la barre s'il n'y a pas d'actions
  if (actions.length === 0) {
    return null
  }

  return (
    <>
      {/* Version Mobile */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="md:hidden fixed bottom-[72px] left-0 right-0 px-4 pb-2 z-40"
      >
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-[#EEEEEE] rounded-2xl p-3">
          <div className="flex gap-2 overflow-x-auto">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                  action.variant === 'primary'
                    ? 'bg-[#FF5C00] text-white hover:bg-[#E65200] shadow-sm'
                    : 'bg-white border border-[#EEEEEE] text-[#111111] hover:bg-[#FAF8F5] hover:border-[#FF5C00]/20'
                )}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Version Desktop */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:block fixed bottom-6 right-6 z-40"
      >
        <div className="bg-white/95 backdrop-blur-sm shadow-lg border border-[#EEEEEE] rounded-2xl p-3">
          <div className="flex gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  action.variant === 'primary'
                    ? 'bg-[#FF5C00] text-white hover:bg-[#E65200] shadow-sm hover:shadow-md'
                    : 'bg-white border border-[#EEEEEE] text-[#111111] hover:bg-[#FAF8F5] hover:border-[#FF5C00]/20 hover:text-[#FF5C00]'
                )}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}