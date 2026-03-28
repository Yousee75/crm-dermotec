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
import { toast } from 'sonner'
import { createClient } from '@/lib/infra/supabase-client'

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
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.csv'
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              toast.loading('Import en cours...')
              try {
                const text = await file.text()
                const lines = text.split('\n').filter(l => l.trim())
                if (lines.length < 2) { toast.dismiss(); toast.error('Fichier vide'); return }
                const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/"/g, ''))
                const supabase = createClient()
                let imported = 0
                for (let i = 1; i < lines.length; i++) {
                  const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''))
                  const row: Record<string, string> = {}
                  headers.forEach((h, idx) => { row[h] = values[idx] || '' })
                  const lead = {
                    prenom: row['prenom'] || row['prénom'] || row['firstname'] || '',
                    nom: row['nom'] || row['lastname'] || row['name'] || '',
                    email: row['email'] || row['mail'] || '',
                    telephone: row['telephone'] || row['tel'] || row['phone'] || '',
                    entreprise_nom: row['entreprise'] || row['societe'] || row['société'] || row['company'] || '',
                    ville: row['ville'] || row['city'] || '',
                    source: 'IMPORT_CSV',
                    statut: 'NOUVEAU',
                  }
                  if (!lead.nom && !lead.email) continue
                  const { error } = await supabase.from('leads').insert(lead)
                  if (!error) imported++
                }
                toast.dismiss()
                toast.success(`${imported} contacts importés sur ${lines.length - 1} lignes`)
              } catch (err) {
                toast.dismiss()
                toast.error('Erreur lors de l\'import')
              }
            }
            input.click()
          }
        },
        {
          id: 'export',
          label: 'Exporter',
          icon: Download,
          variant: 'secondary',
          onClick: async () => {
            toast.loading('Export en cours...')
            try {
              const supabase = createClient()
              const { data, error } = await supabase
                .from('leads')
                .select('prenom, nom, email, telephone, entreprise_nom, ville, statut, source, score_global, created_at')
                .order('created_at', { ascending: false })
                .limit(5000)
              if (error) throw error
              if (!data?.length) { toast.dismiss(); toast.info('Aucun contact à exporter'); return }
              const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Entreprise', 'Ville', 'Statut', 'Source', 'Score', 'Date création']
              const csvRows = [headers.join(';')]
              data.forEach((lead: any) => {
                csvRows.push([
                  lead.prenom || '', lead.nom || '', lead.email || '', lead.telephone || '',
                  lead.entreprise_nom || '', lead.ville || '', lead.statut || '', lead.source || '',
                  lead.score_global || '', lead.created_at?.split('T')[0] || ''
                ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
              })
              const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `contacts-dermotec-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              URL.revokeObjectURL(url)
              toast.dismiss()
              toast.success(`${data.length} contacts exportés`)
            } catch {
              toast.dismiss()
              toast.error('Erreur lors de l\'export')
            }
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
            // Ouvrir l'app de téléphone native
            window.location.href = 'tel:'
          }
        },
        {
          id: 'email',
          label: 'Email',
          icon: Mail,
          variant: 'secondary',
          onClick: () => {
            // Ouvrir le client email natif
            window.location.href = 'mailto:'
          }
        },
        {
          id: 'whatsapp',
          label: 'WhatsApp',
          icon: MessageCircle,
          variant: 'secondary',
          onClick: () => {
            // Ouvrir WhatsApp Web
            window.open('https://wa.me/', '_blank')
          }
        },
        {
          id: 'inscrire',
          label: 'Inscrire',
          icon: UserPlus,
          variant: 'secondary',
          onClick: () => {
            // TODO: Ouvrir le dialog d'inscription
            toast.info('Fonctionnalité à venir')
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
            toast.info('Fonctionnalité à venir')
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
            toast.info('Fonctionnalité à venir')
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